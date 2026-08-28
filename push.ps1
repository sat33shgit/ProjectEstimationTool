# push.ps1 - stage, commit, and push to the Hope and Faith Foundation repo.
#
# Usage:
#   .\push.ps1                        # uses the default commit message
#   .\push.ps1 "Your commit message"  # uses your message
#
# If PowerShell blocks the script, run once:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

param(
    [string]$Message = "Bug fixes and enhancements",
    [string]$Token = $env:GH_TOKEN
)

# Identity
git config user.name "sat33shgit"
git config user.email "sateesh_b2000@yahoo.com"

# Keep the stored remote clean (no token in .git/config). NEVER hardcode a token
# in this file — GitHub push protection blocks it and committing a token leaks it.
# Pass the token in instead:
#   .\push.ps1 "commit message" "<your-personal-access-token>"
#   .\push.ps1 -Message "commit message" -Token "<your-personal-access-token>"
#   $env:GH_TOKEN = "<token>"; .\push.ps1 "commit message"
# If no token is supplied, Git Credential Manager handles authentication.
git remote set-url origin "https://github.com/sat33shgit/ProjectEstimationTool.git"

# Show status, then stage everything
git status
git add .

# Only commit if there is something staged (avoids an error on a clean tree)
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    git commit -m "$Message"
} else {
    Write-Host "Nothing to commit - skipping commit." -ForegroundColor Yellow
}

# Push to main. If a token was supplied, use it inline for this push only so it
# is never written to disk; otherwise push via the stored remote (credential
# manager).
if ($Token) {
    git push "https://sat33shgit:$Token@github.com/sat33shgit/ProjectEstimationTool.git" main
} else {
    git push origin main
}
