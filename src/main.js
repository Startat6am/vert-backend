import * as THREE from 'three';
import { gsap } from 'gsap';
import { createNodeMaterial, createEnergyLineMaterial, createAtmosphereMaterial } from './shaders.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import './style.css';

const DURATION = 40;
const W = 1080, H = 1920;
const mount = document.querySelector('#canvas');
const headline = document.querySelector('#headline');
const eyebrow = document.querySelector('#eyebrow');
const subline = document.querySelector('#subline');
const progress = document.querySelector('#progress');
const timecode = document.querySelector('#timecode');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070914, 0.035);
const camera = new THREE.PerspectiveCamera(42, 9 / 16, 0.1, 100);
camera.position.set(0, 0, 13);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
// Fixed 1080x1920 drawing buffer: predictable output and lower mobile GPU pressure.
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
mount.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(1);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(W, H), 0.9, 0.62, 0.16);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

const atmosphere = new THREE.Mesh(new THREE.PlaneGeometry(36, 64), createAtmosphereMaterial());
atmosphere.position.set(0, 0, -18); scene.add(atmosphere);
scene.add(new THREE.AmbientLight(0x8daaff, 1.5));
const key = new THREE.PointLight(0x67dcff, 55, 35); key.position.set(2, 5, 8); scene.add(key);
const rim = new THREE.PointLight(0x9a65ff, 45, 30); rim.position.set(-5, -2, -5); scene.add(rim);

const world = new THREE.Group(); scene.add(world);
const tokenGroup = new THREE.Group(); world.add(tokenGroup);
const networkGroup = new THREE.Group(); world.add(networkGroup);
const outputGroup = new THREE.Group(); world.add(outputGroup);

function roundedBox(w, h, d, color, emissive = color) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: .28, metalness: .45, roughness: .28 })
  );
  return mesh;
}

// Opening phrase fragments: illustrative token boundaries, not a tokenizer specification.
const tokenLabels = ['При', 'вет', ',', 'как', 'де', 'ла', '?'];
const tokenMeshes = [];
tokenLabels.forEach((label, i) => {
  const g = new THREE.Group();
  const block = roundedBox(1.12, .72, .18, i % 2 ? 0x293c83 : 0x12627c, 0x36cfff);
  g.add(block);
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 58px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, 128, 64);
  const tex = new THREE.CanvasTexture(canvas);
  const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(.98, .49), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  labelMesh.position.z = .105; g.add(labelMesh);
  g.position.set((i - 3) * 1.27, 0, 0);
  tokenGroup.add(g); tokenMeshes.push(g);
});

// Layered abstract transformer metaphor.

const nodes = [];
const links = [];
for (let layer = 0; layer < 5; layer++) {
  const layerNodes = [];
  for (let n = 0; n < 7; n++) {
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(.16 + (n % 3) * .035, 2), createNodeMaterial());
    mesh.position.set((layer - 2) * 2.15, (n - 3) * .82 + Math.sin(layer * 2 + n) * .18, Math.sin(layer * 7 + n * 3) * .75);
    networkGroup.add(mesh); nodes.push(mesh); layerNodes.push(mesh);
  }
  if (layer > 0) {
    const prev = nodes.slice((layer - 1) * 7, layer * 7);
    layerNodes.forEach((a, ai) => prev.forEach((b, bi) => {
      if ((ai + bi) % 3 === 0 || ai === bi) {
        const geo = new THREE.BufferGeometry().setFromPoints([a.position, b.position]);
        const line = new THREE.Line(geo, createEnergyLineMaterial());
        networkGroup.add(line); links.push(line);
      }
    }));
  }
}

const answerCanvas = document.createElement('canvas'); answerCanvas.width = 1024; answerCanvas.height = 256;
const answerCtx = answerCanvas.getContext('2d');
answerCtx.fillStyle = '#eafaff'; answerCtx.font = 'bold 86px Arial'; answerCtx.textAlign = 'center'; answerCtx.textBaseline = 'middle';
answerCtx.fillText('Привет! Чем могу помочь?', 512, 128);
const answerTexture = new THREE.CanvasTexture(answerCanvas);
const answer = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 2.3), new THREE.MeshBasicMaterial({ map: answerTexture, transparent: true }));
answer.position.set(0, 0, 1); outputGroup.add(answer);

const starGeo = new THREE.BufferGeometry();
const starPositions = new Float32Array(600 * 3);
for (let i = 0; i < 600; i++) {
  starPositions[i * 3] = (Math.sin(i * 127.1) * 43758.5453 % 1) * 24;
  starPositions[i * 3 + 1] = (Math.sin(i * 311.7) * 24634.6345 % 1) * 40;
  starPositions[i * 3 + 2] = (Math.sin(i * 74.7) * 12515.8731 % 1) * 18 - 4;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x7aaeff, size: .035, transparent: true, opacity: .65 }));
