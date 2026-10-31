import * as THREE from 'three';
import { gsap } from 'gsap';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import './style.css';

const DURATION = 40;
const mount = document.querySelector('#canvas');
const stage = document.querySelector('#stage');
const headline = document.querySelector('#headline');
const eyebrow = document.querySelector('#eyebrow');
const subline = document.querySelector('#subline');
const progress = document.querySelector('#progress');
const timecode = document.querySelector('#timecode');
const playToggle = document.querySelector('#play-toggle');
const playIcon = document.querySelector('#play-icon');
const playLabel = document.querySelector('#play-label');
const scenarioToggle = document.querySelector('#scenario-toggle');
const scenarioModal = document.querySelector('#scenario-modal');
const scenarioClose = document.querySelector('#scenario-close');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#050914');
scene.fog = new THREE.FogExp2(0x050914, 0.012);
const camera = new THREE.PerspectiveCamera(43, 9 / 16, 0.1, 140);
camera.position.set(0, 0, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
mount.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.12, 0.32, 0.82));
composer.addPass(new OutputPass());

scene.add(new THREE.AmbientLight(0x8ba6cf, 1.15));
const key = new THREE.PointLight(0x69c9ed, 22, 55);
key.position.set(3, 5, 10);
scene.add(key);
const rim = new THREE.PointLight(0x6e80d9, 16, 45);
rim.position.set(-8, -2, -9);
scene.add(rim);

const world = new THREE.Group();
scene.add(world);

function textSprite(text, opts = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = opts.width || 1024;
  canvas.height = opts.height || 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${opts.weight || 600} ${opts.fontSize || 84}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = opts.color || '#eaf4ff';
  ctx.shadowColor = opts.shadow || 'rgba(70,170,220,.18)';
  ctx.shadowBlur = opts.blur ?? 10;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width * .92);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 1, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(opts.w || 5.5, opts.h || 1.25), material);
  mesh.userData.texture = texture;
  return mesh;
}
function card(text, color = '#7bd8ed') {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: '#101d31', metalness: .42, roughness: .38, transparent: true, opacity: .96 });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.9, .72, .12), material);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(1.94, .76, .035), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .35, wireframe: true }));
  const label = textSprite(text, { w: 1.72, h: .45, fontSize: 104, color, blur: 2 });
  label.position.z = .09;
  group.add(plate, edge, label);
  group.userData.materials = [material, edge.material, label.material];
  return group;
}
function setGroupOpacity(group, value) {
  group.traverse(obj => {
    if (!obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach(m => { if ('opacity' in m) m.opacity = value; });
  });
}

const dust = new THREE.Group();
world.add(dust);
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(480 * 3);
for (let i = 0; i < 480; i++) {
  dustPos[i * 3] = (Math.random() - .5) * 34;
  dustPos[i * 3 + 1] = (Math.random() - .5) * 48;
  dustPos[i * 3 + 2] = -24 + Math.random() * 28;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustPoints = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x7897bd, size: .027, transparent: true, opacity: .36, depthWrite: false }));
dust.add(dustPoints);

// Hook: a readable question fractures into a controlled stream of particles.
const hookGroup = new THREE.Group();
world.add(hookGroup);
const hookText = textSprite('Как ИИ создаёт ответ?', { w: 8.4, h: 1.35, fontSize: 100, weight: 650, color: '#f2f6ff', blur: 3 });
hookText.position.set(0, .35, 0);
hookGroup.add(hookText);
const hookParticles = [];
for (let i = 0; i < 88; i++) {
  const geo = new THREE.IcosahedronGeometry(.025 + Math.random() * .035, 1);
  const mat = new THREE.MeshStandardMaterial({ color: i % 4 ? '#72cfe5' : '#a6b9ed', emissive: '#183c54', emissiveIntensity: .35, roughness: .45 });
  const p = new THREE.Mesh(geo, mat);
  p.position.set((Math.random() - .5) * 8, (Math.random() - .5) * 2.5, (Math.random() - .5) * 2);
  hookGroup.add(p); hookParticles.push(p);
}

