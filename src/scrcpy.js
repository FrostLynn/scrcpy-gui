import { spawn, execFile } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';

const execFileAsync = promisify(execFile);

export const sessionEvents = new EventEmitter();

// ponytail: in-memory process registry; sufficient for single-host session daemon.
const activeSessions = new Map();

export async function checkScrcpy() {
  try {
    const { stdout } = await execFileAsync('scrcpy', ['--version'], { timeout: 5000 });
    const match = stdout.match(/scrcpy\s+([0-9.]+)/i);
    return {
      installed: true,
      version: match ? match[1] : stdout.split('\n')[0].trim()
    };
  } catch (err) {
    return {
      installed: false,
      version: null,
      error: err.message
    };
  }
}

export function buildScrcpyArgs(options = {}) {
  const args = [];

  if (options.serial) {
    args.push('-s', String(options.serial).trim());
  }

  // Display & Video constraints
  if (options.maxSize && Number(options.maxSize) > 0) {
    args.push(`--max-size=${Number.parseInt(options.maxSize, 10)}`);
  }

  if (options.videoBitRate && /^\d+[kKmMgG]?$/.test(String(options.videoBitRate))) {
    args.push(`--video-bit-rate=${options.videoBitRate}`);
  }

  if (options.maxFps && Number(options.maxFps) > 0) {
    args.push(`--max-fps=${Number.parseInt(options.maxFps, 10)}`);
  }

  if (options.videoCodec && ['h264', 'h265', 'av1'].includes(options.videoCodec)) {
    args.push(`--video-codec=${options.videoCodec}`);
  }

  // Audio configuration
  if (options.noAudio) {
    args.push('--no-audio');
  } else {
    if (options.audioCodec && ['opus', 'aac', 'flac', 'raw'].includes(options.audioCodec)) {
      args.push(`--audio-codec=${options.audioCodec}`);
    }
    if (options.audioBitRate && /^\d+[kKmM]?$/.test(String(options.audioBitRate))) {
      args.push(`--audio-bit-rate=${options.audioBitRate}`);
    }
  }

  // Behavior & Window flags
  if (options.turnScreenOff) args.push('--turn-screen-off');
  if (options.stayAwake) args.push('--stay-awake');
  if (options.fullscreen) args.push('--fullscreen');
  if (options.alwaysOnTop) args.push('--always-on-top');
  if (options.windowBorderless) args.push('--window-borderless');
  if (options.showTouches) args.push('--show-touches');
  if (options.noControl) args.push('--no-control');
  if (options.noClipboardAutosync) args.push('--no-clipboard-autosync');

  // Modes
  if (options.otg) {
    args.push('--otg');
  }

  if (options.videoSource && ['display', 'camera'].includes(options.videoSource)) {
    args.push(`--video-source=${options.videoSource}`);
  }

  if (options.noVideo) {
    args.push('--no-video');
  }

  // Recording
  if (options.record) {
    const recDir = path.resolve(process.cwd(), 'recordings');
    if (!fs.existsSync(recDir)) {
      fs.mkdirSync(recDir, { recursive: true });
    }
    const filename = options.recordFilename
      ? options.recordFilename.replace(/[^a-zA-Z0-9._-]/g, '_')
      : `record_${options.serial || 'device'}_${Date.now()}.mp4`;
    const fullRecordPath = path.join(recDir, filename);
    args.push(`--record=${fullRecordPath}`);
  }

  // Custom additional arguments
  if (options.customArgs && typeof options.customArgs === 'string') {
    const extra = options.customArgs.trim().split(/\s+/).filter(Boolean);
    for (const flag of extra) {
      if (flag.startsWith('-')) {
        args.push(flag);
      }
    }
  }

  return args;
}

export function startSession(config = {}) {
  if (!config.serial && !config.otg) {
    throw new Error('Device serial or OTG mode is required to launch session');
  }

  // Check if session for this serial already active
  if (config.serial) {
    for (const [id, s] of activeSessions) {
      if (s.serial === config.serial && s.status === 'running') {
        throw new Error(`A session is already active for device ${config.serial} (ID: ${id})`);
      }
    }
  }

  const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const args = buildScrcpyArgs(config);

  const proc = spawn('scrcpy', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });

  const session = {
    id,
    serial: config.serial || 'OTG',
    pid: proc.pid,
    startedAt: new Date().toISOString(),
    status: 'running',
    args,
    logs: [],
    exitCode: null
  };

  function appendLog(text) {
    const lines = text.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      const entry = `[${new Date().toLocaleTimeString()}] ${line}`;
      session.logs.push(entry);
      if (session.logs.length > 300) {
        session.logs.shift();
      }
      sessionEvents.emit('log', { id, line: entry });
    }
  }

  appendLog(`Command: scrcpy ${args.join(' ')}`);

  proc.stdout.on('data', appendLog);
  proc.stderr.on('data', appendLog);

  proc.on('error', (err) => {
    session.status = 'error';
    session.error = err.message;
    appendLog(`Process error: ${err.message}`);
    sessionEvents.emit('status', { id, status: 'error', error: err.message });
  });

  proc.on('close', (code, signal) => {
    session.status = 'stopped';
    session.exitCode = code;
    session.signal = signal;
    appendLog(`Session ended (code: ${code}, signal: ${signal || 'none'})`);
    sessionEvents.emit('status', { id, status: 'stopped', code, signal });
  });

  session.proc = proc;
  activeSessions.set(id, session);
  sessionEvents.emit('start', { id, serial: session.serial, pid: session.pid });

  return {
    id,
    serial: session.serial,
    pid: session.pid,
    startedAt: session.startedAt,
    status: session.status,
    args
  };
}

export function stopSession(id) {
  const session = activeSessions.get(id);
  if (!session) {
    throw new Error(`Session ${id} not found`);
  }

  if (session.status !== 'running' || !session.proc) {
    return { id, status: session.status, message: 'Session already terminated' };
  }

  session.proc.kill('SIGTERM');

  // Fallback kill after 3 seconds if process lingers
  setTimeout(() => {
    if (session.status === 'running' && session.proc) {
      try {
        session.proc.kill('SIGKILL');
      } catch {}
    }
  }, 3000);

  return { id, status: 'stopping' };
}

export function getSession(id) {
  const session = activeSessions.get(id);
  if (!session) return null;
  return {
    id: session.id,
    serial: session.serial,
    pid: session.pid,
    startedAt: session.startedAt,
    status: session.status,
    args: session.args,
    logs: session.logs,
    exitCode: session.exitCode
  };
}

export function listSessions() {
  const list = [];
  for (const [, session] of activeSessions) {
    list.push({
      id: session.id,
      serial: session.serial,
      pid: session.pid,
      startedAt: session.startedAt,
      status: session.status,
      args: session.args,
      logs: session.logs.slice(-20),
      exitCode: session.exitCode
    });
  }
  return list;
}
