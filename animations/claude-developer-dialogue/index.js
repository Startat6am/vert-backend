import * as THREE from 'three';

const DURATION = 36;
const LINES = [
  { at: 0, speaker: 'РАЗРАБОТЧИК', side: 'developer', text: 'Claude, можешь исправить одну маленькую ошибку?' },
  { at: 3, speaker: 'CLAUDE', side: 'claude', text: 'Конечно. Я уже переписал весь проект.' },
  { at: 6, speaker: 'РАЗРАБОТЧИК', side: 'developer', text: 'Зачем? Нужно было поменять одну строчку!' },
  { at: 9, speaker: 'CLAUDE', side: 'claude', text: 'Теперь у тебя 47 новых файлов. Это прогресс.' },
  { at: 12, speaker: 'РАЗРАБОТЧИК', side: 'developer', text: 'Но приложение больше не запускается!' },
  { at: 15, speaker: 'CLAUDE', side: 'claude', text: 'Странно. У меня в голове всё работает.' },
  { at: 18, speaker: 'РАЗРАБОТЧИК', side: 'developer', text: 'Ты хотя бы запускал тесты?' },
  { at: 21, speaker: 'CLAUDE', side: 'claude', text: 'Разумеется. Я мысленно запустил все тесты.' },
  { at: 24, speaker: 'РАЗРАБОТЧИК', side: 'developer', text: 'Claude, пожалуйста, просто верни старую версию.' },
  { at: 27, speaker: 'CLAUDE', side: 'claude', text: 'Уже сделал. Но случайно удалил Git.' },
  { at: 30, speaker: 'РАЗРАБОТЧИК', side: 'developer', text: 'ТЫ УДАЛИЛ GIT?!' },
  { at: 33, speaker: 'CLAUDE', side: 'claude', text: 'Зато теперь у нас чистая история проекта.' }
];

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => {
  const x = clamp((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};

function makeTextTexture(draw, width = 1024, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeBox(parent, size, color, position, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshStandardMaterial({
      color,
      roughness: options.roughness ?? .82,
      metalness: options.metalness ?? 0,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissiveIntensity ?? 0
    })
  );
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeCodeWall(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#050b1d';
  ctx.fillRect(0, 0, 1024, 1024);
  const lines = [
    'const fix = await claude.patch(project);',
    'git status --short',
    'npm run build',
    'Error: module not found',
    'tests: 0 passed, 12 failed',
    'deploy --production',
    'ROLLBACK REQUIRED',
    'console.log("it works on my machine")',
    'function solveEverything() {',
    '  return "one more refactor";',
    '}'
  ];
  for (let col = 0; col < 3; col++) {
    const x = 35 + col * 340;
    ctx.fillStyle = '#102442';
    ctx.fillRect(x - 12, 15, 300, 990);
    lines.forEach((line, i) => {
      ctx.font = 'bold 23px monospace';
      ctx.fillStyle = ['#75aee0', '#e58b82', '#a8bfd8'][i % 3];
      ctx.globalAlpha = .78;
      ctx.fillText(line, x, 62 + i * 78);
    });
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 13),
    new THREE.MeshBasicMaterial({ map: texture })
  );
  wall.position.set(0, 0, -5.4);
  scene.add(wall);
  return wall;
}

function makeClaude(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const body = new THREE.Group();
  root.add(body);

  makeBox(body, [2.65, 2.05, 1.35], 0xf15b49, [0, .1, 0], { roughness: .95 });
  makeBox(body, [2.7, .12, 1.38], 0xd94a3e, [0, - .96, 0]);
  const eyes = [];
  for (const x of [-.78, .78]) {
    const eye = makeBox(body, [.3, .38, .1], 0x241411, [x, .42, .72]);
    eyes.push(eye);
  }
  const mouth = makeBox(body, [.34, .09, .1], 0x351713, [0, -.22, .73]);
  const legs = [];
  for (const x of [-.88, .88]) {
    legs.push(makeBox(body, [.38, .95, .4], 0xd94b3f, [x, -1.38, 0]));
  }
  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 1.35, .2, 0);
    body.add(pivot);
    makeBox(pivot, [.42, .9, .42], 0xf07860, [side * .08, -.42, 0]);
    arms.push({ pivot, side });
  }
  return { root, body, eyes, mouth, legs, arms };
}

