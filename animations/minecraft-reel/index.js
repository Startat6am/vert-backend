import * as THREE from 'three';

const DURATION = 14;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (a, b, v) => {
  const x = clamp01((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};

function canvasTexture(draw, width = 1024, height = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeCodeTexture() {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#050b1d';
    ctx.fillRect(0, 0, w, h);
    ctx.font = 'bold 25px monospace';
    const lines = [
      'const users = await database.query();',
      'for (const user of users) {',
      '  await verify(user.token);',
      '  console.log("approved");',
      '}',
      'function renderScene(time) {',
      '  camera.position.z = 8;',
      '  renderer.render(scene, camera);',
      '}',
      'git push origin main',
      'Building project...',
      '✓ deployment complete'
    ];
    for (let col = 0; col < 3; col++) {
      const x = 35 + col * 330;
      ctx.fillStyle = '#10294a';
      ctx.fillRect(x - 12, 18, 290, h - 36);
      lines.forEach((line, i) => {
        ctx.fillStyle = i % 4 === 0 ? '#6ca9df' : i % 3 === 0 ? '#e58c83' : '#9ab2ce';
        ctx.globalAlpha = .72;
        ctx.fillText(line, x, 62 + i * 48);
      });
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = i % 2 ? '#ef334c' : '#1b5b9a';
      ctx.globalAlpha = .75;
      ctx.beginPath();
      ctx.arc(100 + i * 103, 110 + (i % 3) * 260, 7 + (i % 3) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, 1024, 1024);
}

function box(THREE, parent, size, color, position, options = {}) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? .78,
    metalness: options.metalness ?? 0,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  parent.add(mesh);
  return mesh;
}

function makeCaption(THREE, scene, text, y = 3.15) {
  const texture = canvasTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.8)';
    ctx.shadowBlur = 18;
    ctx.font = 'bold 52px Arial';
    const words = text.split('|');
    words.forEach((line, i) => ctx.fillText(line, w / 2, h / 2 + (i - (words.length - 1) / 2) * 66));
  }, 1024, 220);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 1.55),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })
  );
  mesh.position.set(0, y, 2.2);
  scene.add(mesh);
  return mesh;
}

function makeAxolotl(THREE, scene) {
  const root = new THREE.Group();
  scene.add(root);
  const coral = 0xf15b49;
  const body = box(THREE, root, [4.8, 2.8, 1.45], coral, [0, 0, 0], { roughness: .92 });
  box(THREE, root, [4.86, .12, 1.5], 0xd94a3e, [0, -1.43, 0]);
  box(THREE, root, [.46, .58, .12], 0x271513, [-1.42, .48, .77]);
  box(THREE, root, [.46, .58, .12], 0x271513, [1.42, .48, .77]);
  box(THREE, root, [.48, .25, .12], 0x321512, [0, -.13, .79]);

  const legs = [];
  for (const x of [-1.65, 1.65]) {
    for (const z of [-.48, .48]) {
      const leg = box(THREE, root, [.48, 1.55, .48], 0xd94b3f, [x, -2.08, z]);
      legs.push(leg);
    }
  }
  const fins = [];
  for (const side of [-1, 1]) {
    const fin = box(THREE, root, [.55, 1.05, .55], 0xf07860, [side * 2.55, -.05, 0], { rotation: [0, 0, side * -.18] });
    fins.push(fin);
  }
  box(THREE, root, [.16, .38, .12], 0x9bd6ed, [1.9, 1.12, .75]);
  return { root, body, legs, fins };
}

function makeVillager(THREE, scene) {
  const root = new THREE.Group();
  scene.add(root);
  const skin = 0xd98a58;
  const darkSkin = 0x9c5738;

  const torso = box(THREE, root, [3.65, 3.55, 1.55], 0xf0d4cb, [0, -2.1, 0]);
  const neck = box(THREE, root, [.95, .85, .85], skin, [0, -.05, 0]);
  const head = new THREE.Group();
  root.add(head);
  box(THREE, head, [3.2, 3.1, 2.05], skin, [0, 1.45, 0]);
  box(THREE, head, [3.28, .85, 2.12], 0xc8794c, [0, .05, .05]);
  box(THREE, head, [3.28, .36, 2.08], darkSkin, [0, -.47, .02]);

  // Square eyes, eyelids, eyebrows and nose.
  for (const x of [-.83, .83]) {
    box(THREE, head, [.72, .72, .12], 0xf2e7df, [x, 1.7, 1.06]);
    box(THREE, head, [.38, .48, .1], 0x24364c, [x, 1.68, 1.15]);
    box(THREE, head, [.9, .18, .18], 0x60301f, [x, 2.18, 1.05]);
  }
  box(THREE, head, [.52, .95, .65], 0xe18e5b, [0, 1.25, 1.22]);
  box(THREE, head, [1.35, .18, .12], 0x572c22, [0, .45, 1.1]);

  // Hair blocks and sideburns.
  box(THREE, head, [3.3, .52, 2.12], 0x57301f, [0, 2.93, -.02]);
  box(THREE, head, [.42, 1.45, 1.95], 0x61351f, [-1.57, 1.55, -.02]);
  box(THREE, head, [.42, 1.45, 1.95], 0x61351f, [1.57, 1.55, -.02]);

  // Bright pink cap with a broad flat brim.
  const cap = new THREE.Group();
  head.add(cap);
  box(THREE, cap, [3.55, .62, 2.25], 0xe83f80, [0, 3.22, -.05]);
  box(THREE, cap, [3.85, .22, 1.8], 0xf04c91, [0, 2.98, .82]);
  box(THREE, cap, [2.1, .2, .5], 0xf66ca4, [0, 3.55, -.05]);

  // Arms pivot at the shoulders.
  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 2.02, -1.05, 0);
    root.add(pivot);
    box(THREE, pivot, [.82, 2.55, 1.05], 0xf0d4cb, [side * .08, -.95, 0]);
    box(THREE, pivot, [.84, .5, 1.08], 0xd18a65, [side * .08, -2.12, 0]);
    arms.push({ pivot, side });
  }
  return { root, head, cap, torso, neck, arms };
}

