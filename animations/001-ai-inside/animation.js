import { gsap } from 'gsap';

export function create({ THREE, container }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05070d');
  scene.fog = new THREE.FogExp2('#05070d', 0.025);
  const camera = new THREE.PerspectiveCamera(38, 9 / 16, 0.1, 100);
  camera.position.set(0, 0, 14);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x8297b0, 1.2));
  const amber = new THREE.PointLight(0xff9864, 24, 35);
  amber.position.set(-4, 4, 6);
  scene.add(amber);
  const cyan = new THREE.PointLight(0x4cc7d8, 20, 40);
  cyan.position.set(5, -3, -5);
  scene.add(cyan);

  const world = new THREE.Group();
  scene.add(world);
  const shaderBackground = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform float uTime;varying vec2 vUv;float glow(vec2 p,vec2 c,float r){return exp(-dot(p-c,p-c)/r);}void main(){float a=glow(vUv,vec2(.2,.72),.12);float b=glow(vUv,vec2(.82,.28),.16);float c=glow(vUv,vec2(.52,.5),.3);float w=sin(vUv.y*15.+uTime*.22+vUv.x*5.)*.018;vec3 col=vec3(.012,.018,.034)+vec3(.08,.17,.25)*(a*.4+b*.3+c*.12+w);col+=vec3(.12,.045,.025)*glow(vUv,vec2(.3,.18),.08);gl_FragColor=vec4(col,1.);}`
  });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(38, 64), shaderBackground);
  backdrop.position.z = -32;
  world.add(backdrop);

  const starPositions = new Float32Array(700 * 3);
  for (let i = 0; i < 700; i++) {
    starPositions[i * 3] = (Math.random() - .5) * 24;
    starPositions[i * 3 + 1] = (Math.random() - .5) * 40;
    starPositions[i * 3 + 2] = -26 + Math.random() * 32;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0x91adc5, size: .025, transparent: true, opacity: .58 }));
  world.add(stars);

  const makeText = (text, width, height, size, color = '#f4f5f8') => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 260;
    const ctx = canvas.getContext('2d');
    ctx.font = `500 ${size}px Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(120,190,220,.18)'; ctx.shadowBlur = 10;
    ctx.fillText(text, 600, 130, 1100);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.userData.dispose = () => { texture.dispose(); material.dispose(); mesh.geometry.dispose(); };
    return mesh;
  };
  const addText = (group, text, width, height, size, color) => {
    const mesh = makeText(text, width, height, size, color);
    group.add(mesh);
    return mesh;
  };

  const hook = new THREE.Group(); world.add(hook);
  const hookTitle = addText(hook, 'Ты задаёшь вопрос.', 7.2, .9, 110);
  hookTitle.position.y = .62;
  const hookSub = addText(hook, 'Что происходит дальше?', 8.1, .9, 92, '#e6a77c');
  hookSub.position.y = -.58;
  const seed = new THREE.Mesh(new THREE.IcosahedronGeometry(.24, 3), new THREE.MeshPhysicalMaterial({ color: '#e9a477', emissive: '#71351e', emissiveIntensity: .8, metalness: .35, roughness: .2, clearcoat: 1 }));
  seed.scale.setScalar(.001); hook.add(seed);
  const sparks = [];
  for (let i = 0; i < 90; i++) {
    const spark = new THREE.Mesh(new THREE.SphereGeometry(.018 + Math.random() * .025, 8, 8), new THREE.MeshBasicMaterial({ color: i % 3 ? '#70c9d6' : '#f2b184' }));
    spark.position.set((Math.random() - .5) * 7, (Math.random() - .5) * 4, (Math.random() - .5) * 2);
    hook.add(spark); sparks.push(spark);
  }

  const tokens = new THREE.Group(); world.add(tokens);
  const phrase = addText(tokens, 'Завтра утром будет солнце.', 8.2, 1, 86);
  phrase.position.y = 1.3;
  const tokenLabels = ['Зав', 'тра', 'ут', 'ром', 'бу', 'дет', 'солн', 'це'];
  const tokenGroups = [];
  tokenLabels.forEach((word, i) => {
    const group = new THREE.Group();
    const width = [.78, .72, .54, .82, .54, .75, .94, .54][i];
    const material = new THREE.MeshPhysicalMaterial({ color: i % 2 ? '#1a5261' : '#653e32', metalness: .42, roughness: .28, clearcoat: .8 });
    const block = new THREE.Mesh(new THREE.BoxGeometry(width, .48, .14), material);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(block.geometry), new THREE.LineBasicMaterial({ color: i % 2 ? '#74c8d1' : '#e7a276', transparent: true, opacity: .7 }));
    const label = addText(group, word, width * .9, .31, 104, '#f5e9df');
    label.position.z = .1;
    group.add(block, edges);
    group.position.set((i - 3.5) * .93, Math.sin(i * 1.8) * .3, -(i % 3) * .25);
    group.rotation.z = i % 2 ? -.1 : .07;
    tokens.add(group); tokenGroups.push(group);
  });
  const dust = [];
  for (let i = 0; i < 60; i++) {
    const particle = new THREE.Mesh(new THREE.TetrahedronGeometry(.025 + Math.random() * .03), new THREE.MeshBasicMaterial({ color: i % 2 ? '#71c7d4' : '#d99870' }));
    particle.position.set((Math.random() - .5) * 8, (Math.random() - .5) * 3, -1 - Math.random() * 3);
    tokens.add(particle); dust.push(particle);
  }

  const context = new THREE.Group(); world.add(context);
  const coreMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform float uTime;varying vec3 vN;varying vec3 vP;void main(){float f=pow(1.-abs(dot(normalize(vN),vec3(0.,0.,1.))),2.);float b=.5+.5*sin(vP.y*17.+vP.x*9.+uTime*.8);vec3 c=vec3(.48,.79,.81)*(.16+f*.8+b*.08);gl_FragColor=vec4(c,.94);}`,
    transparent: true, depthWrite: false
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.72, 5), coreMaterial);
  context.add(core);
  const rings = [];
  for (let i = 0; i < 9; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25 + i * .3, .009 + (i % 3) * .003, 5, 160), new THREE.MeshBasicMaterial({ color: i % 2 ? '#4ba8b7' : '#d18b67', transparent: true, opacity: .35 }));
    ring.rotation.set(.25 + i * .16, i * .13, i * .2);
    ring.position.set(Math.sin(i * 2) * .2, Math.cos(i * 1.3) * .2, -i * .38);
    context.add(ring); rings.push(ring);
  }
  const filaments = [];
  for (let i = 0; i < 30; i++) {
    const points = [];
    const phase = i / 30 * Math.PI * 2;
    for (let j = 0; j <= 60; j++) {
      const t = j / 60, r = 1.1 + 1.35 * t;
      points.push(new THREE.Vector3(Math.cos(phase + t * 2.4) * r, Math.sin(phase + t * 2.4) * r * .72, -.4 - t * 6));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 80, .009, 5, false);
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSeed: { value: i * .7 }, uColor: { value: new THREE.Color(i % 4 ? '#63bac7' : '#e1a077') } },
      vertexShader: `varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform float uTime;uniform float uSeed;uniform vec3 uColor;varying vec3 vPos;void main(){float p=pow(max(0.,sin(vPos.z*2.5-uTime*2.+uSeed)),12.);gl_FragColor=vec4(uColor*(.25+p),.5+p*.25);}`,
      transparent: true, depthWrite: false
    });
    const line = new THREE.Mesh(geometry, material);
    context.add(line); filaments.push(line);
  }
  const contextTitle = addText(context, 'Контекст меняет значение', 7.5, .65, 70, '#cce4e5');
  contextTitle.position.y = -3.1;

  const choices = new THREE.Group(); world.add(choices);
  const choiceCore = new THREE.Mesh(new THREE.SphereGeometry(.2, 24, 24), new THREE.MeshBasicMaterial({ color: '#f0ad7f' }));
  choices.add(choiceCore);
  const branchData = [];
  ['пойдёт', 'будет', 'начнётся', 'изменится', 'останется'].forEach((word, i) => {
    const angle = -.78 + i * .39;
    const end = new THREE.Vector3(Math.sin(angle) * 3.1, Math.cos(angle) * 2.65, -2.2 - Math.abs(i - 2) * .2);
    const mid = end.clone().multiplyScalar(.54); mid.x += (i - 2) * .16;
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), mid, end);
    const material = new THREE.MeshBasicMaterial({ color: i === 2 ? '#e7a47c' : '#5b9eac', transparent: true, opacity: .42 });
    const line = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, .012, 5, false), material);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(.045, 12, 12), new THREE.MeshBasicMaterial({ color: i === 2 ? '#ffd1a7' : '#86cbd2' }));
    dot.position.copy(end); dot.scale.setScalar(.001);
    const label = addText(choices, word, 1.8, .46, 82, i === 2 ? '#ffe0c6' : '#a9c8cf');
    label.position.copy(end).add(new THREE.Vector3(0, .36, .05)); label.material.opacity = 0;
    choices.add(line, dot); branchData.push({ line, dot, label, end });
  });
  const selection = new THREE.Mesh(new THREE.SphereGeometry(.15, 20, 20), new THREE.MeshBasicMaterial({ color: '#f7c49d', transparent: true, opacity: .9 }));
  selection.scale.setScalar(.001); choices.add(selection);

  const ending = new THREE.Group(); world.add(ending);
  const answer = addText(ending, 'Завтра утром будет солнце.', 8.1, .95, 84);
  answer.position.y = .8;
  const conclusionA = addText(ending, 'Это не понимание.', 7.6, .76, 78, '#b7dadd');
  conclusionA.position.y = -.55; conclusionA.material.opacity = 0;
  const conclusionB = addText(ending, 'Это прогноз следующего токена.', 8.3, .85, 68, '#f1c09c');
  conclusionB.position.y = -1.5; conclusionB.material.opacity = 0;

  const timeline = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
  timeline.fromTo(hook.scale, { x: .84, y: .84, z: .84 }, { x: 1, y: 1, z: 1, duration: 1.5 }, 0);
  timeline.to(seed.scale, { x: 1, y: 1, z: 1, duration: .7, ease: 'back.out(2)' }, 2.4);
  timeline.to(hookTitle.material, { opacity: 0, duration: .35 }, 3.15);
  timeline.to(hookSub.material, { opacity: 0, duration: .35 }, 3.15);
  sparks.forEach((spark, i) => {
    const angle = i / sparks.length * Math.PI * 2, radius = .5 + (i % 8) * .12;
    timeline.to(spark.position, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, z: -2 - (i % 5) * .35, duration: 1.1 }, 3.05 + (i % 10) * .02);
    timeline.to(spark.scale, { x: .1, y: .1, z: .1, duration: .6 }, 3.2 + (i % 9) * .025);
  });
  timeline.fromTo(tokens.scale, { x: .001, y: .001, z: .001 }, { x: 1, y: 1, z: 1, duration: .75, ease: 'back.out(1.4)' }, 4);
  timeline.to(phrase.material, { opacity: 0, duration: .3 }, 6.6);
  tokenGroups.forEach((group, i) => {
    timeline.to(group.rotation, { x: 0, y: 0, duration: .6 }, 6.5 + i * .04);
    timeline.to(group.position, { x: (i - 3.5) * 1.02, y: Math.sin(i * 2.1) * .62, z: -.4 + (i % 3) * .18, duration: 1.2 }, 7.1 + i * .03);
  });
  dust.forEach((particle, i) => timeline.to(particle.position, { x: (i % 11 - 5) * .55, y: (i % 7 - 3) * .45, z: -3 - (i % 6), duration: 1.2 }, 8 + (i % 12) * .03));
  timeline.to(tokens.position, { z: -4, duration: 1.2 }, 9.5);
  timeline.fromTo(context.scale, { x: .001, y: .001, z: .001 }, { x: 1, y: 1, z: 1, duration: 1.2 }, 11);
  timeline.to(camera.position, { z: 8.4, x: .2, duration: 2.8 }, 11.4);
  timeline.to(context.rotation, { y: .16, x: -.1, duration: 7 }, 12);
  rings.forEach((ring, i) => timeline.to(ring.rotation, { z: ring.rotation.z + (i % 2 ? -.5 : .55), x: ring.rotation.x + .18, duration: 5.5 }, 12 + i * .07));
  timeline.to(camera.position, { z: 4.7, y: .15, x: -.35, duration: 4 }, 16);
  timeline.to(core.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 2, yoyo: true, repeat: 1 }, 16);
  timeline.to(contextTitle.material, { opacity: 0, duration: .4 }, 20.3);
  timeline.to(context.scale, { x: .65, y: .65, z: .65, duration: 1 }, 21);
  timeline.to(camera.position, { z: 13, y: 0, x: 0, duration: 1.1 }, 21);
  timeline.fromTo(choices.scale, { x: .001, y: .001, z: .001 }, { x: 1, y: 1, z: 1, duration: .7, ease: 'back.out(1.3)' }, 22);
  branchData.forEach((branch, i) => {
    timeline.to(branch.dot.scale, { x: 1, y: 1, z: 1, duration: .35 }, 22.4 + i * .12);
    timeline.to(branch.label.material, { opacity: 1, duration: .35 }, 22.5 + i * .12);
  });
  [0, 1, 3, 4].forEach((i) => timeline.to(branchData[i].line.material, { opacity: .12, duration: .5 }, 26.4));
  timeline.to(branchData[2].line.material, { opacity: .95, duration: .55 }, 26.4);
  timeline.to(selection.scale, { x: 1, y: 1, z: 1, duration: .4 }, 26.5);
  timeline.to(selection.position, { x: branchData[2].end.x, y: branchData[2].end.y, z: branchData[2].end.z, duration: .8 }, 26.5);
  timeline.to(choices.position, { z: -1.3, duration: 1.1 }, 29.5);
  timeline.fromTo(ending.scale, { x: .001, y: .001, z: .001 }, { x: 1, y: 1, z: 1, duration: .7 }, 31);
  timeline.to(conclusionA.material, { opacity: 1, duration: .6 }, 35.7);
  timeline.to(answer.material, { opacity: .35, duration: .6 }, 35.7);
  timeline.to(conclusionB.material, { opacity: 1, duration: .7 }, 36.5);
  timeline.to(camera.position, { z: 11.5, duration: 3 }, 32);
  timeline.to(stars.rotation, { y: .12, duration: 40 }, 0);

  const textMeshes = [hookTitle, hookSub, phrase, contextTitle, ...branchData.map((branch) => branch.label), answer, conclusionA, conclusionB];
  let disposed = false;
  const resize = (width, height) => {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  return {
    update(time) {
      if (disposed) return;
      timeline.time(Math.max(0, Math.min(40, time)), false);
      shaderBackground.uniforms.uTime.value = time;
      coreMaterial.uniforms.uTime.value = time;
      filaments.forEach((line) => { line.material.uniforms.uTime.value = time; });
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
      textMeshes.forEach((mesh) => mesh.userData.dispose?.());
    }
  };
}