scene.add(stars);

function setCopy(tag, title, sub) {
  eyebrow.textContent = tag; headline.innerHTML = title; subline.textContent = sub;
}
const states = [
  { at: 0, tag: 'ВОПРОС', title: 'Как ИИ<br>создаёт ответ?', sub: 'Он не читает мысли. Он обрабатывает текст.' },
  { at: 3, tag: 'ШАГ 01', title: 'Текст →<br>токены', sub: 'Слова, части слов и символы' },
  { at: 12, tag: 'ШАГ 02', title: 'Контекст<br>и связи', sub: 'Трансформер учитывает отношения между токенами' },
  { at: 22, tag: 'ШАГ 03', title: 'Токен<br>за токеном', sub: 'Модель выбирает вероятное продолжение' },
  { at: 32, tag: 'ВАЖНО ПОМНИТЬ', title: 'Уверенно<br>≠ правильно', sub: 'Убедительный ответ всё ещё может быть ошибочным.' }
];

// Paused GSAP timeline is seekable at any absolute timestamp.
const timeline = gsap.timeline({ paused: true });
tokenMeshes.forEach((mesh, i) => {
  timeline.fromTo(mesh.position, { y: -3.8, z: -2 }, { y: .15, z: 0, duration: .48, ease: 'back.out(1.7)' }, 4.2 + i * .42);
  timeline.to(mesh.rotation, { y: Math.PI * 2, duration: .8, ease: 'power2.inOut' }, 6.8 + i * .12);
});
timeline.fromTo(networkGroup.position, { z: -8, scale: .65 }, { z: 0, scale: 1, duration: 3.5, ease: 'power2.out' }, 12);
timeline.fromTo(networkGroup.rotation, { y: -.4 }, { y: .35, duration: 10, ease: 'sine.inOut' }, 12);
nodes.forEach((node, i) => {
  timeline.to(node.material.uniforms.uPulse, { value: 2.2, duration: .28, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 14 + (i % 9) * .18);
});
timeline.fromTo(outputGroup.scale, { x: .05, y: .05, z: .05 }, { x: 1, y: 1, z: 1, duration: 1.4, ease: 'elastic.out(1,.6)' }, 23);
timeline.fromTo(answer.material, { opacity: 0 }, { opacity: 1, duration: .8 }, 24);
timeline.to(answer.rotation, { z: -.025, duration: 1, yoyo: true, repeat: 1 }, 28);
timeline.to(world.scale, { x: 1.12, y: 1.12, z: 1.12, duration: 2, ease: 'power2.inOut' }, 32);
timeline.to(world.rotation, { z: .08, duration: 2 }, 33);

function renderFrame(seconds) {
  const t = THREE.MathUtils.clamp(seconds, 0, DURATION);
  timeline.time(t, false);
  atmosphere.material.uniforms.uTime.value = t;
  nodes.forEach(node => { node.material.uniforms.uTime.value = t; });
  links.forEach(link => { link.material.uniforms.uTime.value = t; });
  const state = [...states].reverse().find(s => t >= s.at) || states[0];
  setCopy(state.tag, state.title, state.sub);
  tokenGroup.visible = t >= 3 && t < 22;
  networkGroup.visible = t >= 10 && t < 34;
  outputGroup.visible = t >= 22;
  camera.position.x = Math.sin(t * .22) * (t > 12 && t < 32 ? .65 : .18);
  camera.position.y = t > 12 && t < 22 ? Math.sin(t * .5) * .28 : 0;
  camera.position.z = t >= 32 ? 11.5 : 13;
  camera.lookAt(0, 0, 0);
  stars.rotation.y = t * .008;
  composer.render();
  progress.style.width = `${(t / DURATION) * 100}%`;
  timecode.textContent = `00:${String(Math.floor(t)).padStart(2, '0')}`;
  return renderer.domElement;
}
window.renderFrame = renderFrame;
window.videoDuration = DURATION;

const params = new URLSearchParams(location.search);
const requestedTime = Number(params.get('t'));
if (params.has('t') && Number.isFinite(requestedTime)) {
  renderFrame(requestedTime);
} else {
  const start = performance.now();
  function animate(now) {
    const elapsed = ((now - start) / 1000) % DURATION;
    renderFrame(elapsed);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  const width = mount.clientWidth || W;
  const height = mount.clientHeight || H;
  renderer.setSize(width, height, false);
  composer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