export default {
  id: 'minecraft-reel-reconstruction',
  title: 'Minecraft — blocky characters',
  duration: DURATION,
  order: 20,
  script: [
    { title: 'Сцена 1', text: 'Оранжевый блочный персонаж появляется на фоне тёмного экрана с кодом. Камера медленно приближается.' },
    { title: 'Переход', text: 'Короткий затемнённый переход и смена крупности кадра.' },
    { title: 'Сцена 2', text: 'Персонаж в розовой кепке выходит на передний план. Голова слегка поворачивается, руки покачиваются.' }
  ],
  create({ THREE, container }) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030817);
    scene.fog = new THREE.FogExp2(0x030817, .035);

    const camera = new THREE.PerspectiveCamera(38, 9 / 16, .1, 100);
    camera.position.set(0, .15, 12.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
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

    const codeTexture = makeCodeTexture();
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(19, 14),
      new THREE.MeshBasicMaterial({ map: codeTexture, transparent: false })
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
      box(THREE, scene, [2.15, .16, 1.2], i % 2 ? 0x18235a : 0x22204a, [-6.8 + i * 1.95, -3.55, 1.4]);
    }

    const axolotl = makeAxolotl(THREE, scene);
    axolotl.root.position.set(0, -.05, .1);
    const villager = makeVillager(THREE, scene);
    villager.root.position.set(0, -1.05, .15);
    villager.root.visible = false;

    const captionOne = makeCaption(THREE, scene, 'Только мы. И девятьсот|пользователей.', 3.15);
    const captionTwo = makeCaption(THREE, scene, 'Почему настоящая называется|«old»?!', 3.05);
    captionTwo.visible = false;

    const vignette = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshBasicMaterial({ color: 0x02040d, transparent: true, opacity: .18, depthWrite: false })
    );
    vignette.position.z = 4.5;
    scene.add(vignette);

    const resize = (width, height) => {
      const w = Math.max(1, width);
      const h = Math.max(1, height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const update = (time) => {
      const t = Math.max(0, Math.min(DURATION, time));
      const transition = smooth(6.15, 7.05, t);
      const second = t >= 6.7;

      axolotl.root.visible = !second;
      villager.root.visible = second;
      captionOne.visible = t < 6.35;
      captionTwo.visible = t >= 6.7;

      const idle = Math.sin(t * 2.5);
      axolotl.root.position.y = -.05 + Math.sin(t * 2.2) * .08;
      axolotl.root.rotation.y = Math.sin(t * .65) * .09;
      axolotl.root.rotation.z = Math.sin(t * 1.7) * .018;
      axolotl.legs.forEach((leg, i) => {
        leg.rotation.z = Math.sin(t * 3.2 + i * Math.PI / 2) * .07;
      });
      axolotl.fins.forEach((fin, i) => {
        fin.rotation.z = (i === 0 ? -1 : 1) * (.18 + Math.sin(t * 3 + i) * .08);
      });

      villager.head.rotation.y = Math.sin(t * 1.05) * .1;
      villager.head.rotation.x = Math.sin(t * 1.7) * .025;
      villager.arms.forEach(({ pivot, side }) => {
        pivot.rotation.z = side * (.08 + Math.sin(t * 2.4 + side) * .045);
      });
      villager.root.position.y = -1.05 + Math.sin(t * 2.1) * .045;

      const firstZoom = smooth(1.2, 5.7, t);
      const secondZoom = smooth(7.1, 10.8, t);
      camera.position.z = 12.5 - firstZoom * 2.0 - secondZoom * 2.35;
      camera.position.x = Math.sin(t * .42) * .22;
      camera.position.y = .15 + (second ? .35 : 0) + Math.sin(t * .8) * .04;
      camera.lookAt(0, second ? .45 : -.25, 0);

      const fade = smooth(6.25, 6.95, t);
      const firstScale = 1 + firstZoom * .04;
      axolotl.root.scale.setScalar(firstScale);
      villager.root.scale.setScalar(.92 + secondZoom * .12);
      captionOne.material.opacity = 1 - fade;
      captionTwo.material.opacity = smooth(6.65, 7.1, t);
      wall.position.x = Math.sin(t * .13) * .16;

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