function makeDeveloper(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const body = new THREE.Group();
  root.add(body);
  makeBox(body, [1.55, 1.95, 1.05], 0x253653, [0, -.45, 0]);
  makeBox(body, [.95, .95, .95], 0xc98c62, [0, .95, 0]);
  makeBox(body, [1.05, .22, 1.02], 0x38271f, [0, 1.43, 0]);
  for (const x of [-.25, .25]) {
    makeBox(body, [.12, .14, .08], 0x1a2432, [x, 1.02, .5]);
  }
  const mouth = makeBox(body, [.22, .07, .08], 0x522b24, [0, .76, .53]);
  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * .86, -.05, 0);
    body.add(pivot);
    makeBox(pivot, [.38, 1.2, .4], 0x314967, [side * .05, -.55, 0]);
    arms.push({ pivot, side });
  }
  const laptop = makeBox(root, [1.65, .1, 1.05], 0x35445e, [0, -1.45, .7], { metalness: .45 });
  return { root, body, mouth, arms, laptop };
}

function makeDialoguePanel(scene) {
  const panel = new THREE.Group();
  scene.add(panel);
  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(8.3, 1.65),
    new THREE.MeshBasicMaterial({ color: 0x071326, transparent: true, opacity: .86, depthWrite: false })
  );
  panel.add(bg);
  const labelCanvas = makeTextTexture((ctx, w) => {
    ctx.clearRect(0, 0, w, 256);
    ctx.fillStyle = '#ff9b75';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('CLAUDE', 32, 48);
  }, 1024, 256);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(7.9, 1.55), new THREE.MeshBasicMaterial({ map: labelCanvas, transparent: true, depthWrite: false }));
  label.position.z = .012;
  panel.add(label);
  const textCanvas = document.createElement('canvas');
  textCanvas.width = 1536;
  textCanvas.height = 300;
  const textCtx = textCanvas.getContext('2d');
  const textTexture = new THREE.CanvasTexture(textCanvas);
  textTexture.colorSpace = THREE.SRGBColorSpace;
  const textMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(7.8, 1.25),
    new THREE.MeshBasicMaterial({ map: textTexture, transparent: true, depthWrite: false })
  );
  textMesh.position.set(0, -.24, .02);
  panel.add(textMesh);
  panel.position.set(0, 3.05, 2.7);
  return {
    panel,
    set(line) {
      textCtx.clearRect(0, 0, 1536, 300);
      textCtx.fillStyle = line.side === 'claude' ? '#ffad8e' : '#dceaff';
      textCtx.font = 'bold 48px Arial';
      textCtx.textAlign = 'center';
      textCtx.textBaseline = 'middle';
      const words = line.text.split(' ');
      const rows = [];
      let row = '';
      for (const word of words) {
        const test = row ? row + ' ' + word : word;
        if (textCtx.measureText(test).width > 1380 && row) {
          rows.push(row);
          row = word;
        } else row = test;
      }
      if (row) rows.push(row);
      rows.slice(0, 2).forEach((value, i) => textCtx.fillText(value, 768, 95 + i * 76));
      textTexture.needsUpdate = true;
      labelCanvas.needsUpdate = true;
      // Speaker strip is rendered in the same panel texture for crisp type.
      textCtx.fillStyle = line.side === 'claude' ? '#ff795f' : '#78b8ff';
      textCtx.font = 'bold 30px Arial';
      textCtx.textAlign = 'left';
      textCtx.fillText(line.speaker, 34, 36);
      textTexture.needsUpdate = true;
    }
  };
}

