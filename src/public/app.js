// ponytail: vanilla single-file client; upgrade to modular web components if UI complexity grows.

const state = {
  theme: localStorage.getItem('scrcpy_gui_theme') || 'dark',
  selectedSerial: null,
  devices: [],
  sessions: [],
  activeModalSerial: null,
  presets: {
    'default': {
      maxSize: '1920',
      videoBitRate: '8M',
      maxFps: '60',
      videoCodec: 'h264',
      videoSource: 'display',
      noAudio: false,
      audioCodec: 'opus',
      audioBitRate: '128K',
      turnScreenOff: false,
      stayAwake: true,
      fullscreen: false,
      alwaysOnTop: false,
      windowBorderless: false,
      showTouches: false,
      noControl: false,
      noClipboardAutosync: false,
      record: false,
      noVideo: false,
      customArgs: ''
    },
    'high-quality': {
      maxSize: '',
      videoBitRate: '16M',
      maxFps: '60',
      videoCodec: 'h265',
      videoSource: 'display',
      noAudio: false,
      audioCodec: 'opus',
      audioBitRate: '192K',
      turnScreenOff: false,
      stayAwake: true,
      fullscreen: false,
      alwaysOnTop: false,
      windowBorderless: false,
      showTouches: false,
      noControl: false,
      noClipboardAutosync: false,
      record: false,
      noVideo: false,
      customArgs: ''
    },
    'low-latency': {
      maxSize: '1280',
      videoBitRate: '4M',
      maxFps: '60',
      videoCodec: 'h264',
      videoSource: 'display',
      noAudio: true,
      audioCodec: 'opus',
      audioBitRate: '128K',
      turnScreenOff: false,
      stayAwake: true,
      fullscreen: false,
      alwaysOnTop: false,
      windowBorderless: false,
      showTouches: false,
      noControl: false,
      noClipboardAutosync: false,
      record: false,
      noVideo: false,
      customArgs: ''
    },
    'presentation': {
      maxSize: '1920',
      videoBitRate: '8M',
      maxFps: '60',
      videoCodec: 'h264',
      videoSource: 'display',
      noAudio: false,
      audioCodec: 'opus',
      audioBitRate: '128K',
      turnScreenOff: true,
      stayAwake: true,
      fullscreen: true,
      alwaysOnTop: true,
      windowBorderless: false,
      showTouches: true,
      noControl: false,
      noClipboardAutosync: false,
      record: false,
      noVideo: false,
      customArgs: ''
    },
    'audio-only': {
      maxSize: '',
      videoBitRate: '4M',
      maxFps: '',
      videoCodec: 'h264',
      videoSource: 'display',
      noAudio: false,
      audioCodec: 'opus',
      audioBitRate: '128K',
      turnScreenOff: true,
      stayAwake: true,
      fullscreen: false,
      alwaysOnTop: false,
      windowBorderless: false,
      showTouches: false,
      noControl: false,
      noClipboardAutosync: false,
      record: false,
      noVideo: true,
      customArgs: ''
    }
  }
};

