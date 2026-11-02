import * as THREE from 'three';

const DURATION = 36;
const LINE_DURATION = 3;
const LINES = [
  { speaker: 'РАЗРАБОТЧИК', side: 'developer', text: 'Claude, можешь исправить одну маленькую ошибку?' },
  { speaker: 'CLAUDE', side: 'claude', text: 'Конечно. Я уже переписал весь проект.' },
  { speaker: 'РАЗРАБОТЧИК', side: 'developer', text: 'Зачем? Нужно было поменять одну строчку!' },
  { speaker: 'CLAUDE', side: 'claude', text: 'Теперь у тебя 47 новых файлов. Это прогресс.' },
  { speaker: 'РАЗРАБОТЧИК', side: 'developer', text: 'Но приложение больше не запускается!' },
  { speaker: 'CLAUDE', side: 'claude', text: 'Странно. У меня в голове всё работает.' },
  { speaker: 'РАЗРАБОТЧИК', side: 'developer', text: 'Ты хотя бы запускал тесты?' },
  { speaker: 'CLAUDE', side: 'claude', text: 'Разумеется. Я мысленно запустил все тесты.' },
  { speaker: 'РАЗРАБОТЧИК', side: 'developer', text: 'Claude, пожалуйста, просто верни старую версию.' },
  { speaker: 'CLAUDE', side: 'claude', text: 'Уже сделал. Но случайно удалил Git.' },
  { speaker: 'РАЗРАБОТЧИК', side: 'developer', text: 'ТЫ УДАЛИЛ GIT?!' },
  { speaker: 'CLAUDE', side: 'claude', text: 'Зато теперь у нас чистая история проекта.' }
];

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => {
  const x = clamp((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};

function box(parent, size, color, position, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshStandardMaterial({
      color,
      roughness: options.roughness ?? .84,
      metalness: options.metalness ?? 0
    })
  );
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeCodeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#050b1d';
  ctx.fillRect(0, 0, 1024, 1024);
  const lines = [
    'const users = await database.query();',
    'git status --short',
    'npm run build',
    'Error: module not found',
    'tests: 0 passed, 12 failed',
    'deploy --production',
    'ROLLBACK REQUIRED',
    'console.log("it works on my machine")',
    'function renderScene(time) {',
    '  return "one more refactor";',
    '}'
  ];
  for (let col = 0; col < 3; col++) {
    const x = 32 + col * 340;
    ctx.fillStyle = '#102442';
    ctx.fillRect(x - 12, 12, 300, 1000);
    lines.forEach((line, i) => {
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = ['#75aee0', '#e58b82', '#a8bfd8'][i % 3];
      ctx.globalAlpha = .78;
      ctx.fillText(line, x, 60 + i * 82);
    });
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeClaude(scene) {
  // Claude deliberately keeps the chunky silhouette and proportions of the first animation.
  const root = new THREE.Group();
  scene.add(root);
  const body = box(root, [4.8, 2.8, 1.45], 0xf15b49, [0, 0, 0], { roughness: .92 });
  box(root, [4.86, .12, 1.5], 0xd94a3e, [0, -1.43, 0]);

  const eyes = [];
  for (const x of [-1.42, 1.42]) {
    eyes.push(box(root, [.46, .58, .12], 0x271513, [x, .48, .79]));
  }
  const mouth = box(root, [.48, .25, .12], 0x321512, [0, -.13, .8]);

  const legs = [];
  for (const x of [-1.65, 1.65]) {
    for (const z of [-.48, .48]) {
      legs.push(box(root, [.48, 1.55, .48], 0xd94b3f, [x, -2.08, z]));
    }
  }
  const fins = [];
  for (const side of [-1, 1]) {
    fins.push(box(root, [.55, 1.05, .55], 0xf07860, [side * 2.55, -.05, 0], {
      rotation: [0, 0, side * -.18]
    }));
  }
  box(root, [.16, .38, .12], 0x9bd6ed, [1.9, 1.12, .79]);
  return { root, body, eyes, mouth, legs, fins };
}

function makeDeveloper(scene) {
  // Reuse the blocky villager-like character language from the first animation.
  const root = new THREE.Group();
  scene.add(root);
  const skin = 0xd98a58;
  const head = new THREE.Group();
  root.add(head);

  box(root, [3.65, 3.55, 1.55], 0xf0d4cb, [0, -2.1, 0]);
  box(root, [.95, .85, .85], skin, [0, -.05, 0]);
  box(head, [3.2, 3.1, 2.05], skin, [0, 1.45, 0]);
  box(head, [3.28, .85, 2.12], 0xc8794c, [0, .05, .05]);
  box(head, [3.28, .36, 2.08], 0x9c5738, [0, -.47, .02]);

  const eyes = [];
  for (const x of [-.83, .83]) {
    box(head, [.72, .72, .12], 0xf2e7df, [x, 1.7, 1.06]);
    eyes.push(box(head, [.38, .48, .1], 0x24364c, [x, 1.68, 1.15]));
    box(head, [.9, .18, .18], 0x60301f, [x, 2.18, 1.05]);
  }
  box(head, [.52, .95, .65], 0xe18e5b, [0, 1.25, 1.22]);
  const mouth = box(head, [1.35, .18, .12], 0x572c22, [0, .45, 1.1]);

  // Hair blocks and recognizable bright pink cap from the reference frame.
  box(head, [3.3, .52, 2.12], 0x57301f, [0, 2.93, -.02]);
  box(head, [.42, 1.45, 1.95], 0x61351f, [-1.57, 1.55, -.02]);
  box(head, [.42, 1.45, 1.95], 0x61351f, [1.57, 1.55, -.02]);
  const cap = new THREE.Group();
  head.add(cap);
  box(cap, [3.55, .62, 2.25], 0xe83f80, [0, 3.22, -.05]);
  box(cap, [3.85, .22, 1.8], 0xf04c91, [0, 2.98, .82]);
  box(cap, [2.1, .2, .5], 0xf66ca4, [0, 3.55, -.05]);

  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 2.02, -1.05, 0);
    root.add(pivot);
    box(pivot, [.82, 2.55, 1.05], 0xf0d4cb, [side * .08, -.95, 0]);
    box(pivot, [.84, .5, 1.08], 0xd18a65, [side * .08, -2.12, 0]);
    arms.push({ pivot, side });
  }
  return { root, head, eyes, mouth, arms };
}

function makeCaption(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(8.1, 1.65),
    new THREE.MeshBasicMaterial({ color: 0x071326, transparent: true, opacity: .82, depthWrite: false })
  );
  group.add(bg);

  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const text = new THREE.Mesh(
    new THREE.PlaneGeometry(7.8, 1.48),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })
  );
  text.position.z = .02;
  group.add(text);

  return {
    group,
    set(line) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = line.side === 'claude' ? '#ff9b75' : '#8dcaff';
      ctx.font = 'bold 34px Arial';
      ctx.fillText(line.speaker, 768, 48);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 47px Arial';
      const words = line.text.split(' ');
      const rows = [];
      let row = '';
      for (const word of words) {
        const next = row ? row + ' ' + word : word;
        if (ctx.measureText(next).width > 1400 && row) {
          rows.push(row);
          row = word;
        } else row = next;
      }
      if (row) rows.push(row);
      rows.slice(0, 2).forEach((value, i) => ctx.fillText(value, 768, 142 + i * 70));
      texture.needsUpdate = true;
    }
  };
}

