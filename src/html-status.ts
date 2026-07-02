export function statusPage(status: Record<string, any>): string {
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const rows = Object.entries(status).map(([key, value]) => {
    const isHealthy = key === 'healthy' ? value : null;
    const statusClass = isHealthy === true ? 'ok' : isHealthy === false ? 'fail' : 'neutral';
    const display = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    return `<tr><td>${escapeHtml(key)}</td><td class="status-${statusClass}"><pre>${escapeHtml(display)}</pre></td></tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DubMenu Status</title>
<style>
  :root{--bg:#0a0f0d;--surface:rgba(255,255,255,0.04);--border:rgba(255,255,255,0.08);--text:#f0f2f5;--muted:#889495;--ok:#10b981;--fail:#ef4444;}
  body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--text);padding:2rem;}
  h1{font-size:1.5rem;margin-bottom:1.5rem;}
  table{width:100%;max-width:720px;border-collapse:collapse;background:var(--surface);border:1px solid var(--border);border-radius:0.75rem;overflow:hidden;}
  th,td{padding:0.75rem 1rem;text-align:left;border-bottom:1px solid var(--border);font-size:0.9rem;}
  th{color:var(--muted);text-transform:uppercase;font-size:0.75rem;letter-spacing:0.05em;}
  pre{margin:0;white-space:pre-wrap;word-break:break-word;font-size:0.8rem;}
  .status-ok{color:var(--ok);font-weight:600;}
  .status-fail{color:var(--fail);font-weight:600;}
  .status-neutral{color:var(--muted);}
</style>
</head>
<body>
<h1>DubMenu System Status</h1>
<table>
  <thead><tr><th>Check</th><th>Result</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</body>
</html>`;
}