const dom = {
  html: document.documentElement,
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeLabel: document.getElementById('themeLabel'),
  themeIconSun: document.getElementById('themeIconSun'),
  themeIconMoon: document.getElementById('themeIconMoon'),
  refreshBtn: document.getElementById('refreshBtn'),
  adbStatusDot: document.getElementById('adbStatusDot'),
  adbStatusVal: document.getElementById('adbStatusVal'),
  scrcpyStatusDot: document.getElementById('scrcpyStatusDot'),
  scrcpyStatusVal: document.getElementById('scrcpyStatusVal'),
  connectForm: document.getElementById('connectForm'),
  connectIp: document.getElementById('connectIp'),
  connectPort: document.getElementById('connectPort'),
  connectSubmitBtn: document.getElementById('connectSubmitBtn'),
  deviceCounter: document.getElementById('deviceCounter'),
  deviceFilterBar: document.getElementById('deviceFilterBar'),
  deviceSearchInput: document.getElementById('deviceSearchInput'),
  deviceLoadingState: document.getElementById('deviceLoadingState'),
  deviceEmptyState: document.getElementById('deviceEmptyState'),
  deviceErrorState: document.getElementById('deviceErrorState'),
  deviceErrorMessage: document.getElementById('deviceErrorMessage'),
  retryDeviceBtn: document.getElementById('retryDeviceBtn'),
  deviceList: document.getElementById('deviceList'),
  sessionCounter: document.getElementById('sessionCounter'),
  sessionEmptyState: document.getElementById('sessionEmptyState'),
  sessionList: document.getElementById('sessionList'),
  consoleOutput: document.getElementById('consoleOutput'),
  clearLogsBtn: document.getElementById('clearLogsBtn'),
  logStreamIndicator: document.getElementById('logStreamIndicator'),
  otgLaunchBtn: document.getElementById('otgLaunchBtn'),
  targetDeviceDisplay: document.getElementById('targetDeviceDisplay'),
  launcherForm: document.getElementById('launcherForm'),
  presetBtns: document.querySelectorAll('.preset-btn'),
  cfgMaxSize: document.getElementById('cfgMaxSize'),
  cfgVideoBitRate: document.getElementById('cfgVideoBitRate'),
  cfgMaxFps: document.getElementById('cfgMaxFps'),
  cfgVideoCodec: document.getElementById('cfgVideoCodec'),
  cfgVideoSource: document.getElementById('cfgVideoSource'),
  cfgNoAudio: document.getElementById('cfgNoAudio'),
  audioSubFields: document.getElementById('audioSubFields'),
  cfgAudioCodec: document.getElementById('cfgAudioCodec'),
  cfgAudioBitRate: document.getElementById('cfgAudioBitRate'),
  cfgTurnScreenOff: document.getElementById('cfgTurnScreenOff'),
  cfgStayAwake: document.getElementById('cfgStayAwake'),
  cfgFullscreen: document.getElementById('cfgFullscreen'),
  cfgAlwaysOnTop: document.getElementById('cfgAlwaysOnTop'),
  cfgWindowBorderless: document.getElementById('cfgWindowBorderless'),
  cfgShowTouches: document.getElementById('cfgShowTouches'),
  cfgNoControl: document.getElementById('cfgNoControl'),
  cfgNoClipboardAutosync: document.getElementById('cfgNoClipboardAutosync'),
  cfgRecord: document.getElementById('cfgRecord'),
  recordFilenameGroup: document.getElementById('recordFilenameGroup'),
  cfgRecordFilename: document.getElementById('cfgRecordFilename'),
  cfgCustomArgs: document.getElementById('cfgCustomArgs'),
  commandPreview: document.getElementById('commandPreview'),
  copyCommandBtn: document.getElementById('copyCommandBtn'),
  copyCommandLabel: document.getElementById('copyCommandLabel'),
  launchScrcpyBtn: document.getElementById('launchScrcpyBtn'),
  // Modals
  deviceModal: document.getElementById('deviceModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  modalDismissBtn: document.getElementById('modalDismissBtn'),
  modalLoadingState: document.getElementById('modalLoadingState'),
  modalDetailsContent: document.getElementById('modalDetailsContent'),
  specSerial: document.getElementById('specSerial'),
  specModel: document.getElementById('specModel'),
  specAndroidVer: document.getElementById('specAndroidVer'),
  specResolution: document.getElementById('specResolution'),
  specBattery: document.getElementById('specBattery'),
  specIp: document.getElementById('specIp'),
  modalHardwareActions: document.getElementById('modalHardwareActions'),
  modalTakeScreenshotBtn: document.getElementById('modalTakeScreenshotBtn'),
  modalSwitchTcpipBtn: document.getElementById('modalSwitchTcpipBtn'),
  modalRebootBtn: document.getElementById('modalRebootBtn'),
  screenshotModal: document.getElementById('screenshotModal'),
  closeScreenshotModalBtn: document.getElementById('closeScreenshotModalBtn'),
  dismissScreenshotBtn: document.getElementById('dismissScreenshotBtn'),
  screenshotImg: document.getElementById('screenshotImg'),
  downloadScreenshotBtn: document.getElementById('downloadScreenshotBtn'),
  toastContainer: document.getElementById('toastContainer')
};

// UI Notification Toast
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Theme handling
function applyTheme(theme) {
  state.theme = theme;
  dom.html.setAttribute('data-theme', theme);
  dom.themeLabel.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  if (dom.themeIconSun && dom.themeIconMoon) {
    if (theme === 'dark') {
      dom.themeIconSun.classList.remove('hidden');
      dom.themeIconMoon.classList.add('hidden');
    } else {
      dom.themeIconSun.classList.add('hidden');
      dom.themeIconMoon.classList.remove('hidden');
    }
  }
  localStorage.setItem('scrcpy_gui_theme', theme);
}

dom.themeToggleBtn.addEventListener('click', () => {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
});

// System check
async function fetchSystemStatus() {
  try {
    const res = await fetch('/api/system');
    const data = await res.json();
    if (data.adb && data.adb.installed) {
      dom.adbStatusVal.textContent = `v${data.adb.version}`;
      dom.adbStatusVal.style.color = 'var(--text-primary)';
      if (dom.adbStatusDot) dom.adbStatusDot.className = 'status-dot status-dot-online';
    } else {
      dom.adbStatusVal.textContent = 'Missing';
      dom.adbStatusVal.style.color = 'var(--accent-danger)';
      if (dom.adbStatusDot) dom.adbStatusDot.className = 'status-dot status-dot-offline';
    }

    if (data.scrcpy && data.scrcpy.installed) {
      dom.scrcpyStatusVal.textContent = `v${data.scrcpy.version}`;
      dom.scrcpyStatusVal.style.color = 'var(--text-primary)';
      if (dom.scrcpyStatusDot) dom.scrcpyStatusDot.className = 'status-dot status-dot-online';
    } else {
      dom.scrcpyStatusVal.textContent = 'Missing';
      dom.scrcpyStatusVal.style.color = 'var(--accent-danger)';
      if (dom.scrcpyStatusDot) dom.scrcpyStatusDot.className = 'status-dot status-dot-offline';
    }
  } catch {
    dom.adbStatusVal.textContent = 'Offline';
    dom.scrcpyStatusVal.textContent = 'Offline';
    if (dom.adbStatusDot) dom.adbStatusDot.className = 'status-dot status-dot-offline';
    if (dom.scrcpyStatusDot) dom.scrcpyStatusDot.className = 'status-dot status-dot-offline';
  }
}

// Device scanning and rendering
async function fetchDevices() {
  dom.deviceLoadingState.classList.remove('hidden');
  dom.deviceEmptyState.classList.add('hidden');
  dom.deviceErrorState.classList.add('hidden');
  dom.deviceList.classList.add('hidden');

  try {
    const res = await fetch('/api/devices');
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to scan devices');
    }
    const data = await res.json();
    state.devices = data.devices || [];
    renderDevices();
  } catch (err) {
    dom.deviceLoadingState.classList.add('hidden');
    dom.deviceErrorState.classList.remove('hidden');
    dom.deviceErrorMessage.textContent = err.message;
    dom.deviceCounter.textContent = '0';
  }
}

