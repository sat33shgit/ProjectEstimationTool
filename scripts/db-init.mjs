// Initializes the database schema and seeds a sample website template.
// Usage: npm run db:init   (requires DATABASE_URL or POSTGRES_URL)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("ERROR: Set DATABASE_URL or POSTGRES_URL before running db:init.");
  process.exit(1);
}

const needsSsl = !/localhost|127\.0\.0\.1/.test(connectionString);
const pool = new pg.Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

const schema = readFileSync(join(__dirname, "..", "src", "lib", "schema.sql"), "utf8");

// Sample template: a typical website build.
const SEED = {
  name: "Standard Website Build",
  description: "Default estimation template covering research, design, and development of a typical marketing/website project.",
  tasks: [
    {
      name: "Discovery & Research",
      category: "Research",
      subtasks: [
        { name: "Stakeholder interviews", estimate_days: 2 },
        { name: "Competitor analysis", estimate_days: 1.5 },
        { name: "Requirements documentation", estimate_days: 2 },
        { name: "Sitemap & information architecture", estimate_days: 1.5 },
      ],
    },
    {
      name: "UI/UX Design",
      category: "Design",
      subtasks: [
        { name: "Wireframes", estimate_days: 3 },
        { name: "Visual design / mockups", estimate_days: 5 },
        { name: "Design system / components", estimate_days: 3 },
        { name: "Prototype & review", estimate_days: 2 },
      ],
    },
    {
      name: "Frontend Development",
      category: "Development",
      subtasks: [
        { name: "Project setup & tooling", estimate_days: 1 },
        { name: "Home page", estimate_days: 2 },
        { name: "Inner / content pages", estimate_days: 4 },
        { name: "Reusable components (header, footer, forms)", estimate_days: 3 },
        { name: "Responsive / mobile pass", estimate_days: 2 },
      ],
    },
    {
      name: "Backend Development",
      category: "Development",
      subtasks: [
        { name: "Database schema", estimate_days: 1.5 },
        { name: "API endpoints", estimate_days: 4 },
        { name: "Authentication", estimate_days: 2 },
        { name: "CMS / admin integration", estimate_days: 3 },
      ],
    },
    {
      name: "QA & Testing",
      category: "QA",
      subtasks: [
        { name: "Functional testing", estimate_days: 2 },
        { name: "Cross-browser / device testing", estimate_days: 1.5 },
        { name: "Bug fixing", estimate_days: 2 },
      ],
    },
    {
      name: "Deployment & Launch",
      category: "DevOps",
      subtasks: [
        { name: "Environment setup", estimate_days: 1 },
        { name: "CI/CD pipeline", estimate_days: 1 },
        { name: "Go-live & smoke test", estimate_days: 0.5 },
      ],
    },
  ],
};

async function main() {
  console.log("Applying schema...");
  await pool.query(schema);

  const existing = await pool.query("SELECT id FROM templates WHERE name = $1", [SEED.name]);
  if (existing.rows.length > 0) {
    console.log(`Template "${SEED.name}" already exists (id=${existing.rows[0].id}). Skipping seed.`);
    await pool.end();
    return;
  }

  console.log("Seeding sample template...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const t = await client.query(
      "INSERT INTO templates (name, description) VALUES ($1, $2) RETURNING id",
      [SEED.name, SEED.description]
    );
    const templateId = t.rows[0].id;

    for (let ti = 0; ti < SEED.tasks.length; ti++) {
      const task = SEED.tasks[ti];
      const tt = await client.query(
        "INSERT INTO template_tasks (template_id, name, category, sort_order) VALUES ($1,$2,$3,$4) RETURNING id",
        [templateId, task.name, task.category, ti]
      );
      const taskId = tt.rows[0].id;
      for (let si = 0; si < task.subtasks.length; si++) {
        const s = task.subtasks[si];
        await client.query(
          "INSERT INTO template_subtasks (template_task_id, name, estimate_days, sort_order) VALUES ($1,$2,$3,$4)",
          [taskId, s.name, s.estimate_days, si]
        );
      }
    }
    await client.query("COMMIT");
    console.log(`Seeded template id=${templateId} with ${SEED.tasks.length} tasks.`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  await pool.end();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
