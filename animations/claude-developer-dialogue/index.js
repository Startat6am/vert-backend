import * as THREE from 'three';

const DURATION = 48;
const LINE_DURATION = 4;
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

function makePixelGradientTexture() {
  // Low-resolution stepped palette creates an intentionally 8-bit dark-lilac gradient.
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  const palette = ['#100b20', '#17102b', '#211438', '#2b1944', '#351f50', '#24153d'];
  for (let y = 0; y < 96; y++) {
    for (let x = 0; x < 96; x++) {
      const dx = (x - 42) / 68;
      const dy = (y - 34) / 72;
      const glow = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
      const band = Math.min(5, Math.max(0, Math.floor((y / 96) * 4 + glow * 2)));
      ctx.fillStyle = palette[band];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
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

function makeCaption(camera) {
  // Camera-space HUD: occupies the bottom third of the viewport and stays razor sharp.
  const group = new THREE.Group();
  camera.add(group);

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  // Nearest-neighbour sampling keeps the pixel lettering hard-edged instead of soft.
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;

  const textMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.01, depthTest: false, depthWrite: false })
  );
  textMesh.position.z = .012;
  textMesh.renderOrder = 1001;
  group.add(textMesh);

  // Pixelify Sans includes Cyrillic glyphs; fallback remains monospace if offline.
  let lastLine = null;
  const loadPixelFont = () => {
    document.fonts?.load('700 76px "Pixelify Sans"').then(() => {
      if (lastLine) drawLine(lastLine);
    }).catch(() => {});
  };
  let fontLink = document.querySelector('link[data-dialogue-pixel-font]');
  if (!fontLink) {
    fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@600;700&display=swap';
    fontLink.dataset.dialoguePixelFont = 'true';
    fontLink.addEventListener('load', loadPixelFont, { once: true });
    document.head.appendChild(fontLink);
  } else if (fontLink.sheet) {
    loadPixelFont();
  } else {
    fontLink.addEventListener('load', loadPixelFont, { once: true });
  }

  const layout = (aspect, fov) => {
    const distance = 5;
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * distance;
    const visibleWidth = visibleHeight * aspect;
    const panelHeight = visibleHeight / 3;
    const panelWidth = visibleWidth * .96;
    group.position.set(0, -visibleHeight / 3, -distance);
    textMesh.geometry.dispose();
    textMesh.geometry = new THREE.PlaneGeometry(panelWidth * .985, panelHeight * .96);
  };

  const drawLine = (line) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pixel-style typeface with a robust local monospace fallback.
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = line.side === 'claude' ? '#ff9b75' : '#8dcaff';
      ctx.font = '700 64px "Pixelify Sans", "Press Start 2P", monospace';
      ctx.fillText(line.speaker, 1024, 116);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 76px "Pixelify Sans", "Press Start 2P", monospace';
      const words = line.text.split(' ');
      const rows = [];
      let row = '';
      const maxWidth = 1810;
      for (const word of words) {
        const next = row ? row + ' ' + word : word;
        if (ctx.measureText(next).width > maxWidth && row) {
          rows.push(row);
          row = word;
        } else row = next;
      }
      if (row) rows.push(row);
      const visibleRows = rows.slice(0, 3);
      const lineHeight = 154;
      const firstY = 390 - ((visibleRows.length - 1) * lineHeight) / 2;
      visibleRows.forEach((value, i) => ctx.fillText(value, 1024, firstY + i * lineHeight));
      texture.needsUpdate = true;
  };

  return {
    group,
    layout,
    set(line) {
      lastLine = line;
      drawLine(line);
    },
    dispose() {
      texture.dispose();
      textMesh.geometry.dispose();
      textMesh.material.dispose();
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
    // Add the camera to the scene so its camera-space caption HUD is rendered.
    scene.add(camera);

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

    const developerBackdropTexture = makePixelGradientTexture();
    const developerBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(19, 14),
      new THREE.MeshBasicMaterial({ map: developerBackdropTexture })
    );
    developerBackdrop.position.set(0, 0, -5.15);
    developerBackdrop.visible = true;
    scene.add(developerBackdrop);

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
    const caption = makeCaption(camera);

    const resize = (width, height) => {
      const w = Math.max(1, width);
      const h = Math.max(1, height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      caption.layout(camera.aspect, camera.fov);
    };

    let currentLine = -1;
    const update = (time) => {
      const t = clamp(time, 0, DURATION);
      const index = Math.min(LINES.length - 1, Math.floor(t / LINE_DURATION));
      const line = LINES[index];
      const local = t - index * LINE_DURATION;

      if (index !== currentLine) {
        currentLine = index;
        caption.set(line);
      }

      const isClaude = line.side === 'claude';
      // Hard single-character cut: the non-speaking character is never rendered in this shot.
      claude.root.visible = isClaude;
      developer.root.visible = !isClaude;
      // Claude keeps the code-wall backdrop; developer gets the stepped dark-lilac 8-bit gradient.
      wall.visible = isClaude;
      developerBackdrop.visible = !isClaude;
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
      // Gentle floating drift plus a distinct 15-degree three-quarter angle per speaker.
      const angle = THREE.MathUtils.degToRad(isClaude ? 15 : -15);
      const distance = targetZ;
      const floatX = Math.sin(t * .2) * .10;
      const floatY = .25 + Math.sin(t * .27) * .065;
      const targetY = isClaude ? -.15 : .2;
      camera.position.x = Math.sin(angle) * distance + floatX;
      camera.position.y = floatY;
      camera.position.z = Math.cos(angle) * distance;
      camera.lookAt(Math.sin(t * .16) * .045, targetY + Math.sin(t * .23) * .025, 0);

      // Caption remains fixed to the camera; no world-space drift or depth blur.
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
        caption.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }
};