// Tokenization: varied fragments, not a row of identical cubes.
const tokenGroup = new THREE.Group();
world.add(tokenGroup);
const tokenLabels = ['При', 'вет', ',', 'как', 'де', 'ла', '?'];
const tokenCards = tokenLabels.map((label, i) => {
  const item = card(label, ['#83d9e8', '#9eb8f0', '#e0c78f'][i % 3]);
  item.position.set((i - 3) * 1.22, Math.sin(i * 1.4) * .42, (i % 3) * .42);
  item.rotation.z = Math.sin(i * 2.1) * .08;
  item.rotation.y = (i - 3) * .035;
  tokenGroup.add(item);
  return item;
});
const tokenTrails = [];
for (let i = 0; i < 42; i++) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(.025 + Math.random() * .025, 8, 8), new THREE.MeshBasicMaterial({ color: i % 2 ? '#5abdd8' : '#9ab9ed', transparent: true, opacity: .72 }));
  m.position.set((Math.random() - .5) * 8, (Math.random() - .5) * 3, -1 - Math.random() * 4);
  tokenGroup.add(m); tokenTrails.push(m);
}

// Abstract transformer: staggered, tilted planes with uneven node positions and cross-layer attention links.
const networkGroup = new THREE.Group();
world.add(networkGroup);
const layers = [];
const networkNodes = [];
const networkLines = [];
const layerSpecs = [
  { z: 1, x: -2.2, tilt: -.12, pts: [[-1.5,1.4],[-.2,.8],[1.3,1.5],[-1.1,-.1],[.5,-.5],[1.7,-1.4],[-1.6,-1.5]] },
  { z: -2.2, x: .3, tilt: .1, pts: [[-1.4,1.7],[.2,1.15],[1.7,.8],[-1.7,-.2],[-.1,-.1],[1.2,-.8],[-.9,-1.65],[1.8,-1.6]] },
  { z: -5.4, x: -1.0, tilt: -.08, pts: [[-1.8,1.3],[-.4,1.7],[1.4,1.1],[-1.3,.1],[.5,-.3],[1.8,-.7],[-.6,-1.55]] },
  { z: -8.5, x: .6, tilt: .13, pts: [[-1.5,1.6],[.1,1.1],[1.7,1.5],[-1.7,-.3],[-.1,-.2],[1.1,-.9],[-1.0,-1.7],[1.8,-1.6]] }
];
layerSpecs.forEach((spec, li) => {
  const layer = new THREE.Group();
  layer.position.set(spec.x, 0, spec.z);
  layer.rotation.z = spec.tilt;
  networkGroup.add(layer); layers.push(layer);
  const nodes = spec.pts.map(([x, y], ni) => {
    const radius = .12 + ((li * 7 + ni * 3) % 4) * .025;
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, 2),
      new THREE.MeshStandardMaterial({ color: ni % 3 ? '#6ebbd7' : '#a6b9e9', emissive: '#1b465f', emissiveIntensity: .32, metalness: .42, roughness: .3, transparent: true, opacity: .92 })
    );
    mesh.position.set(x, y, (ni % 3 - 1) * .22);
    layer.add(mesh); networkNodes.push(mesh);
    return mesh;
  });
  spec.nodes = nodes;
});
for (let li = 0; li < layerSpecs.length - 1; li++) {
  const a = layerSpecs[li], b = layerSpecs[li + 1];
  a.nodes.forEach((from, i) => {
    const candidates = b.nodes.map((to, j) => ({ to, j, score: Math.abs(from.position.y - to.position.y) + Math.abs(i - j) * .19 })).sort((x, y) => x.score - y.score).slice(0, 2 + (i % 2));
    candidates.forEach(({ to, j }, k) => {
      const start = from.getWorldPosition(new THREE.Vector3());
      const end = to.getWorldPosition(new THREE.Vector3());
      const mid = start.clone().lerp(end, .5);
      mid.x += ((i + j) % 2 ? .18 : -.18);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(28)), new THREE.LineBasicMaterial({ color: (i + j + k) % 3 ? '#4c9dbb' : '#839dd8', transparent: true, opacity: .16, depthWrite: false }));
      networkGroup.add(line); networkLines.push(line);
    });
  });
}
const signal = new THREE.Group();
networkGroup.add(signal);
const signalDots = [];
for (let i = 0; i < 14; i++) {
  const dot = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 10), new THREE.MeshBasicMaterial({ color: '#b4eaff', transparent: true, opacity: .9 }));
  signal.add(dot); signalDots.push(dot);
}

