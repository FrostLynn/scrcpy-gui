import assert from 'node:assert/strict';
import http from 'node:http';
import { parseDevicesOutput } from '../src/adb.js';
import { buildScrcpyArgs } from '../src/scrcpy.js';
import { createServer } from '../src/server.js';

// Test 1: ADB devices output parser
{
  const sampleOutput = `
List of devices attached
emulator-5554          device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64 device:emu64a transport_id:1
192.168.1.100:5555     device product:coral model:Pixel_4_XL device:coral transport_id:2
HT7570200041           unauthorized transport_id:3
DEVICE_OFFLINE         offline transport_id:4
`;

  const devices = parseDevicesOutput(sampleOutput);
  assert.equal(devices.length, 4, 'Should parse all 4 attached devices');

  assert.equal(devices[0].serial, 'emulator-5554');
  assert.equal(devices[0].state, 'device');
  assert.equal(devices[0].model, 'sdk gphone64 arm64');
  assert.equal(devices[0].isWifi, false);

  assert.equal(devices[1].serial, '192.168.1.100:5555');
  assert.equal(devices[1].state, 'device');
  assert.equal(devices[1].model, 'Pixel 4 XL');
  assert.equal(devices[1].isWifi, true);

  assert.equal(devices[2].serial, 'HT7570200041');
  assert.equal(devices[2].state, 'unauthorized');
  assert.equal(devices[2].isWifi, false);

  assert.equal(devices[3].serial, 'DEVICE_OFFLINE');
  assert.equal(devices[3].state, 'offline');
}

// Test 2: scrcpy arguments builder
{
  const emptyArgs = buildScrcpyArgs({});
  assert.deepEqual(emptyArgs, [], 'Empty options should yield empty args');

  const fullArgs = buildScrcpyArgs({
    serial: '192.168.1.50:5555',
    maxSize: '1080',
    videoBitRate: '8M',
    maxFps: '60',
    videoCodec: 'h265',
    noAudio: true,
    turnScreenOff: true,
    stayAwake: true,
    fullscreen: true,
    alwaysOnTop: true,
    windowBorderless: true,
    showTouches: true,
    noControl: true,
    noClipboardAutosync: true,
    customArgs: '--window-title=CustomTest --render-driver=opengl'
  });

  assert.ok(fullArgs.includes('-s'), 'Should include serial flag');
  assert.ok(fullArgs.includes('192.168.1.50:5555'), 'Should include serial value');
  assert.ok(fullArgs.includes('--max-size=1080'), 'Should include max-size');
  assert.ok(fullArgs.includes('--video-bit-rate=8M'), 'Should include video-bit-rate');
  assert.ok(fullArgs.includes('--max-fps=60'), 'Should include max-fps');
  assert.ok(fullArgs.includes('--video-codec=h265'), 'Should include video-codec');
  assert.ok(fullArgs.includes('--no-audio'), 'Should include no-audio');
  assert.ok(fullArgs.includes('--turn-screen-off'), 'Should include turn-screen-off');
  assert.ok(fullArgs.includes('--stay-awake'), 'Should include stay-awake');
  assert.ok(fullArgs.includes('--fullscreen'), 'Should include fullscreen');
  assert.ok(fullArgs.includes('--always-on-top'), 'Should include always-on-top');
  assert.ok(fullArgs.includes('--window-borderless'), 'Should include window-borderless');
  assert.ok(fullArgs.includes('--show-touches'), 'Should include show-touches');
  assert.ok(fullArgs.includes('--no-control'), 'Should include no-control');
  assert.ok(fullArgs.includes('--no-clipboard-autosync'), 'Should include no-clipboard-autosync');
  assert.ok(fullArgs.includes('--window-title=CustomTest'), 'Should include custom arg 1');
  assert.ok(fullArgs.includes('--render-driver=opengl'), 'Should include custom arg 2');

  const otgArgs = buildScrcpyArgs({ otg: true });
  assert.ok(otgArgs.includes('--otg'), 'Should support pure OTG mode');
}

// Test 3: HTTP Server endpoints
{
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  function request(pathUrl, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(`${baseUrl}${pathUrl}`, options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
      });
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  // 3a. Static asset index.html
  const indexRes = await request('/');
  assert.equal(indexRes.statusCode, 200);
  assert.ok(indexRes.body.includes('scrcpy deck'), 'index.html should contain brand name');
  assert.ok(indexRes.headers['content-type'].includes('text/html'));

  // 3b. Static asset style.css
  const cssRes = await request('/style.css');
  assert.equal(cssRes.statusCode, 200);
  assert.ok(cssRes.headers['content-type'].includes('text/css'));
  assert.ok(cssRes.body.includes('--bg-base'), 'CSS should declare theme variables');

  // 3c. Static asset app.js
  const jsRes = await request('/app.js');
  assert.equal(jsRes.statusCode, 200);
  assert.ok(jsRes.headers['content-type'].includes('text/javascript'));

  // 3d. API system status
  const systemRes = await request('/api/system');
  assert.equal(systemRes.statusCode, 200);
  const systemData = JSON.parse(systemRes.body);
  assert.ok('adb' in systemData, 'System payload should have adb');
  assert.ok('scrcpy' in systemData, 'System payload should have scrcpy');

  // 3e. API devices
  const devRes = await request('/api/devices');
  assert.equal(devRes.statusCode, 200);
  const devData = JSON.parse(devRes.body);
  assert.ok(Array.isArray(devData.devices), 'Devices response should contain array');

  // 3f. API sessions
  const sessRes = await request('/api/sessions');
  assert.equal(sessRes.statusCode, 200);
  const sessData = JSON.parse(sessRes.body);
  assert.ok(Array.isArray(sessData.sessions), 'Sessions response should contain array');

  // 3g. 404 handler
  const notFoundRes = await request('/non-existent-route-404');
  assert.equal(notFoundRes.statusCode, 404);

  server.close();
}

console.log('All tests passed.');
