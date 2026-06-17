async function handle(res: Response) {
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  get: (url: string) => fetch(url, { cache: "no-store" }).then(handle),
  post: (url: string, body: any) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),
  put: (url: string, body: any) =>
    fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),
  del: (url: string) => fetch(url, { method: "DELETE" }).then(handle),
};