// Candidate continuations and one selected token.
const generationGroup = new THREE.Group();
world.add(generationGroup);
const candidates = ['сегодня', 'вчера', 'возможно'];
const candidateMeshes = candidates.map((label, i) => {
  const item = card(label, i === 1 ? '#83d6e8' : '#8b9cb9');
  item.position.set([-2.2, 0, 2.2][i], .55 - i * .45, -i * .2);
  item.scale.setScalar(.82);
  generationGroup.add(item);
  return item;
});
const answerText = textSprite('Привет! Рад тебя видеть.', { w: 8.8, h: 1.25, fontSize: 92, weight: 650, color: '#f0f6ff', blur: 4 });
answerText.position.set(0, -.35, -1.2);
generationGroup.add(answerText);
const answerTokens = ['Привет!', 'Рад', 'тебя', 'видеть.'].map((word, i) => {
  const mesh = textSprite(word, { w: [2.2, 1.5, 1.8, 2.1][i], h: .72, fontSize: 104, color: '#d8efff', blur: 2 });
  mesh.position.set(-3.1 + i * 2.05, -1.65, -.8);
  mesh.scale.setScalar(.01);
  generationGroup.add(mesh);
  return mesh;
});

// Ending: sentence recedes into a question mark, leaving a quiet readable final frame.
const endingGroup = new THREE.Group();
world.add(endingGroup);
const finalLine = textSprite('Уверенный ответ', { w: 7.2, h: 1.15, fontSize: 104, color: '#edf4ff', blur: 2 });
finalLine.position.set(0, .45, 0);
endingGroup.add(finalLine);
const question = textSprite('?', { w: 1.45, h: 2.1, fontSize: 240, weight: 500, color: '#9dd9e9', blur: 2 });
question.position.set(2.65, .42, .18);
question.scale.setScalar(.01);
endingGroup.add(question);
const finalClaim = textSprite('Уверенно ≠ правильно', { w: 8.8, h: 1.1, fontSize: 92, weight: 650, color: '#f3f6ff', blur: 1 });
finalClaim.position.set(0, -1.2, .3);
finalClaim.scale.setScalar(.01);
endingGroup.add(finalClaim);

const states = [
  { at: 0, tag: 'ВОПРОС', title: 'Как ИИ создаёт ответ?', sub: 'ИИ не читает твои мысли. Тогда как он отвечает?' },
  { at: 3, tag: 'ШАГ 01 · ТОКЕНИЗАЦИЯ', title: 'Текст → токены', sub: 'Слова, части слов и отдельные символы' },
  { at: 12, tag: 'ШАГ 02 · КОНТЕКСТ', title: 'Контекст и связи', sub: 'Трансформер учитывает отношения между токенами' },
  { at: 22, tag: 'ШАГ 03 · ГЕНЕРАЦИЯ', title: 'Токен за токеном', sub: 'Модель выбирает продолжение шаг за шагом' },
  { at: 32, tag: 'ГЛАВНОЕ', title: 'Уверенно ≠ правильно', sub: 'Убедительный ответ ещё не гарантирует точность' }
];
let activeStateIndex = -1;
function updateCopy(t) {
  let index = 0;
  for (let i = 0; i < states.length; i++) if (t >= states[i].at) index = i;
  if (index === activeStateIndex) return;
  activeStateIndex = index;
  const s = states[index];
  eyebrow.textContent = s.tag;
  headline.textContent = s.title;
  subline.textContent = s.sub;
}

