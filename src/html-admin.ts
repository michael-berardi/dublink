export function adminPage(stats: any, analytics: any, status: any): string {
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const formatTime = (ts: number) => new Date(ts).toLocaleString();

  const events = (analytics?.recentEvents || []).map((e: any) => `
    <tr>
      <td>${escapeHtml(e.type)}</td>
      <td>${e.payload?.sessionId ? escapeHtml(e.payload.sessionId) : '-'}</td>
      <td>${e.accountId ? escapeHtml(e.accountId) : '-'}</td>
      <td>${formatTime(e.timestamp)}</td>
    </tr>
  `).join('');

  const statusRows = Object.entries(status || {}).map(([key, value]) => {
    const display = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    return `<tr><td>${escapeHtml(key)}</td><td><pre>${escapeHtml(display)}</pre></td></tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin | DubMenu</title>
<style>
  :root{--bg:#0a0f0d;--surface:rgba(255,255,255,0.04);--surface2:#2c2c2e;--border:rgba(255,255,255,0.08);--text:#f0f2f5;--muted:#889495;--primary:#10b981;}
  body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--text);padding:2rem;}
  h1{font-size:1.5rem;margin-bottom:1.5rem;}
  h2{font-size:1rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin:2rem 0 1rem;}
  .metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:2rem;}
  .metric{background:var(--surface);border:1px solid var(--border);border-radius:0.75rem;padding:1rem;}
  .metric-value{font-size:1.75rem;font-weight:800;color:var(--primary);}
  .metric-label{font-size:0.875rem;color:var(--muted);}
  table{width:100%;max-width:900px;border-collapse:collapse;background:var(--surface);border:1px solid var(--border);border-radius:0.75rem;overflow:hidden;margin-bottom:2rem;}
  th,td{padding:0.75rem 1rem;text-align:left;border-bottom:1px solid var(--border);font-size:0.85rem;}
  th{color:var(--muted);text-transform:uppercase;font-size:0.75rem;letter-spacing:0.05em;}
  pre{margin:0;white-space:pre-wrap;word-break:break-word;font-size:0.8rem;}
</style>
</head>
<body>
<h1>DubMenu Admin</h1>
<div class="metrics">
  <div class="metric"><div class="metric-value">${stats?.accountCount || 0}</div><div class="metric-label">Accounts</div></div>
  <div class="metric"><div class="metric-value">${stats?.sessionCount || 0}</div><div class="metric-label">Sessions</div></div>
  <div class="metric"><div class="metric-value">${status?.healthy ? 'OK' : 'FAIL'}</div><div class="metric-label">System</div></div>
</div>
<div class="metrics">
  <div class="metric"><div class="metric-value">${analytics?.tvLoads || 0}</div><div class="metric-label">TV Loads</div></div>
  <div class="metric"><div class="metric-value">${analytics?.widgetLoads || 0}</div><div class="metric-label">Widget Loads</div></div>
  <div class="metric"><div class="metric-value">${analytics?.configSaves || 0}</div><div class="metric-label">Config Saves</div></div>
  <div class="metric"><div class="metric-value">${analytics?.totalEvents || 0}</div><div class="metric-label">Total Events</div></div>
</div>
<h2>System Status</h2>
<table>
  <thead><tr><th>Check</th><th>Result</th></tr></thead>
  <tbody>${statusRows}</tbody>
</table>
<h2>Recent Events</h2>
<table>
  <thead><tr><th>Type</th><th>Session</th><th>Account</th><th>Time</th></tr></thead>
  <tbody>${events || '<tr><td colspan="4" style="color:var(--muted);">No events yet</td></tr>'}</tbody>
</table>
</body>
</html>`;
}