export default {
  id: 'claude-developer-dialogue',
  title: 'Claude vs Developer — поочерёдные планы',
  duration: DURATION,
  order: 21,
  script: LINES.map((line, i) => ({
    title: String(i + 1).padStart(2, '0') + ' · ' + line.speaker,
    text: line.text
  })),
  create({ container }) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030817);
    scene.fog = new THREE.FogExp2(0x030817, .032);

    const camera = new THREE.PerspectiveCamera(38, 9 / 16, .1, 100);
    camera.position.set(0, .25, 14.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0x91a9ff, 0x30151d, 2.1));
    const key = new THREE.DirectionalLight(0xffc29b, 3.2);
    key.position.set(-3, 6, 8);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.PointLight(0x4c55ff, 75, 25);
    rim.position.set(-5, -2, -4);
    scene.add(rim);
    const warm = new THREE.PointLight(0xff553f, 45, 18);
    warm.position.set(4, 2, 5);
    scene.add(warm);

    const wallTexture = makeCodeTexture();
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(19, 14),
      new THREE.MeshBasicMaterial({ map: wallTexture })
    );
    wall.position.set(0, 0, -5.5);
    scene.add(wall);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 12),
      new THREE.MeshStandardMaterial({ color: 0x10132c, roughness: .55, metalness: .15 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -3.65, -1.4);
    floor.receiveShadow = true;
    scene.add(floor);
    for (let i = 0; i < 8; i++) {
      box(scene, [2.15, .16, 1.2], i % 2 ? 0x18235a : 0x22204a, [-6.8 + i * 1.95, -3.55, 1.4]);
    }

    const claude = makeClaude(scene);
    const developer = makeDeveloper(scene);
    const caption = makeCaption(scene);

    const resize = (width, height) => {
      const w = Math.max(1, width);
      const h = Math.max(1, height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    let currentLine = -1;
    const update = (time) => {
      const t = clamp(time, 0, DURATION);
      const index = Math.min(LINES.length - 1, Math.floor(t / LINE_DURATION));
      const line = LINES[index];
      const local = t - line.at;

      if (index !== currentLine) {
        currentLine = index;
        caption.set(line);
      }

      const isClaude = line.side === 'claude';
      // Hard single-character cut: the non-speaking character is never rendered in this shot.
      claude.root.visible = isClaude;
      developer.root.visible = !isClaude;
      const active = isClaude ? claude : developer;

      if (isClaude) {
        claude.root.position.set(0, -.05 + Math.sin(t * 1.15) * .055, .1);
        claude.root.rotation.y = Math.sin(t * .55) * .055;
        claude.root.rotation.z = Math.sin(t * .9) * .012;
        claude.legs.forEach((leg, i) => {
          leg.rotation.z = Math.sin(t * 2.2 + i * Math.PI / 2) * .025;
        });
        claude.fins.forEach((fin, i) => {
          fin.rotation.z = (i === 0 ? -1 : 1) * (.18 + Math.sin(t * 2.1 + i) * .035);
        });
        claude.eyes.forEach((eye, i) => {
          const blink = Math.pow(Math.max(0, Math.cos(t * .82 + i * .11)), 70);
          eye.scale.y = 1 - blink * .82;
        });
      } else {
        developer.root.position.set(0, -1.05 + Math.sin(t * 1.05) * .04, .1);
        developer.head.rotation.y = Math.sin(t * .72) * .045;
        developer.head.rotation.x = Math.sin(t * .9) * .018;
        developer.eyes.forEach((eye, i) => {
          const blink = Math.pow(Math.max(0, Math.cos(t * .77 + i * .13)), 75);
          eye.scale.y = 1 - blink * .82;
        });
        developer.arms.forEach(({ pivot, side }) => {
          pivot.rotation.z = side * (.025 + Math.sin(t * 1.5 + side) * .018);
        });
      }

      // Restrained mouth movement only while this character is speaking.
      const speechPulse = Math.abs(Math.sin(local * 10.5)) * (0.18 + .22 * Math.abs(Math.sin(local * 1.7)));
      active.mouth.scale.y = 1 + speechPulse;
      active.mouth.scale.x = 1 + speechPulse * .08;

      // Floating camera, with a short, controlled push-in only on the shouted eleventh line.
      const tension = index === 10 ? smooth(.35, .75, local) * (1 - smooth(1.65, 2.4, local)) : 0;
      const targetZ = 14.8 - tension * 1.25;
      camera.position.x = Math.sin(t * .2) * .12;
      camera.position.y = .25 + Math.sin(t * .27) * .08;
      camera.position.z += (targetZ - camera.position.z) * .045;
      camera.lookAt(Math.sin(t * .16) * .06, isClaude ? -.15 : .2, 0);

      caption.group.position.set(0, 4.25 + Math.sin(t * .22) * .025, 2.6);
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
