import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const port = 4173;
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' });
const baseUrl = `http://127.0.0.1:${port}`;
let ready = false;
for (let i = 0; i < 60; i++) {
  try { const response = await fetch(baseUrl); if (response.ok) { ready = true; break; } } catch {}
  await delay(500);
}
if (!ready) { server.kill(); throw new Error('Vite preview did not start'); }

const frameDir = '/tmp/vert-frames';
rmSync(frameDir, { recursive: true, force: true });
mkdirSync(frameDir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => { throw error; });
  await page.goto(`${baseUrl}/?manual=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.renderFrame === 'function' && Number.isFinite(window.videoDuration));
  const duration = await page.evaluate(() => window.videoDuration);
  const fps = 60;
  const totalFrames = Math.ceil(duration * fps);
  for (let frame = 0; frame < totalFrames; frame++) {
    const seconds = frame / fps;
    await page.evaluate(t => { window.renderFrame(t); }, seconds);
    const filename = `${frameDir}/frame-${String(frame).padStart(5, '0')}.png`;
    await page.screenshot({ path: filename, animations: 'disabled' });
    if (frame % 120 === 0) process.stdout.write(`Rendered ${frame}/${totalFrames} frames\\n`);
  }
  execFileSync('ffmpeg', [
    '-y', '-framerate', String(fps), '-i', `${frameDir}/frame-%05d.png`,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'video.mp4'
  ], { stdio: 'inherit' });
} finally {
  await browser.close();
  server.kill();
}
