import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ponytail: direct adb CLI runner; upgrade to adb server socket protocol if IPC overhead becomes measurable.
export async function runAdb(args, options = {}) {
  const timeout = options.timeout || 15000;
  try {
    const { stdout, stderr } = await execFileAsync('adb', args, {
      timeout,
      maxBuffer: 10 * 1024 * 1024,
      ...options
    });
    return { ok: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      stdout: err.stdout ? String(err.stdout).trim() : '',
      stderr: err.stderr ? String(err.stderr).trim() : '',
      code: err.code
    };
  }
}

export async function checkAdb() {
  const res = await runAdb(['version']);
  if (!res.ok) {
    return { installed: false, version: null, error: res.error };
  }
  const match = res.stdout.match(/version\s+([0-9.]+)/i);
  return {
    installed: true,
    version: match ? match[1] : res.stdout.split('\n')[0]
  };
}

export function parseDevicesOutput(text) {
  const lines = text.split('\n');
  const devices = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('List of devices') || trimmed.startsWith('*')) {
      continue;
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) continue;

    const serial = parts[0];
    const state = parts[1]; // device, unauthorized, offline, no permissions
    const extra = {};

    for (let i = 2; i < parts.length; i++) {
      const kv = parts[i].split(':');
      if (kv.length === 2) {
        extra[kv[0]] = kv[1];
      }
    }

    const isWifi = /^(\d{1,3}\.){3}\d{1,3}:\d+$/.test(serial);

    devices.push({
      serial,
      state,
      product: extra.product || null,
      model: extra.model ? extra.model.replace(/_/g, ' ') : null,
      device: extra.device || null,
      transportId: extra.transport_id || null,
      isWifi
    });
  }

  return devices;
}

export async function listDevices() {
  const res = await runAdb(['devices', '-l']);
  if (!res.ok) {
    throw new Error(res.stderr || res.error || 'Failed to list ADB devices');
  }
  return parseDevicesOutput(res.stdout);
}

export async function connectTcp(ip, port = 5555) {
  const cleanIp = String(ip).trim();
  const cleanPort = Number.parseInt(port, 10) || 5555;
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(cleanIp)) {
    throw new Error('Invalid IP address format');
  }
  if (cleanPort < 1 || cleanPort > 65535) {
    throw new Error('Port must be between 1 and 65535');
  }

  const target = `${cleanIp}:${cleanPort}`;
  const res = await runAdb(['connect', target]);
  if (!res.ok) {
    throw new Error(res.stderr || res.error || `Failed to connect to ${target}`);
  }
  const stdout = res.stdout;
  const connected = stdout.includes('connected to') && !stdout.includes('cannot connect');
  return { target, message: stdout, connected };
}

export async function disconnectTcp(target) {
  const cleanTarget = String(target).trim();
  const res = await runAdb(['disconnect', cleanTarget]);
  return { target: cleanTarget, message: res.stdout || res.stderr };
}

export async function enableTcpip(serial, port = 5555) {
  const cleanPort = Number.parseInt(port, 10) || 5555;
  const args = serial ? ['-s', serial, 'tcpip', String(cleanPort)] : ['tcpip', String(cleanPort)];
  const res = await runAdb(args);
  if (!res.ok) {
    throw new Error(res.stderr || res.error || 'Failed to switch device to TCP/IP mode');
  }
  return { port: cleanPort, message: res.stdout };
}

export async function getDeviceIp(serial) {
  const args = serial ? ['-s', serial, 'shell', 'ip', 'route'] : ['shell', 'ip', 'route'];
  const res = await runAdb(args);
  if (res.ok && res.stdout) {
    // Match 'src 192.168.x.x' from default route
    const match = res.stdout.match(/src\s+([0-9.]+)/);
    if (match) return match[1];
  }

  // Fallback: query wlan0 interface
  const wlanArgs = serial
    ? ['-s', serial, 'shell', 'ip', '-f', 'inet', 'addr', 'show', 'wlan0']
    : ['shell', 'ip', '-f', 'inet', 'addr', 'show', 'wlan0'];
  const wlanRes = await runAdb(wlanArgs);
  if (wlanRes.ok && wlanRes.stdout) {
    const match = wlanRes.stdout.match(/inet\s+([0-9.]+)\//);
    if (match) return match[1];
  }

  return null;
}

export async function getDeviceDetails(serial) {
  if (!serial) throw new Error('Device serial is required');

  const [batteryRes, sizeRes, osRes, modelRes] = await Promise.all([
    runAdb(['-s', serial, 'shell', 'dumpsys', 'battery']),
    runAdb(['-s', serial, 'shell', 'wm', 'size']),
    runAdb(['-s', serial, 'shell', 'getprop', 'ro.build.version.release']),
    runAdb(['-s', serial, 'shell', 'getprop', 'ro.product.manufacturer'])
  ]);

  let batteryLevel = null;
  let batteryStatus = null;
  if (batteryRes.ok) {
    const levelMatch = batteryRes.stdout.match(/level:\s*(\d+)/i);
    if (levelMatch) batteryLevel = Number.parseInt(levelMatch[1], 10);
    const statusMatch = batteryRes.stdout.match(/status:\s*(\d+)/i);
    // 2: charging, 3: discharging, 4: not charging, 5: full
    if (statusMatch) {
      const statusCode = Number.parseInt(statusMatch[1], 10);
      const statusMap = { 2: 'Charging', 3: 'Discharging', 4: 'Not Charging', 5: 'Full' };
      batteryStatus = statusMap[statusCode] || 'Unknown';
    }
  }

  let resolution = null;
  if (sizeRes.ok) {
    const sizeMatch = sizeRes.stdout.match(/(?:Physical size|Override size):\s*(\d+x\d+)/i);
    if (sizeMatch) resolution = sizeMatch[1];
  }

  const androidVersion = osRes.ok ? osRes.stdout.trim() : null;
  const manufacturer = modelRes.ok ? modelRes.stdout.trim() : null;

  return {
    serial,
    batteryLevel,
    batteryStatus,
    resolution,
    androidVersion,
    manufacturer
  };
}

export async function sendKeyEvent(serial, keycode) {
  const code = Number.parseInt(keycode, 10);
  if (Number.isNaN(code)) throw new Error('Invalid keycode');
  const args = serial ? ['-s', serial, 'shell', 'input', 'keyevent', String(code)] : ['shell', 'input', 'keyevent', String(code)];
  const res = await runAdb(args);
  if (!res.ok) throw new Error(res.stderr || res.error || 'Failed to send keyevent');
  return { ok: true, keycode: code };
}

export async function rebootDevice(serial, mode = '') {
  const args = serial ? ['-s', serial, 'reboot'] : ['reboot'];
  if (mode && ['recovery', 'bootloader'].includes(mode)) {
    args.push(mode);
  }
  const res = await runAdb(args);
  if (!res.ok) throw new Error(res.stderr || res.error || 'Failed to reboot device');
  return { ok: true, mode: mode || 'system' };
}

export async function captureScreenshot(serial) {
  const args = serial ? ['-s', serial, 'exec-out', 'screencap', '-p'] : ['exec-out', 'screencap', '-p'];
  return new Promise((resolve, reject) => {
    execFile('adb', args, { encoding: 'buffer', maxBuffer: 30 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr ? stderr.toString() : err.message));
      }
      resolve(stdout);
    });
  });
}