function renderDevices() {
  dom.deviceLoadingState.classList.add('hidden');
  dom.deviceCounter.textContent = String(state.devices.length);

  if (state.devices.length === 0) {
    dom.deviceEmptyState.classList.remove('hidden');
    dom.deviceList.classList.add('hidden');
    if (state.selectedSerial !== 'OTG') {
      state.selectedSerial = null;
      updateTargetDisplay();
    }
    return;
  }

  dom.deviceEmptyState.classList.add('hidden');
  dom.deviceList.classList.remove('hidden');
  dom.deviceList.innerHTML = '';

  // Auto-select first device if none selected
  if (!state.selectedSerial || !state.devices.some(d => d.serial === state.selectedSerial)) {
    state.selectedSerial = state.devices[0].serial;
    updateTargetDisplay();
  }

  for (const device of state.devices) {
    const card = document.createElement('div');
    card.className = `device-card ${device.serial === state.selectedSerial ? 'selected' : ''}`;
    card.setAttribute('role', 'listitem');

    const kindBadge = device.isWifi ? 'Wi-Fi' : 'USB';
    const stateClass = `status-${device.state.toLowerCase()}`;

    card.innerHTML = `
      <div class="device-card-header">
        <div class="device-main-info">
          <span class="device-badge-kind">${kindBadge}</span>
          <span class="device-model">${escapeHtml(device.model || device.product || 'Android Device')}</span>
          <span class="device-serial">${escapeHtml(device.serial)}</span>
        </div>
        <span class="device-status-badge ${stateClass}">${escapeHtml(device.state)}</span>
      </div>
      <div class="device-meta-row">
        <div class="device-meta-item">
          <span>Transport ID:</span>
          <span class="device-meta-val">${escapeHtml(device.transportId || '-')}</span>
        </div>
        <div class="device-meta-item">
          <span>Product:</span>
          <span class="device-meta-val">${escapeHtml(device.product || '-')}</span>
        </div>
      </div>
      <div class="device-toolbar">
        <button type="button" class="btn btn-sm ${device.serial === state.selectedSerial ? 'btn-primary' : 'btn-secondary'} btn-select-target" data-serial="${escapeHtml(device.serial)}">
          ${device.serial === state.selectedSerial ? 'Target Active' : 'Select as Target'}
        </button>
        <button type="button" class="btn btn-sm btn-outline btn-device-details" data-serial="${escapeHtml(device.serial)}">
          Device Info
        </button>
        <button type="button" class="btn btn-sm btn-outline btn-device-screenshot" data-serial="${escapeHtml(device.serial)}">
          Screenshot
        </button>
        ${device.isWifi
          ? `<button type="button" class="btn btn-sm btn-outline btn-device-disconnect" data-target="${escapeHtml(device.serial)}">Disconnect</button>`
          : `<button type="button" class="btn btn-sm btn-outline btn-device-tcpip" data-serial="${escapeHtml(device.serial)}">Enable Wi-Fi</button>`
        }
      </div>
    `;

    dom.deviceList.appendChild(card);
  }

  attachDeviceCardListeners();
  if (dom.deviceFilterBar) {
    dom.deviceFilterBar.classList.toggle('hidden', state.devices.length <= 1);
  }
  applyDeviceFilter();
  updateCommandPreview();
}