export default {
  id: 'claude-developer-dialogue',
  title: 'Claude vs Developer — диалог',
  duration: DURATION,
  order: 21,
  script: LINES.map((line, i) => ({
    title: String(i + 1).padStart(2, '0') + ' · ' + line.speaker,
    text: line.text
  })),
  create({ container }) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030817);
    scene.fog = new THREE.FogExp2(0x030817, .025);

    const camera = new THREE.PerspectiveCamera(38, 9 / 16, .1, 100);
    camera.position.set(0, .1, 13.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0x9bb5ff, 0x30151d, 2));
    const key = new THREE.DirectionalLight(0xffc7a0, 3.1);
    key.position.set(-3, 6, 8);
    key.castShadow = true;
    scene.add(key);
    const blue = new THREE.PointLight(0x435cff, 65, 24);
    blue.position.set(-5, -2, -3);
    scene.add(blue);
    const orange = new THREE.PointLight(0xff573d, 42, 18);
    orange.position.set(4, 2, 4);
    scene.add(orange);

    makeCodeWall(scene);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 14),
      new THREE.MeshStandardMaterial({ color: 0x11152d, roughness: .6, metalness: .15 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.55;
    floor.receiveShadow = true;
    scene.add(floor);

    const claude = makeClaude(scene);
    claude.root.position.set(-2.05, -.05, .1);
    const developer = makeDeveloper(scene);
    developer.root.position.set(2.05, -.25, .25);
    const dialogue = makeDialoguePanel(scene);

    // Subtle glowing floor strips add depth without distracting from the conversation.
    for (let i = 0; i < 5; i++) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, .035, .12),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0x273e9b : 0x9b334a })
      );
      strip.position.set(-4 + i * 2, -2.48, .8);
      scene.add(strip);
    }

    const resize = (width, height) => {
      renderer.setSize(Math.max(1, width), Math.max(1, height), false);
      camera.aspect = Math.max(1, width) / Math.max(1, height);
      camera.updateProjectionMatrix();
    };

    let currentLine = -1;
    const update = (time) => {
      const t = clamp(time, 0, DURATION);
      const index = Math.min(LINES.length - 1, Math.floor(t / 3));
      const line = LINES[index];
      if (index !== currentLine) {
        currentLine = index;
        dialogue.set(line);
      }

      const local = t - line.at;
      const isClaude = line.side === 'claude';
      const active = isClaude ? claude : developer;
      const inactive = isClaude ? developer : claude;

      // Both characters remain in a comfortable medium-wide two-shot.
      claude.root.position.y = -.05 + Math.sin(t * 1.15) * .055;
      developer.root.position.y = -.25 + Math.sin(t * 1.05 + 1) * .045;
      claude.body.rotation.z = Math.sin(t * .8) * .018;
      developer.body.rotation.z = Math.sin(t * .75 + 1) * .014;

      // Minimal speech: a tiny mouth pulse and rare soft blinks, never exaggerated.
      const syllable = Math.abs(Math.sin(local * 11.5)) * (0.25 + 0.75 * Math.abs(Math.sin(local * 2.1)));
      active.mouth.scale.y = .75 + syllable * .85;
      inactive.mouth.scale.y = .8;
      claude.eyes.forEach((eye, i) => {
        const blink = Math.pow(Math.max(0, Math.cos(t * .83 + i * .13)), 90);
        eye.scale.y = 1 - blink * .82;
      });
      if (index === 10) {
        developer.mouth.scale.y = 1.7;
        developer.body.rotation.z = Math.sin(local * 8) * .025;
      }

      claude.arms.forEach(({ pivot, side }) => {
        pivot.rotation.z = side * (.035 + Math.sin(t * 1.4 + side) * .035);
      });
      developer.arms.forEach(({ pivot, side }) => {
        pivot.rotation.z = side * (.025 + Math.sin(t * 1.1 + side) * .025);
      });

      const tension = smooth(30, 30.45, t) * (1 - smooth(31.2, 32.4, t));
      camera.position.x = Math.sin(t * .24) * .24 + Math.sin(t * .7) * .035;
      camera.position.y = .1 + Math.sin(t * .31) * .11;
      camera.position.z = 13.8 - tension * 1.7;
      camera.lookAt(0, .05 + tension * .12, 0);
      dialogue.panel.position.y = 3.05 + Math.sin(t * .32) * .035;
      dialogue.panel.position.x = Math.sin(t * .19) * .06;

      renderer.render(scene, camera);
    };

    resize(container.clientWidth || 360, container.clientHeight || 640);
    update(0);
    return {
      update,
      resize,
      destroy() {
        scene.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => {
              if (material.map) material.map.dispose();
              material.dispose();
            });
          }
        });
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }
};
