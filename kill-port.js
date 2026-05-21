/**
 * kill-port.js — Kills any process using port 5000 before the server starts.
 * Run automatically via npm prestart.
 */
const { execSync } = require('child_process');
const PORT = process.env.PORT || 5000;

try {
  // Windows: find PID using the port and kill it
  const result = execSync(
    `powershell -Command "Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`,
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  ).trim();

  if (result) {
    const pids = [...new Set(result.split('\n').map(p => p.trim()).filter(Boolean))];
    pids.forEach(pid => {
      try {
        execSync(`taskkill /f /pid ${pid}`, { stdio: 'ignore' });
        console.log(`[prestart] Cleared process PID ${pid} from port ${PORT}`);
      } catch (_) {}
    });
  } else {
    console.log(`[prestart] Port ${PORT} is free`);
  }
} catch (_) {
  // Silently ignore — port is free or PowerShell not available
  console.log(`[prestart] Port ${PORT} is available`);
}
