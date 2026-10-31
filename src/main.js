import * as THREE from 'three';
import { gsap } from 'gsap';
import { createNodeMaterial, createEnergyLineMaterial, createAtmosphereMaterial } from './shaders.js';
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

const scene = new THREE.Scene();
scene.background = new THREE.Color('#050711');
scene.fog = new THREE.FogExp2(0x050711, 0.018);

const camera = new THREE.PerspectiveCamera(42, 9 / 16, 0.1, 100);
camera.position.set(0, 0, 13);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
mount.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(renderer.getPixelRatio());
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.24, 0.28, 0.62);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

const atmosphere = new THREE.Mesh(new THREE.PlaneGeometry(36, 64), createAtmosphereMaterial());
atmosphere.position.set(0, 0, -18);
scene.add(atmosphere);

scene.add(new THREE.AmbientLight(0x8daaff, 0.65));
const keyLight = new THREE.PointLight(0x67dcff, 18, 28);
keyLight.position.set(1, 3, 7);
scene.add(keyLight);

const networkGroup = new THREE.Group();
networkGroup.position.y = -1.25;
scene.add(networkGroup);

const nodes = [];
const links = [];
const layerCount = 5;
const nodesPerLayer = 5;
const xSpacing = 1.02;
const ySpacing = 1.12;

// Five straight, evenly spaced columns make the network readable at phone size.
for (let layer = 0; layer < layerCount; layer++) {
  for (let row = 0; row < nodesPerLayer; row++) {
    const node = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.145, 2),
      createNodeMaterial()
    );
    node.position.set(
      (layer - (layerCount - 1) / 2) * xSpacing,
      ((nodesPerLayer - 1) / 2 - row) * ySpacing,
      Math.sin(layer * 1.7 + row * 0.8) * 0.12
    );
    node.scale.setScalar(0.01);
    networkGroup.add(node);
    nodes.push(node);
  }
}

// Connect nearby neurons only; thin, dim links remain secondary to the nodes.
for (let layer = 0; layer < layerCount - 1; layer++) {
  for (let row = 0; row < nodesPerLayer; row++) {
    const from = nodes[layer * nodesPerLayer + row];
    for (let offset = -1; offset <= 1; offset++) {
      const nextRow = row + offset;
      if (nextRow < 0 || nextRow >= nodesPerLayer) continue;
      const to = nodes[(layer + 1) * nodesPerLayer + nextRow];
      const geometry = new THREE.BufferGeometry().setFromPoints([from.position, to.position]);
      const material = createEnergyLineMaterial();
      material.uniforms.uOpacity.value = 0;
      const line = new THREE.Line(geometry, material);
      networkGroup.add(line);
      links.push(line);
    }
  }
}

const starPositions = new Float32Array(220 * 3);
for (let i = 0; i < 220; i++) {
  starPositions[i * 3] = (Math.sin(i * 127.1) * 0.5) * 16;
  starPositions[i * 3 + 1] = (Math.sin(i * 311.7) * 0.5) * 25;
  starPositions[i * 3 + 2] = -3 - (i % 12);
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({ color: 0x7199d8, size: 0.018, transparent: true, opacity: 0.32 })
);
scene.add(stars);

const states = [
  { at: 0, tag: 'КАК РАБОТАЕТ ИИ', title: 'Как ИИ<br>создаёт ответ?', sub: 'От текста запроса до следующего токена' },
  { at: 4, tag: 'ШАГ 01', title: 'Текст → токены', sub: 'Запрос разбивается на небольшие фрагменты' },
  { at: 12, tag: 'ШАГ 02', title: 'Контекст и связи', sub: 'Модель учитывает отношения между фрагментами' },
  { at: 23, tag: 'ШАГ 03', title: 'Следующий токен', sub: 'Модель оценивает вероятные варианты продолжения' },
  { at: 32, tag: 'ВАЖНО ПОМНИТЬ', title: 'Уверенно ≠ правильно', sub: 'Убедительный ответ всё ещё может быть ошибочным' }
];

function setCopy(state) {
  eyebrow.textContent = state.tag;
  headline.innerHTML = state.title;
  subline.textContent = state.sub;
}

const timeline = gsap.timeline({ paused: true });
nodes.forEach((node, index) => {
  timeline.to(node.scale, {
    x: 1, y: 1, z: 1,
    duration: 0.48,
    ease: 'power2.out'
  }, index * 0.035);
  timeline.to(node.material.uniforms.uPulse, {
    value: 1.28,
    duration: 0.24,
    yoyo: true,
    repeat: 2,
    ease: 'sine.inOut'
  }, 2.2 + (index % 8) * 0.16);
});
links.forEach((line, index) => {
  timeline.to(line.material.uniforms.uOpacity, {
    value: 0.16,
    duration: 0.65,
    ease: 'sine.out'
  }, 0.35 + index * 0.012);
});
timeline.fromTo(networkGroup.scale, {
  x: 0.96, y: 0.96, z: 0.96
}, {
  x: 1, y: 1, z: 1,
  duration: 1.8,
  ease: 'sine.out'
}, 0);
timeline.to(networkGroup.rotation, {
  y: 0.035,
  duration: 5,
  yoyo: true,
  repeat: 5,
  ease: 'sine.inOut'
}, 8);

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

let activeStateIndex = -1;\n\nfunction renderFrame(seconds) {
  const t = THREE.MathUtils.clamp(seconds, 0, DURATION);
  timeline.time(t, false);
  atmosphere.material.uniforms.uTime.value = t;
  nodes.forEach(node => { node.material.uniforms.uTime.value = t; });
  links.forEach(line => { line.material.uniforms.uTime.value = t; });

  const state = [...states].reverse().find(item => t >= item.at) || states[0];
  setCopy(state);
  stars.rotation.y = t * 0.002;
  composer.render();

  timecode.textContent = `${formatTime(t)} / 00:40`;
  progress.style.width = `${(t / DURATION) * 100}%`;
  return renderer.domElement;
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
  isPlaying = false;
  lastTimestamp = 0;
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  updatePlaybackUI();
}

function tick(timestamp) {
  if (!isPlaying) return;
  if (!lastTimestamp) lastTimestamp = timestamp;
  currentTime += (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (currentTime >= DURATION) {
    currentTime = DURATION;
    renderFrame(currentTime);
    pause();
    return;
  }

  renderFrame(currentTime);
  animationFrame = requestAnimationFrame(tick);
}

function play() {
  if (isPlaying) return;
  if (currentTime >= DURATION) currentTime = 0;
  isPlaying = true;
  lastTimestamp = 0;
  updatePlaybackUI();
  animationFrame = requestAnimationFrame(tick);
}

function togglePlayback() {
  if (isPlaying) pause();
  else play();
}

stage.addEventListener('click', togglePlayback);
playToggle.addEventListener('click', event => {
  event.stopPropagation();
  togglePlayback();
});

window.addEventListener('keydown', event => {
  if (event.code !== 'Space' || event.target instanceof HTMLButtonElement) return;
  event.preventDefault();
  togglePlayback();
});

const params = new URLSearchParams(location.search);
const requestedTime = Number(params.get('t'));
if (params.has('t') && Number.isFinite(requestedTime)) {
  currentTime = THREE.MathUtils.clamp(requestedTime, 0, DURATION);
  renderFrame(currentTime);
  pause();
} else if (params.has('manual')) {
  renderFrame(0);
  pause();
} else {
  renderFrame(0);
  play();
}