const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
tl.fromTo(hookGroup.scale, { x: .86, y: .86, z: .86 }, { x: 1, y: 1, z: 1, duration: 1.8 }, 0);
tl.to(hookText.material, { opacity: 0, duration: .42 }, 2.35);
hookParticles.forEach((p, i) => {
  const target = new THREE.Vector3((i % 11 - 5) * .44, ((i * 7) % 9 - 4) * .36, -3 - (i % 7) * .35);
  tl.to(p.position, { x: target.x, y: target.y, z: target.z, duration: 1.25, ease: 'power2.in' }, 2.15 + (i % 13) * .045);
  tl.to(p.scale, { x: .15, y: .15, z: .15, duration: .9 }, 2.45 + (i % 11) * .04);
});
tl.to(hookGroup.position, { z: -5, duration: 1.2 }, 2.7);
tl.fromTo(tokenGroup.scale, { x: .01, y: .01, z: .01 }, { x: 1, y: 1, z: 1, duration: .7, ease: 'back.out(1.35)' }, 3.05);
tokenCards.forEach((item, i) => {
  tl.fromTo(item.rotation, { y: -.8, z: .25 }, { y: 0, z: Math.sin(i * 2.1) * .08, duration: .75 }, 3.2 + i * .12);
  tl.to(item.position, { x: item.position.x * 1.16, y: item.position.y + Math.sin(i) * .18, z: item.position.z + .4, duration: 1.4 }, 7.2 + i * .055);
});
tokenTrails.forEach((p, i) => tl.to(p.position, { x: (i % 9 - 4) * .7, y: (i % 7 - 3) * .4, z: -4 - (i % 5), duration: 1.1 }, 8 + (i % 15) * .035));
tl.to(tokenGroup.position, { z: -4.5, duration: 1.5 }, 9.2);
tl.fromTo(networkGroup.scale, { x: .72, y: .72, z: .72 }, { x: 1, y: 1, z: 1, duration: 2.1, ease: 'power3.out' }, 11.7);
tl.to(networkGroup.position, { z: 1.4, duration: 2.4 }, 12);
networkLines.forEach((line, i) => tl.to(line.material, { opacity: .42 + (i % 4) * .045, duration: .55 }, 12.2 + (i % 12) * .07));
networkNodes.forEach((node, i) => {
  tl.fromTo(node.scale, { x: .2, y: .2, z: .2 }, { x: 1, y: 1, z: 1, duration: .48, ease: 'back.out(1.7)' }, 12.1 + (i % 16) * .065);
});
tl.to(camera.position, { x: 1.15, y: .2, z: 5.6, duration: 4.2, ease: 'sine.inOut' }, 14.2);
tl.to(camera.rotation, { y: -.09, x: .035, duration: 3.8 }, 14.4);
tl.to(networkGroup.rotation, { y: .12, x: -.06, duration: 5.5 }, 14.5);
signalDots.forEach((dot, i) => {
  const layerIndex = i % 4;
  const targetX = layerSpecs[layerIndex].x + ((i * 3) % 5 - 2) * .38;
  tl.fromTo(dot.position, { x: -4, y: (i % 5 - 2) * .42, z: 1 }, { x: targetX, y: (i % 6 - 3) * .46, z: -8, duration: 2.4, ease: 'power1.inOut' }, 15.2 + i * .23);
});
tl.to(networkGroup.scale, { x: .8, y: .8, z: .8, duration: 1.4 }, 21);
tl.to(camera.position, { x: 0, y: 0, z: 14, duration: 1.3 }, 21);
tl.to(camera.rotation, { x: 0, y: 0, z: 0, duration: 1.3 }, 21);
tl.fromTo(generationGroup.scale, { x: .01, y: .01, z: .01 }, { x: 1, y: 1, z: 1, duration: .8, ease: 'back.out(1.2)' }, 22);
candidateMeshes.forEach((item, i) => {
  tl.fromTo(item.position, { y: item.position.y - 1.3, z: -3 }, { y: item.position.y, z: -.2, duration: .8 }, 22.25 + i * .16);
});
tl.to(candidateMeshes[0].userData.materials, { opacity: .24, duration: .35 }, 24.3);
tl.to(candidateMeshes[2].userData.materials, { opacity: .24, duration: .35 }, 24.3);
tl.to(candidateMeshes[1].scale, { x: 1.18, y: 1.18, z: 1.18, duration: .55, ease: 'back.out(1.6)' }, 24.35);
tl.to(candidateMeshes[1].position, { y: 1.55, z: .3, duration: .75 }, 24.8);
tl.to(answerText.material, { opacity: 0, duration: .01 }, 22);
answerTokens.forEach((word, i) => {
  tl.to(word.scale, { x: 1, y: 1, z: 1, duration: .32, ease: 'back.out(1.7)' }, 25.1 + i * 1.12);
  tl.to(word.position, { y: -1.28, duration: .3 }, 25.1 + i * 1.12);
});
tl.to(generationGroup.position, { z: .3, duration: 1.4 }, 29.5);
tl.fromTo(endingGroup.scale, { x: .01, y: .01, z: .01 }, { x: 1, y: 1, z: 1, duration: .85, ease: 'power2.out' }, 32);
tl.to(camera.position, { z: 10.6, duration: 3.1, ease: 'power1.inOut' }, 32.1);
tl.to(finalLine.material, { opacity: .38, duration: .65 }, 35.3);
tl.to(question.scale, { x: 1, y: 1, z: 1, duration: .55, ease: 'back.out(1.5)' }, 35.5);
tl.to(finalClaim.scale, { x: 1, y: 1, z: 1, duration: .75, ease: 'power2.out' }, 36.1);
tl.to(endingGroup.position, { z: .6, duration: 2.5 }, 36);
tl.to(dust.rotation, { y: .08, duration: 40 }, 0);