function applyDeviceFilter() {
  if (!dom.deviceSearchInput) return;
  const q = dom.deviceSearchInput.value.toLowerCase().trim();
  const cards = dom.deviceList.querySelectorAll('.device-card');
  cards.forEach(card => {
    if (!q) {
      card.classList.remove('hidden');
    } else {
      const text = card.textContent.toLowerCase();
      card.classList.toggle('hidden', !text.includes(q));
    }
  });
}

function attachDeviceCardListeners() {
  dom.deviceList.querySelectorAll('.btn-select-target').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const serial = e.currentTarget.getAttribute('data-serial');
      state.selectedSerial = serial;
      renderDevices();
      updateTargetDisplay();
    });
  });

  dom.deviceList.querySelectorAll('.btn-device-details').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const serial = e.currentTarget.getAttribute('data-serial');
      openDeviceModal(serial);
    });
  });

  dom.deviceList.querySelectorAll('.btn-device-screenshot').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const serial = e.currentTarget.getAttribute('data-serial');
      takeScreenshot(serial);
    });
  });

  dom.deviceList.querySelectorAll('.btn-device-disconnect').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget.getAttribute('data-target');
      try {
        const res = await fetch('/api/devices/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target })
        });
        const data = await res.json();
        showToast(data.message || `Disconnected ${target}`, 'info');
        fetchDevices();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  dom.deviceList.querySelectorAll('.btn-device-tcpip').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const serial = e.currentTarget.getAttribute('data-serial');
      try {
        const res = await fetch(`/api/devices/${encodeURIComponent(serial)}/tcpip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ port: 5555 })
        });
        const data = await res.json();
        showToast(`Port ${data.port} opened. Find Wi-Fi IP in Device Info.`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

function updateTargetDisplay() {
  if (state.selectedSerial === 'OTG') {
    dom.targetDeviceDisplay.textContent = 'OTG Keyboard / Mouse Mode';
  } else if (state.selectedSerial) {
    const dev = state.devices.find(d => d.serial === state.selectedSerial);
    const label = dev ? (dev.model || dev.product || dev.serial) : state.selectedSerial;
    dom.targetDeviceDisplay.textContent = `${label} (${state.selectedSerial})`;
  } else {
    dom.targetDeviceDisplay.textContent = 'No device selected';
  }
  updateCommandPreview();
}

// TCP/IP Connect form
dom.connectForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const ip = dom.connectIp.value.trim();
  const port = Number.parseInt(dom.connectPort.value, 10) || 5555;

  dom.connectSubmitBtn.disabled = true;
  dom.connectSubmitBtn.textContent = 'Connecting...';

  try {
    const res = await fetch('/api/devices/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, port })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Connection failed');

    if (data.connected) {
      showToast(`Connected to ${data.target}`, 'success');
      dom.connectIp.value = '';
    } else {
      showToast(data.message || 'Connection initiated', 'info');
    }
    await fetchDevices();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    dom.connectSubmitBtn.disabled = false;
    dom.connectSubmitBtn.textContent = 'Connect Device';
  }
});

// OTG Mode toggle
dom.otgLaunchBtn.addEventListener('click', () => {
  state.selectedSerial = 'OTG';
  renderDevices();
  updateTargetDisplay();
  showToast('Target switched to OTG mode (no ADB debugging required)', 'info');
});

// Presets
dom.presetBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    dom.presetBtns.forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    const presetKey = e.currentTarget.getAttribute('data-preset');
    applyPreset(presetKey);
  });
});

function applyPreset(key) {
  const cfg = state.presets[key];
  if (!cfg) return;

  dom.cfgMaxSize.value = cfg.maxSize;
  dom.cfgVideoBitRate.value = cfg.videoBitRate;
  dom.cfgMaxFps.value = cfg.maxFps;
  dom.cfgVideoCodec.value = cfg.videoCodec;
  dom.cfgVideoSource.value = cfg.videoSource;
  dom.cfgNoAudio.checked = cfg.noAudio;
  dom.audioSubFields.classList.toggle('hidden', cfg.noAudio);
  dom.cfgAudioCodec.value = cfg.audioCodec;
  dom.cfgAudioBitRate.value = cfg.audioBitRate;
  dom.cfgTurnScreenOff.checked = cfg.turnScreenOff;
  dom.cfgStayAwake.checked = cfg.stayAwake;
  dom.cfgFullscreen.checked = cfg.fullscreen;
  dom.cfgAlwaysOnTop.checked = cfg.alwaysOnTop;
  dom.cfgWindowBorderless.checked = cfg.windowBorderless;
  dom.cfgShowTouches.checked = cfg.showTouches;
  dom.cfgNoControl.checked = cfg.noControl;
  dom.cfgNoClipboardAutosync.checked = cfg.noClipboardAutosync;
  dom.cfgRecord.checked = cfg.record;
  dom.recordFilenameGroup.classList.toggle('hidden', !cfg.record);
  dom.cfgCustomArgs.value = cfg.customArgs;

  updateCommandPreview();
}

// Checkbox and select listeners for command preview
dom.launcherForm.addEventListener('change', () => {
  dom.audioSubFields.classList.toggle('hidden', dom.cfgNoAudio.checked);
  dom.recordFilenameGroup.classList.toggle('hidden', !dom.cfgRecord.checked);
  updateCommandPreview();
});

dom.launcherForm.addEventListener('input', () => {
  updateCommandPreview();
});

function getLauncherConfig() {
  const isOtg = state.selectedSerial === 'OTG';
  const noVideo = dom.presetBtns[4]?.classList.contains('active') || false;

  return {
    serial: isOtg ? null : state.selectedSerial,
    otg: isOtg,
    maxSize: dom.cfgMaxSize.value,
    videoBitRate: dom.cfgVideoBitRate.value,
    maxFps: dom.cfgMaxFps.value,
    videoCodec: dom.cfgVideoCodec.value,
    videoSource: dom.cfgVideoSource.value,
    noAudio: dom.cfgNoAudio.checked,
    audioCodec: dom.cfgAudioCodec.value,
    audioBitRate: dom.cfgAudioBitRate.value,
    turnScreenOff: dom.cfgTurnScreenOff.checked,
    stayAwake: dom.cfgStayAwake.checked,
    fullscreen: dom.cfgFullscreen.checked,
    alwaysOnTop: dom.cfgAlwaysOnTop.checked,
    windowBorderless: dom.cfgWindowBorderless.checked,
    showTouches: dom.cfgShowTouches.checked,
    noControl: dom.cfgNoControl.checked,
    noClipboardAutosync: dom.cfgNoClipboardAutosync.checked,
    record: dom.cfgRecord.checked,
    recordFilename: dom.cfgRecordFilename.value.trim(),
    noVideo,
    customArgs: dom.cfgCustomArgs.value.trim()
  };
}

function updateCommandPreview() {
  const cfg = getLauncherConfig();
  const parts = ['scrcpy'];

  if (cfg.otg) {
    parts.push('--otg');
  } else if (cfg.serial) {
    parts.push('-s', cfg.serial);
  }

  if (cfg.maxSize) parts.push(`--max-size=${cfg.maxSize}`);
  if (cfg.videoBitRate) parts.push(`--video-bit-rate=${cfg.videoBitRate}`);
  if (cfg.maxFps) parts.push(`--max-fps=${cfg.maxFps}`);
  if (cfg.videoCodec && cfg.videoCodec !== 'h264') parts.push(`--video-codec=${cfg.videoCodec}`);
  if (cfg.videoSource && cfg.videoSource !== 'display') parts.push(`--video-source=${cfg.videoSource}`);

  if (cfg.noAudio) {
    parts.push('--no-audio');
  } else {
    if (cfg.audioCodec && cfg.audioCodec !== 'opus') parts.push(`--audio-codec=${cfg.audioCodec}`);
    if (cfg.audioBitRate && cfg.audioBitRate !== '128K') parts.push(`--audio-bit-rate=${cfg.audioBitRate}`);
  }

  if (cfg.turnScreenOff) parts.push('--turn-screen-off');
  if (cfg.stayAwake) parts.push('--stay-awake');
  if (cfg.fullscreen) parts.push('--fullscreen');
  if (cfg.alwaysOnTop) parts.push('--always-on-top');
  if (cfg.windowBorderless) parts.push('--window-borderless');
  if (cfg.showTouches) parts.push('--show-touches');
  if (cfg.noControl) parts.push('--no-control');
  if (cfg.noClipboardAutosync) parts.push('--no-clipboard-autosync');

  if (cfg.noVideo) parts.push('--no-video');
  if (cfg.record) {
    parts.push(`--record=recordings/${cfg.recordFilename || 'capture.mp4'}`);
  }

  if (cfg.customArgs) parts.push(cfg.customArgs);

  dom.commandPreview.textContent = parts.join(' ');
}

// Launch scrcpy session
dom.launcherForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!state.selectedSerial) {
    showToast('Select a target device first', 'error');
    return;
  }

  const config = getLauncherConfig();
  dom.launchScrcpyBtn.disabled = true;

  try {
    const res = await fetch('/api/sessions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to start session');

    showToast(`Session ${data.id} launched (PID ${data.pid})`, 'success');
    fetchSessions();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    dom.launchScrcpyBtn.disabled = false;
  }
});

// Active Sessions
async function fetchSessions() {
  try {
    const res = await fetch('/api/sessions');
    const data = await res.json();
    state.sessions = (data.sessions || []).filter(s => s.status === 'running');
    renderSessions();
  } catch {
    // Silent fail on session polling
  }
}

function renderSessions() {
  dom.sessionCounter.textContent = String(state.sessions.length);

  if (state.sessions.length === 0) {
    dom.sessionEmptyState.classList.remove('hidden');
    dom.sessionList.classList.add('hidden');
    return;
  }

  dom.sessionEmptyState.classList.add('hidden');
  dom.sessionList.classList.remove('hidden');
  dom.sessionList.innerHTML = '';

  for (const session of state.sessions) {
    const card = document.createElement('div');
    card.className = 'session-card';
    card.setAttribute('role', 'listitem');

    const startedTime = new Date(session.startedAt).toLocaleTimeString();

    card.innerHTML = `
      <div class="session-info">
        <span class="session-target">${escapeHtml(session.serial)}</span>
        <span class="session-pid">PID: ${session.pid}</span>
        <span class="session-duration">Started at ${startedTime}</span>
      </div>
      <button type="button" class="btn btn-sm btn-danger btn-stop-session" data-id="${session.id}">
        Stop Session
      </button>
    `;

    dom.sessionList.appendChild(card);
  }

  dom.sessionList.querySelectorAll('.btn-stop-session').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      try {
        const res = await fetch(`/api/sessions/${encodeURIComponent(id)}/stop`, {
          method: 'POST'
        });
        const data = await res.json();
        showToast(`Session stopped (${id})`, 'info');
        fetchSessions();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

// Real-time Event Stream (SSE)
function initEventStream() {
  const evtSource = new EventSource('/api/events');

  evtSource.addEventListener('connected', () => {
    dom.logStreamIndicator.textContent = 'LIVE';
    dom.logStreamIndicator.style.backgroundColor = 'rgba(35, 134, 54, 0.2)';
  });

  evtSource.addEventListener('session_log', (e) => {
    try {
      const payload = JSON.parse(e.data);
      appendConsoleLog(payload.line, 'log-session');
    } catch {}
  });

  evtSource.addEventListener('session_start', (e) => {
    try {
      const payload = JSON.parse(e.data);
      appendConsoleLog(`[Session] Started ${payload.id} for ${payload.serial} (PID ${payload.pid})`, 'log-info');
      fetchSessions();
    } catch {}
  });

  evtSource.addEventListener('session_status', (e) => {
    try {
      const payload = JSON.parse(e.data);
      if (payload.status === 'stopped') {
        appendConsoleLog(`[Session] ${payload.id} terminated with exit code ${payload.code}`, 'log-info');
      } else if (payload.status === 'error') {
        appendConsoleLog(`[Session] ${payload.id} error: ${payload.error}`, 'log-error');
      }
      fetchSessions();
    } catch {}
  });

  evtSource.onerror = () => {
    dom.logStreamIndicator.textContent = 'RECONNECTING';
    dom.logStreamIndicator.style.backgroundColor = 'rgba(218, 54, 51, 0.2)';
  };
}

function appendConsoleLog(text, className = 'log-info') {
  const line = document.createElement('div');
  line.className = `log-line ${className}`;
  line.textContent = text;
  dom.consoleOutput.appendChild(line);

  // Keep max 250 visible lines
  while (dom.consoleOutput.children.length > 250) {
    dom.consoleOutput.removeChild(dom.consoleOutput.firstChild);
  }

  dom.consoleOutput.scrollTop = dom.consoleOutput.scrollHeight;
}

dom.clearLogsBtn.addEventListener('click', () => {
  dom.consoleOutput.innerHTML = '';
  appendConsoleLog('[Console] Log cleared.', 'log-info');
});

// Device Details Modal
async function openDeviceModal(serial) {
  state.activeModalSerial = serial;
  dom.deviceModal.classList.remove('hidden');
  dom.modalLoadingState.classList.remove('hidden');
  dom.modalDetailsContent.classList.add('hidden');

  try {
    const res = await fetch(`/api/devices/${encodeURIComponent(serial)}/details`);
    const details = await res.json();

    dom.specSerial.textContent = details.serial || serial;
    dom.specModel.textContent = details.manufacturer ? `${details.manufacturer} ${details.model || ''}` : (details.model || 'Generic Android');
    dom.specAndroidVer.textContent = details.androidVersion ? `Android ${details.androidVersion}` : 'Unknown';
    dom.specResolution.textContent = details.resolution || 'Unknown';
    dom.specBattery.textContent = details.batteryLevel !== null ? `${details.batteryLevel}% (${details.batteryStatus || 'Unknown'})` : 'Unavailable';
    dom.specIp.textContent = details.wifiIp || 'Not connected to Wi-Fi';

    dom.modalLoadingState.classList.add('hidden');
    dom.modalDetailsContent.classList.remove('hidden');
  } catch (err) {
    dom.modalLoadingState.classList.add('hidden');
    showToast(`Failed to load details: ${err.message}`, 'error');
  }
}

function closeModals() {
  dom.deviceModal.classList.add('hidden');
  dom.screenshotModal.classList.add('hidden');
  state.activeModalSerial = null;
}

dom.closeModalBtn.addEventListener('click', closeModals);
dom.modalDismissBtn.addEventListener('click', closeModals);
dom.closeScreenshotModalBtn.addEventListener('click', closeModals);
dom.dismissScreenshotBtn.addEventListener('click', closeModals);

// Hardware action buttons in modal
dom.modalHardwareActions.querySelectorAll('[data-keyevent]').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const keycode = e.currentTarget.getAttribute('data-keyevent');
    if (!state.activeModalSerial) return;

    try {
      await fetch(`/api/devices/${encodeURIComponent(state.activeModalSerial)}/keyevent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keycode })
      });
      showToast(`Key event ${keycode} sent`, 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
});

