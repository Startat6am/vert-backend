import { gsap } from 'gsap';

export function create({ THREE, container }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05070c');
  scene.fog = new THREE.FogExp2('#05070c', 0.018);

  const camera = new THREE.PerspectiveCamera(38, 9 / 16, 0.1, 100);
  camera.position.set(0, 0, 15);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x91a8bf, 1.15));
  const cyanLight = new THREE.PointLight(0x4bbdce, 22, 32);
  cyanLight.position.set(4, 3, 5);
  scene.add(cyanLight);
  const warmLight = new THREE.PointLight(0xe49a70, 18, 30);
  warmLight.position.set(-4, -2, 3);
  scene.add(warmLight);

  const root = new THREE.Group();
  scene.add(root);

  const bgMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      float glow(vec2 p, vec2 c, float r){ return exp(-dot(p-c,p-c)/r); }
      void main(){
        float a=glow(vUv,vec2(.22,.72),.16);
        float b=glow(vUv,vec2(.82,.25),.18);
        float c=glow(vUv,vec2(.5,.5),.38);
        float wave=sin(vUv.y*18.0+uTime*.2+vUv.x*7.0)*.012;
        vec3 col=vec3(.012,.018,.032)+vec3(.035,.13,.18)*(a*.48+b*.35+c*.12+wave);
        col+=vec3(.12,.045,.025)*glow(vUv,vec2(.25,.18),.1);
        gl_FragColor=vec4(col,1.0);
      }`
  });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(40, 70), bgMaterial);
  bg.position.z = -28;
  root.add(bg);

  const starCount = 520;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - .5) * 18;
    starPositions[i * 3 + 1] = (Math.random() - .5) * 30;
    starPositions[i * 3 + 2] = -18 + Math.random() * 24;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0x9bb9ca, size: .025, transparent: true, opacity: .62 }));
  root.add(stars);

  const makeText = (text, width, height, fontSize, color = '#f2f5f7') => {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `500 ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(105,190,210,.24)';
    ctx.shadowBlur = 18;
    ctx.fillText(text, 700, 150, 1320);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.userData.dispose = () => { texture.dispose(); material.dispose(); mesh.geometry.dispose(); };
    return mesh;
  };

  const addText = (group, text, y, color = '#f2f5f7', width = 8.4, height = .68, size = 92) => {
    const mesh = makeText(text, width, height, size, color);
    mesh.position.y = y;
    group.add(mesh);
    return mesh;
  };

  const makeOrb = (radius, color, emissive = color) => new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 4),
    new THREE.MeshPhysicalMaterial({ color, emissive, emissiveIntensity: .65, metalness: .32, roughness: .22, clearcoat: 1 })
  );

  const intro = new THREE.Group();
  root.add(intro);
  const introTitle = addText(intro, 'Этот ИИ ничего не понимает.', 1.15, '#f3f5f6', 9.0, .9, 82);
  const introSub = addText(intro, 'По крайней мере, не как ты.', .12, '#e3a47e', 8.5, .72, 76);
  const seed = makeOrb(.22, '#f0ae82', '#8d462b');
  seed.position.set(0, -1.45, .2);
  seed.scale.setScalar(.001);
  intro.add(seed);
  const seedHalo = new THREE.Mesh(new THREE.TorusGeometry(.42, .012, 8, 96), new THREE.MeshBasicMaterial({ color: '#e9a77f', transparent: true, opacity: .0 }));
  seedHalo.position.copy(seed.position);
  intro.add(seedHalo);

  const absence = new THREE.Group();
  root.add(absence);
  const absenceTitle = addText(absence, 'Он не видит твоими глазами.', 1.8, '#e7edf0', 8.9, .72, 76);
  const absenceLines = [
    addText(absence, 'Не чувствует.', .55, '#78c6d0', 7.4, .58, 80),
    addText(absence, 'Не проживает воспоминания.', -.55, '#d9a17e', 8.8, .58, 70)
  ];
  const abstractEye = new THREE.Group();
  absence.add(abstractEye);
  const eyeRing = new THREE.Mesh(new THREE.TorusGeometry(.72, .018, 8, 100), new THREE.MeshBasicMaterial({ color: '#70c4cf', transparent: true, opacity: .65 }));
  eyeRing.position.set(0, -2.0, 0);
  abstractEye.add(eyeRing);
  const eyeCore = new THREE.Mesh(new THREE.SphereGeometry(.22, 32, 32), new THREE.MeshBasicMaterial({ color: '#e8a27a' }));
  eyeCore.position.copy(eyeRing.position);
  abstractEye.add(eyeCore);
  for (let i = 0; i < 3; i++) {
    const slash = new THREE.Mesh(new THREE.BoxGeometry(1.9 - i * .25, .018, .02), new THREE.MeshBasicMaterial({ color: '#83bdc8', transparent: true, opacity: .38 }));
    slash.position.set(0, -2 + (i - 1) * .23, .1);
    slash.rotation.z = (i - 1) * .12;
    abstractEye.add(slash);
  }

  const network = new THREE.Group();
  root.add(network);
  const nodePositions = [];
  const nodeMeshes = [];
  const networkLines = [];
  for (let i = 0; i < 54; i++) {
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * Math.PI * 2;
    const radius = 1.0 + Math.random() * 2.25;
    const p = new THREE.Vector3(
      Math.sin(theta) * Math.cos(phi) * radius,
      Math.cos(theta) * radius * 1.15,
      Math.sin(theta) * Math.sin(phi) * radius * .55
    );
    nodePositions.push(p);
    const node = new THREE.Mesh(new THREE.SphereGeometry(.035 + Math.random() * .045, 10, 10), new THREE.MeshBasicMaterial({ color: i % 5 === 0 ? '#e7a27c' : '#70c8d2', transparent: true, opacity: .0 }));
    node.position.copy(p);
    network.add(node);
    nodeMeshes.push(node);
  }
  for (let i = 0; i < nodePositions.length; i++) {
    const nearest = nodePositions
      .map((p, j) => ({ j, d: p.distanceTo(nodePositions[i]) }))
      .filter((item) => item.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
    nearest.forEach(({ j }) => {
      if (j <= i) return;
      const geometry = new THREE.BufferGeometry().setFromPoints([nodePositions[i], nodePositions[j]]);
      const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#5baeba', transparent: true, opacity: 0 }));
      network.add(line);
      networkLines.push(line);
    });
  }
  const networkCore = makeOrb(.42, '#5cabb7', '#276b78');
  network.add(networkCore);
  const networkTitle = addText(network, 'Находит закономерности', -3.45, '#b9dce0', 8.4, .65, 74);

  const prediction = new THREE.Group();
  root.add(prediction);
  const prompt = addText(prediction, '«Однажды человек…»', 2.0, '#edf2f4', 8.6, .8, 86);
  const promptUnderline = new THREE.Mesh(new THREE.BoxGeometry(5.4, .018, .02), new THREE.MeshBasicMaterial({ color: '#d99a75', transparent: true, opacity: .0 }));
  promptUnderline.position.y = 1.42;
  prediction.add(promptUnderline);
  const options = ['изменил', 'увидел', 'создал', 'почувствовал', 'спросил'];
  const optionMeshes = [];
  const optionLines = [];
  options.forEach((word, i) => {
    const angle = (i - 2) * .34;
    const end = new THREE.Vector3(Math.sin(angle) * (2.6 + Math.abs(i - 2) * .12), .15 - Math.abs(i - 2) * .18, -1.0 - Math.abs(i - 2) * .2);
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 1.05, 0), new THREE.Vector3(end.x * .48, .75, -.4), end);
    const line = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, .012, 5, false), new THREE.MeshBasicMaterial({ color: i === 2 ? '#e7a17b' : '#5daeba', transparent: true, opacity: 0 }));
    prediction.add(line);
    optionLines.push(line);
    const label = addText(prediction, word, end.y - .55, i === 2 ? '#f0bd9d' : '#9bcbd1', 2.8, .48, 70);
    label.position.x = end.x;
    label.material.opacity = 0;
    optionMeshes.push(label);
  });
  const chosen = makeOrb(.12, '#f1b38c', '#a95834');
  chosen.position.set(0, .95, .1);
  chosen.scale.setScalar(.001);
  prediction.add(chosen);

  const worlds = new THREE.Group();
  root.add(worlds);
  const worldLabels = ['ТЕКСТ', 'КОД', 'ОБРАЗЫ', 'ИДЕИ'];
  const worldObjects = [];
  worldLabels.forEach((label, i) => {
    const angle = i / worldLabels.length * Math.PI * 2;
    const x = Math.cos(angle) * 2.05;
    const y = Math.sin(angle) * 2.35;
    const color = i % 2 ? '#73c5cf' : '#e3a17b';
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(.52, 1), new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: .24, metalness: .3, roughness: .3, wireframe: i === 1 }));
    orb.position.set(x, y, -1.1);
    worlds.add(orb);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.78, .012, 6, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .48 }));
    ring.position.copy(orb.position);
    ring.rotation.set(.7, .4, angle);
    worlds.add(ring);
    const text = addText(worlds, label, y - .95, '#d6e5e8', 2.7, .4, 58);
    text.position.x = x;
    worldObjects.push({ orb, ring, text });
  });
  const worldsTitle = addText(worlds, 'Из прогноза — в инструмент', -3.75, '#c1dfe2', 8.6, .65, 72);

  const human = new THREE.Group();
  root.add(human);
  const humanGlow = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), new THREE.MeshBasicMaterial({ color: '#3b8794', transparent: true, opacity: .0, side: THREE.BackSide }));
  humanGlow.scale.set(1.25, 1.45, .7);
  human.add(humanGlow);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.66, 40, 32), new THREE.MeshPhysicalMaterial({ color: '#8abac0', emissive: '#1c5964', emissiveIntensity: .28, metalness: .2, roughness: .32, transparent: true, opacity: 0 }));
  head.position.y = 1.0;
  human.add(head);
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), new THREE.MeshPhysicalMaterial({ color: '#477d89', emissive: '#163c48', emissiveIntensity: .35, metalness: .35, roughness: .32, transparent: true, opacity: 0 }));
  shoulders.scale.set(1.22, .76, .48);
  shoulders.position.y = -.15;
  human.add(shoulders);
  const humanRing = new THREE.Mesh(new THREE.TorusGeometry(2.1, .012, 8, 120), new THREE.MeshBasicMaterial({ color: '#dba07e', transparent: true, opacity: 0 }));
  humanRing.rotation.x = Math.PI * .22;
  human.add(humanRing);
  const humanTitle = addText(human, 'В него вложено многое от нас.', -2.0, '#e5b18e', 9.0, .72, 72);
  humanTitle.material.opacity = 0;
  const humanSub = addText(human, 'Язык. Истории. Знания.', -2.85, '#b8dce0', 8.0, .58, 68);
  humanSub.material.opacity = 0;

  const finale = new THREE.Group();
  root.add(finale);
  const finalQuestion = addText(finale, 'Что именно делает нас людьми?', 2.05, '#f1f4f5', 9.0, .9, 72);
  finalQuestion.material.opacity = 0;
  const finalOrb = makeOrb(.2, '#e8a47c', '#a95834');
  finalOrb.scale.setScalar(.001);
  finale.add(finalOrb);
  const finalHalo = new THREE.Mesh(new THREE.TorusGeometry(.42, .012, 8, 96), new THREE.MeshBasicMaterial({ color: '#e7a47c', transparent: true, opacity: 0 }));
  finale.add(finalHalo);

  const timeline = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
  timeline.fromTo(intro.scale, { x: .84, y: .84, z: .84 }, { x: 1, y: 1, z: 1, duration: 1.4 }, 0);
  timeline.to(seed.scale, { x: 1, y: 1, z: 1, duration: .65, ease: 'back.out(2)' }, 1.65);
  timeline.to(seedHalo.material, { opacity: .65, duration: .7 }, 1.8);
  timeline.to(introTitle.material, { opacity: 0, duration: .35 }, 3.35);
  timeline.to(introSub.material, { opacity: 0, duration: .35 }, 3.35);
  timeline.to(intro.scale, { x: .001, y: .001, z: .001, duration: .55 }, 3.8);

  timeline.fromTo(absence.scale, { x: .001, y: .001, z: .001 }, { x: 1, y: 1, z: 1, duration: .6 }, 4.0);
  timeline.to(eyeRing.rotation, { z: Math.PI * 2, duration: 4 }, 4.2);
  timeline.to(eyeCore.scale, { x: .001, y: .001, z: .001, duration: .5 }, 7.8);
  timeline.to(absence.scale, { x: .001, y: .001, z: .001, duration: .5 }, 8.55);

  timeline.fromTo(network.scale, { x: .001, y: .001, z: .001 }, { x: 1, y: 1, z: 1, duration: .9, ease: 'back.out(1.2)' }, 9);
  nodeMeshes.forEach((node, i) => {
    timeline.to(node.material, { opacity: .78, duration: .4 }, 9.15 + (i % 18) * .045);
    timeline.fromTo(node.scale, { x: .01, y: .01, z: .01 }, { x: 1, y: 1, z: 1, duration: .4 }, 9.15 + (i % 18) * .045);
  });
  networkLines.forEach((line, i) => timeline.to(line.material, { opacity: .28, duration: .35 }, 10.0 + (i % 24) * .035));
  timeline.to(network.rotation, { y: .7, x: -.18, duration: 5.4 }, 10);
  timeline.to(networkCore.scale, { x: 1.3, y: 1.3, z: 1.3, duration: 1.2, yoyo: true, repeat: 1 }, 12.3);
  timeline.to(network.scale, { x: .001, y: .001, z: .001, duration: .55 }, 14.45);

  timeline.fromTo(prediction.scale, { x: .001, y: .001, z: .001 }, { x: 1, y: 1, z: 1, duration: .6 }, 15);
  timeline.to(promptUnderline.material, { opacity: .8, duration: .4 }, 15.5);
  optionLines.forEach((line, i) => timeline.to(line.material, { opacity: .45, duration: .35 }, 16.1 + i * .16));
  optionMeshes.forEach((label, i) => timeline.to(label.material, { opacity: 1, duration: .35 }, 17.0 + i * .13));
  timeline.to(chosen.scale, { x: 1, y: 1, z: 1, duration: .35 }, 19.2);
  timeline.to(chosen.position, { x: optionMeshes[2].position.x, y: optionMeshes[2].position.y + .2, z: .1, duration: .75 }, 19.4);
  optionLines.forEach((line, i) => timeline.to(line.material, { opacity: i === 2 ? .95 : .08, duration: .4 }, 20.0));
  timeline.to(prediction.scale, { x: .001, y: .001, z: .001, duration: .5 }, 20.5);

  timeline.fromTo(worlds.scale, { x: .001, y: .001, z: .001 }, { x: 1, y: 1, z: 1, duration: .8, ease: 'back.out(1.2)' }, 21);
  worldObjects.forEach(({ orb, ring }, i) => {
    timeline.fromTo(orb.scale, { x: .01, y: .01, z: .01 }, { x: 1, y: 1, z: 1, duration: .45 }, 21.2 + i * .3);
    timeline.to(ring.rotation, { z: ring.rotation.z + Math.PI * 1.2, duration: 4 }, 21.4 + i * .25);
  });
  timeline.to(worlds.rotation, { y: .35, z: .08, duration: 4.8 }, 22);
  timeline.to(worlds.scale, { x: .001, y: .001, z: .001, duration: .55 }, 27.45);

  timeline.fromTo(human.scale, { x: .001, y: .001, z: .001 }, { x: 1, y: 1, z: 1, duration: .8 }, 28);
  timeline.to(head.material, { opacity: .94, duration: 1 }, 28.3);
  timeline.to(shoulders.material, { opacity: .88, duration: 1 }, 28.5);
  timeline.to(humanGlow.material, { opacity: .12, duration: 1.2 }, 29);
  timeline.to(humanRing.material, { opacity: .55, duration: .8 }, 29.2);
  timeline.to(humanRing.rotation, { z: Math.PI * 1.1, duration: 4.2 }, 29.3);
  timeline.to(humanTitle.material, { opacity: 1, duration: .6 }, 30.1);
  timeline.to(humanSub.material, { opacity: 1, duration: .6 }, 31.2);
  timeline.to(human.scale, { x: .001, y: .001, z: .001, duration: .6 }, 34.45);

  timeline.fromTo(finale.scale, { x: .001, y: .001, z: .001 }, { x: 1, y: 1, z: 1, duration: .6 }, 35);
  timeline.to(finalQuestion.material, { opacity: 1, duration: .7 }, 35.2);
  timeline.to(finalOrb.scale, { x: 1, y: 1, z: 1, duration: .55, ease: 'back.out(2)' }, 36.0);
  timeline.to(finalHalo.material, { opacity: .65, duration: .5 }, 36.2);
  timeline.to(finalOrb.scale, { x: .18, y: .18, z: .18, duration: 1.1 }, 38.2);
  timeline.to(finalQuestion.material, { opacity: 0, duration: .35 }, 39.0);
  timeline.to(finalHalo.material, { opacity: .0, duration: .35 }, 39.25);

  timeline.to(stars.rotation, { y: .12, duration: 40 }, 0);

  let disposed = false;
  const resize = (width, height) => {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  return {
    update(time) {
      if (disposed) return;
      const t = Math.max(0, Math.min(40, time));
      timeline.time(t, false);
      bgMaterial.uniforms.uTime.value = t;
      networkCore.rotation.set(t * .12, t * .2, t * .08);
      seed.rotation.set(t * .3, t * .45, 0);
      finalOrb.rotation.set(t * .2, t * .3, 0);
      worldObjects.forEach(({ orb }, i) => { orb.rotation.y = t * (.18 + i * .025); });
      renderer.render(scene, camera);
    },
    resize,
    destroy() {
      if (disposed) return;
      disposed = true;
      timeline.kill();
      renderer.dispose();
      renderer.domElement.remove();
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
    }
  };
}