function resizeScene() {
  const width = Math.max(1, mount.clientWidth);
  const height = Math.max(1, mount.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  composer.setSize(width, height);
}
const resizeObserver = new ResizeObserver(resizeScene);
resizeObserver.observe(mount);
resizeScene();

function formatTime(seconds) {
  const value = Math.floor(seconds);
  return `00:${String(value).padStart(2, '0')}`;
}
function renderFrame(seconds) {
  const t = THREE.MathUtils.clamp(seconds, 0, DURATION);
  tl.time(t, false);
  dustPoints.rotation.y = t * .006;
  dustPoints.rotation.x = Math.sin(t * .12) * .012;
  updateCopy(t);
  timecode.textContent = `${formatTime(t)} / 00:40`;
  progress.style.width = `${(t / DURATION) * 100}%`;
  composer.render();
}
window.renderFrame = renderFrame;
window.videoDuration = DURATION;

let currentTime = 0;
let lastTimestamp = 0;
let animationFrame = 0;
let isPlaying = false;
function updatePlaybackUI() {
  playToggle.setAttribute('aria-label', isPlaying ? 'Пауза' : 'Воспроизвести');
  playIcon.textContent = isPlaying ? 'Ⅱ' : '▶';
  playLabel.textContent = isPlaying ? 'Пауза' : 'Продолжить';
  stage.classList.toggle('is-paused', !isPlaying);
}
function pause() {
  isPlaying = false; lastTimestamp = 0;
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = 0; updatePlaybackUI();
}
function tick(timestamp) {
  if (!isPlaying) return;
  if (!lastTimestamp) lastTimestamp = timestamp;
  currentTime += (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  if (currentTime >= DURATION) {
    currentTime = DURATION; renderFrame(currentTime); pause(); return;
  }
  renderFrame(currentTime);
  animationFrame = requestAnimationFrame(tick);
}
function play() {
  if (isPlaying) return;
  if (currentTime >= DURATION) currentTime = 0;
  isPlaying = true; lastTimestamp = 0; updatePlaybackUI();
  animationFrame = requestAnimationFrame(tick);
}
function togglePlayback() { if (isPlaying) pause(); else play(); }

stage.addEventListener('click', event => {
  if (event.target.closest('button')) return;
  togglePlayback();
});
playToggle.addEventListener('click', event => { event.stopPropagation(); togglePlayback(); });
scenarioToggle.addEventListener('click', event => { event.stopPropagation(); pause(); scenarioModal.hidden = false; scenarioClose.focus(); });
scenarioClose.addEventListener('click', () => { scenarioModal.hidden = true; });
scenarioModal.addEventListener('click', event => { if (event.target === scenarioModal) scenarioModal.hidden = true; });
window.addEventListener('keydown', event => {
  if (event.code === 'Escape' && !scenarioModal.hidden) { scenarioModal.hidden = true; return; }
  if (event.code !== 'Space' || event.target instanceof HTMLButtonElement) return;
  event.preventDefault(); togglePlayback();
});
const params = new URLSearchParams(location.search);
const requestedTime = Number(params.get('t'));
if (params.has('t') && Number.isFinite(requestedTime)) {
  currentTime = THREE.MathUtils.clamp(requestedTime, 0, DURATION); renderFrame(currentTime); pause();
} else if (params.has('manual')) {
  renderFrame(0); pause();
} else {
  renderFrame(0); play();
}