dom.modalRebootBtn.addEventListener('click', async () => {
  if (!state.activeModalSerial) return;
  const confirmed = window.confirm(`Reboot device ${state.activeModalSerial}?`);
  if (!confirmed) return;

  try {
    await fetch(`/api/devices/${encodeURIComponent(state.activeModalSerial)}/reboot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: '' })
    });
    showToast('Reboot command sent to device', 'info');
    closeModals();
    setTimeout(fetchDevices, 2000);
  } catch (err) {
    showToast(err.message, 'error');
  }
});

dom.modalSwitchTcpipBtn.addEventListener('click', async () => {
  if (!state.activeModalSerial) return;
  try {
    const res = await fetch(`/api/devices/${encodeURIComponent(state.activeModalSerial)}/tcpip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ port: 5555 })
    });
    const data = await res.json();
    showToast(`Device switched to TCP/IP port ${data.port}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

dom.modalTakeScreenshotBtn.addEventListener('click', () => {
  if (!state.activeModalSerial) return;
  takeScreenshot(state.activeModalSerial);
});

async function takeScreenshot(serial) {
  showToast('Capturing device screenshot...', 'info');
  const imgUrl = `/api/devices/${encodeURIComponent(serial)}/screenshot?t=${Date.now()}`;

  dom.screenshotImg.src = imgUrl;
  dom.downloadScreenshotBtn.href = imgUrl;
  dom.downloadScreenshotBtn.download = `screenshot_${serial}_${Date.now()}.png`;

  dom.screenshotModal.classList.remove('hidden');
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModals();
  }

  // Press 'R' to refresh devices when not in input
  if ((e.key === 'r' || e.key === 'R') && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    fetchDevices();
    showToast('Scanning devices...', 'info');
  }
});

dom.refreshBtn.addEventListener('click', () => {
  fetchDevices();
  fetchSessions();
  showToast('Refreshing device list...', 'info');
});

dom.retryDeviceBtn.addEventListener('click', () => {
  fetchDevices();
});

if (dom.deviceSearchInput) {
  dom.deviceSearchInput.addEventListener('input', applyDeviceFilter);
}

if (dom.copyCommandBtn) {
  dom.copyCommandBtn.addEventListener('click', async () => {
    const cmdText = dom.commandPreview.textContent.trim();
    if (!cmdText) return;
    try {
      await navigator.clipboard.writeText(cmdText);
      if (dom.copyCommandLabel) dom.copyCommandLabel.textContent = 'Copied!';
      showToast('Command copied to clipboard', 'info');
      setTimeout(() => {
        if (dom.copyCommandLabel) dom.copyCommandLabel.textContent = 'Copy';
      }, 2000);
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initial Boot
applyTheme(state.theme);
fetchSystemStatus();
fetchDevices();
fetchSessions();
initEventStream();
setInterval(fetchSessions, 5000);
