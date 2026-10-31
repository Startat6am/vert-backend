const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a, b, p) => a + (b - a) * p;
const smooth = (a, b, t) => { const p = clamp((t - a) / (b - a)); return p * p * (3 - 2 * p); };
const expo = (t) => t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
const ease = (a, b, t) => mix(a, b, expo(clamp(t)));
const seeded = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function create({ THREE, container }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 16 / 9, 0.1, 180);
  camera.position.set(0, 0, 8);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  container.appendChild(renderer.domElement);

  // The animation is authored in landscape 16:9, then the canvas is rotated
  // 90 degrees so it occupies the portrait viewer edge-to-edge.
  const canvas = renderer.domElement;
  Object.assign(canvas.style, {
    position: 'absolute', width: '100%', height: '100%',
    left: '50%', top: '50%', transform: 'translate(-50%,-50%) rotate(90deg)',
    transformOrigin: 'center center', display: 'block'
  });
  container.style.overflow = 'hidden';

  scene.add(new THREE.HemisphereLight(0x9bb4dc, 0x17101e, 1.35));
  const key = new THREE.PointLight(0xff8a4c, 34, 42); key.position.set(-2, 4, 7); scene.add(key);
  const blue = new THREE.PointLight(0x587dff, 30, 46); blue.position.set(5, -2, -15); scene.add(blue);
  const pink = new THREE.PointLight(0xff62b4, 25, 40); pink.position.set(-5, 1, -29); scene.add(pink);

  const domeMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `varying vec3 vP; uniform float uTime;
      float blob(vec3 p,vec3 c,float r){return exp(-dot(p-c,p-c)/r);}
      void main(){
        vec3 n=normalize(vP);
        float a=blob(n,normalize(vec3(-.7,.5,-.2)),.20);
        float b=blob(n,normalize(vec3(.7,-.2,-.5)),.16);
        float c=blob(n,normalize(vec3(.1,.8,.6)),.13);
        float d=blob(n,normalize(vec3(-.2,-.7,.5)),.18);
        vec3 col=vec3(.012,.014,.03)+vec3(.35,.12,.58)*a*.72+vec3(.95,.27,.09)*b*.5+vec3(.10,.24,.75)*c*.55+vec3(.75,.12,.42)*d*.48;
        col += .012*sin(uTime*.25+n.y*8.0);
        gl_FragColor=vec4(col,1.0);
      }`
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(75, 48, 32), domeMat); scene.add(dome);

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xb9c7e8, metalness: .08, roughness: .4, transmission: .88,
    thickness: .65, ior: 1.24, clearcoat: .8, clearcoatRoughness: .24,
    transparent: true, opacity: .96, side: THREE.DoubleSide
  });
  const glassDark = new THREE.MeshPhysicalMaterial({
    color: 0x182238, metalness: .16, roughness: .32, transmission: .38,
    thickness: .5, ior: 1.28, clearcoat: .9, transparent: true, opacity: .96
  });
  const orange = new THREE.MeshStandardMaterial({ color: 0xff8a4c, emissive: 0xff5722, emissiveIntensity: .8, roughness: .28 });
  const white = new THREE.MeshBasicMaterial({ color: 0xf7f7fb });
  const green = new THREE.MeshBasicMaterial({ color: 0x8ef0b2 });

  function roundedShape(w, h, r) {
    const s = new THREE.Shape();
    s.moveTo(-w/2+r,-h/2); s.lineTo(w/2-r,-h/2); s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
    s.lineTo(w/2,h/2-r); s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
    s.lineTo(-w/2+r,h/2); s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
    s.lineTo(-w/2,-h/2+r); s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
    return s;
  }
  function slab(w,h,depth=.16,mat=glass,r=.18) {
    const g = new THREE.ExtrudeGeometry(roundedShape(w,h,r), { depth, bevelEnabled:true, bevelSegments:3, steps:1, bevelSize:.055, bevelThickness:.045, curveSegments:8 });
    const m = new THREE.Mesh(g,mat); m.position.z -= depth/2; return m;
  }
  function canvasFace(w,h,draw) {
    const c=document.createElement('canvas'); c.width=1400; c.height=Math.round(1400*h/w);
    const ctx=c.getContext('2d');
    draw(ctx,c.width,c.height);
    const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=8;
    const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w-.18,h-.16),mat);
    mesh.position.z=.17;
    return {mesh,ctx,canvas:c,texture:tex,draw};
  }
  function border(ctx,w,h,r=26) {
    ctx.save(); ctx.strokeStyle='rgba(255,255,255,.78)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.roundRect(3,3,w-6,h-6,r); ctx.stroke(); ctx.restore();
  }
  function label(ctx,text,x,y,size,color='#fff',weight=600,align='left') {
    ctx.font=`${weight} ${size}px -apple-system,BlinkMacSystemFont,"SF Pro Display",Arial,sans-serif`;
    ctx.fillStyle=color; ctx.textAlign=align; ctx.textBaseline='middle'; ctx.fillText(text,x,y);
  }
  function sceneHeading(group,step,word) {
    const c=document.createElement('canvas'); c.width=1000; c.height=220; const x=c.getContext('2d');
    label(x,step,500,45,30,'#ff8a4c',700,'center'); label(x,word,500,135,92,'#ffffff',750,'center');
    const tx=new THREE.CanvasTexture(c); tx.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(6.5,1.43),new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false}));
    mesh.position.set(0,2.35,.2); group.add(mesh); return mesh;
  }
  function addScene(position) { const g=new THREE.Group(); g.position.copy(position); scene.add(g); return g; }

  const scene1=addScene(new THREE.Vector3(0,0,0)); sceneHeading(scene1,'STEP 01','DESCRIBE IT');
  const chat=slab(7.2,2.25,.22,glass); chat.position.y=-.15; scene1.add(chat);
  const chatUI=canvasFace(7.2,2.25,(ctx,w,h)=>{
    border(ctx,w,h,32); label(ctx,'CLAUDE',54,58,28,'rgba(255,255,255,.64)',650);
    label(ctx,'Build me a habit tracker with streaks.',54,155,39,'#ffffff',520);
    ctx.fillStyle='#ff8a4c'; ctx.beginPath(); ctx.roundRect(w-112,h-104,64,64,18); ctx.fill();
    label(ctx,'↑',w-80,h-70,46,'#17131a',700,'center');
  }); chat.add(chatUI.mesh);
  const reply=slab(5.1,1.05,.14,glassDark); reply.position.set(.65,-1.92,.15); reply.scale.setScalar(.001); scene1.add(reply);
  const replyUI=canvasFace(5.1,1.05,(ctx,w,h)=>{border(ctx,w,h,24);label(ctx,'On it. Here’s the plan.',48,h/2,35,'#fff',600);}); reply.add(replyUI.mesh);

  const scene2=addScene(new THREE.Vector3(0,0,-12)); sceneHeading(scene2,'STEP 02','PLAN IT');
  const taskNames=['Create habit dashboard','Add daily check-ins','Track streak history','Build progress chart','Polish mobile layout'];
  const tasks=[];
  taskNames.forEach((name,i)=>{
    const g=new THREE.Group(); g.position.set((i%2)*.14,1.18-i*.62,-i*.12); scene2.add(g);
    const card=slab(5.9,.53,.12,glassDark,.12); g.add(card);
    const ui=canvasFace(5.9,.53,(ctx,w,h)=>{border(ctx,w,h,15);label(ctx,name,48,h/2,25,'#fff',520);ctx.strokeStyle='#ff8a4c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(w-54,h/2,16,0,Math.PI*2);ctx.stroke();});
    g.add(ui.mesh); tasks.push({g,ui});
  });

  const scene3=addScene(new THREE.Vector3(0,0,-24)); sceneHeading(scene3,'STEP 03','BUILD IT');
  const editor=slab(7.5,3.6,.24,glassDark,.2); editor.position.y=-.1; scene3.add(editor);
  const codeUI=canvasFace(7.5,3.6,(ctx,w,h)=>{
    border(ctx,w,h,28); ['#ff6b65','#ffc65a','#54d68b'].forEach((c,i)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(45+i*34,48,10,0,Math.PI*2);ctx.fill();});
    label(ctx,'HabitCard.jsx',w/2,48,22,'rgba(255,255,255,.76)',600,'center');
    const lines=[['01','export default function HabitCard() {'],['02','  const [streak, setStreak] = useState(12);'],['03','  return ('],['04','    <Card title="Daily habits">'],['05','      <Streak count={streak} />'],['06','      <HabitList editable />'],['07','    </Card>'],['08','  );'],['09','}']];
    lines.forEach((l,i)=>{const y=112+i*37;label(ctx,l[0],38,y,21,'#7d8ca7',500);label(ctx,l[1],90,y,22,i===0||i===8?'#c792ea':i===1?'#ffca80':i[0]==='<'?'#85c8ff':'#e8edf6',520);});
  }); scene3.add(codeUI.mesh);
  const fileNames=['App.jsx','Habit.jsx','Streaks.jsx','Chart.jsx','styles.css','tests.spec.js'];
  const fileTiles=[];
  fileNames.forEach((name,i)=>{
    const g=new THREE.Group(); g.position.set(Math.cos(i*Math.PI/3)*4.45,Math.sin(i*Math.PI/3)*2.1,-.2-i*.08); scene3.add(g);
    const tile=slab(1.8,.48,.11,glass,.1); g.add(tile);
    const ui=canvasFace(1.8,.48,(ctx,w,h)=>{border(ctx,w,h,12);label(ctx,name,w/2,h/2,19,'#fff',550,'center');});g.add(ui.mesh);fileTiles.push(g);
  });
  const passed=slab(2.9,.58,.12,glassDark,.14); passed.position.set(2.15,-2.25,.4); passed.scale.setScalar(.001); scene3.add(passed);
  const passedUI=canvasFace(2.9,.58,(ctx,w,h)=>{border(ctx,w,h,15);label(ctx,'✓  12 tests passed',w/2,h/2,24,'#8ef0b2',700,'center');});passed.add(passedUI.mesh);

  const scene4=addScene(new THREE.Vector3(0,0,-36)); sceneHeading(scene4,'STEP 04','SHIP IT');
  const phone=new THREE.Group(); phone.position.set(0,-.15,0); scene4.add(phone);
  const phoneBody=slab(3.0,5.0,.32,glass,.38); phone.add(phoneBody);
  const phoneUI=canvasFace(3.0,5.0,(ctx,w,h)=>{
    border(ctx,w,h,36); label(ctx,'9:41',44,48,20,'#fff',650); label(ctx,'My habits',w/2,112,35,'#fff',700,'center');
    ctx.fillStyle='rgba(255,138,76,.2)';ctx.beginPath();ctx.roundRect(36,155,w-72,165,24);ctx.fill();
    label(ctx,'CURRENT STREAK',58,194,18,'#ffb18a',700); label(ctx,'12 days',58,254,52,'#fff',750);
    label(ctx,'TODAY',48,372,18,'rgba(255,255,255,.6)',700);
    ['Morning run','Read 20 pages','Drink water'].forEach((v,i)=>{const y=425+i*72;ctx.strokeStyle=i<2?'#8ef0b2':'rgba(255,255,255,.45)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(55,y,14,0,Math.PI*2);ctx.stroke();if(i<2){ctx.beginPath();ctx.moveTo(47,y);ctx.lineTo(53,y+7);ctx.lineTo(65,y-8);ctx.stroke();}label(ctx,v,88,y,22,'#fff',550);});
    label(ctx,'WEEKLY PROGRESS',48,675,18,'rgba(255,255,255,.62)',650);
    const vals=[.35,.55,.42,.76,.62,.9,.72];vals.forEach((v,i)=>{ctx.fillStyle=i===5?'#ff8a4c':'rgba(255,255,255,.48)';ctx.beginPath();ctx.roundRect(48+i*65,790-v*95,35,v*95,9);ctx.fill();});
    label(ctx,'M  T  W  T  F  S  S',w/2,818,16,'rgba(255,255,255,.6)',500,'center');
  }); phone.add(phoneUI.mesh);
  const streak=slab(1.8,.62,.12,glassDark,.16); streak.position.set(2.65,1.75,.4); scene4.add(streak);
  const streakUI=canvasFace(1.8,.62,(ctx,w,h)=>{border(ctx,w,h,16);label(ctx,'🔥 12',w/2,h/2,27,'#fff',700,'center');});streak.add(streakUI.mesh);

  // A single glowing Catmull-Rom path ties the four workspaces together.
  const pathPoints=[new THREE.Vector3(-4,-2.8,1),new THREE.Vector3(3,-2.5,-5),new THREE.Vector3(-3,2.8,-10),new THREE.Vector3(3,-2.6,-17),new THREE.Vector3(-3,2.7,-22),new THREE.Vector3(3,-2.7,-29),new THREE.Vector3(-3,2.8,-34),new THREE.Vector3(0,-2.8,-39)];
  const path=new THREE.CatmullRomCurve3(pathPoints);
  const tube=new THREE.Mesh(new THREE.TubeGeometry(path,420,.035,8,false),new THREE.MeshBasicMaterial({color:0xff8a4c,transparent:true,opacity:.88}));
  tube.geometry.setDrawRange(0,0);scene.add(tube);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.12,18,18),new THREE.MeshBasicMaterial({color:0xffc19a}));scene.add(head);
  const headGlow=new THREE.PointLight(0xff8a4c,8,5);scene.add(headGlow);

  const deco=[];
  for(let i=0;i<38;i++){
    const type=i%3, size=.07+seeded(i)*.17;
    let geo=type===0?new THREE.SphereGeometry(size,16,12):type===1?new THREE.TorusGeometry(size*1.6,size*.12,8,24):new THREE.IcosahedronGeometry(size,1);
    const mat=new THREE.MeshPhysicalMaterial({color:[0x9bb9ff,0xffa1cb,0xffb27c][type],metalness:.16,roughness:.17,transmission:.68,thickness:.8,ior:1.32,dispersion:.12,clearcoat:1});
    const m=new THREE.Mesh(geo,mat);
    m.position.set((seeded(i+50)-.5)*17,(seeded(i+90)-.5)*9,-seeded(i+140)*43-2);
    m.rotation.set(seeded(i+170)*6,seeded(i+200)*6,0);scene.add(m);deco.push(m);
  }

  const confettiCount=180;
  const confGeo=new THREE.PlaneGeometry(.075,.13);
  const confMat=new THREE.MeshBasicMaterial({color:0xff8a4c,side:THREE.DoubleSide});
  const confetti=new THREE.InstancedMesh(confGeo,confMat,confettiCount);scene.add(confetti);
  const dummy=new THREE.Object3D();
  const confData=Array.from({length:confettiCount},(_,i)=>({x:(seeded(i+500)-.5)*8,y:seeded(i+600)*5+1,z:-36+(seeded(i+700)-.5)*4,v:1+seeded(i+800)*2,phase:seeded(i+900)*6.28,s:0.55+seeded(i+1000)*.9}));
  for(let i=0;i<confettiCount;i++){dummy.position.set(0,-100,0);dummy.updateMatrix();confetti.setMatrixAt(i,dummy.matrix);}

  // Camera path: gentle drift inside a scene, fast expo-eased whips between them.
  const cameraStops=[
    {t:0,p:new THREE.Vector3(0,0,7),look:new THREE.Vector3(0,0,-.4)},
    {t:2.7,p:new THREE.Vector3(.2,.05,5.6),look:new THREE.Vector3(0,0,-.5)},
    {t:3,p:new THREE.Vector3(-.1,.1,-5.2),look:new THREE.Vector3(0,0,-12)},
    {t:5.7,p:new THREE.Vector3(.1,-.1,-6.2),look:new THREE.Vector3(0,0,-12)},
    {t:6,p:new THREE.Vector3(0,0,-17.2),look:new THREE.Vector3(0,0,-24)},
    {t:9.5,p:new THREE.Vector3(.1,.1,-18.2),look:new THREE.Vector3(0,0,-24)},
    {t:10,p:new THREE.Vector3(0,0,-29.2),look:new THREE.Vector3(0,0,-36)},
    {t:12.35,p:new THREE.Vector3(0,.05,-30.3),look:new THREE.Vector3(0,0,-36)},
    {t:12.5,p:new THREE.Vector3(0,0,16),look:new THREE.Vector3(0,0,-18)}
  ];
  function cameraAt(t){
    let a=cameraStops[0],b=cameraStops[cameraStops.length-1];
    for(let i=0;i<cameraStops.length-1;i++){if(t>=cameraStops[i].t&&t<=cameraStops[i+1].t){a=cameraStops[i];b=cameraStops[i+1];break;}}
    const u=clamp((t-a.t)/(b.t-a.t||1));
    const fast=(b.t-a.t)<.6||((a.t===2.7)||(a.t===5.7)||(a.t===9.5)||(a.t===12.35));
    const e=fast?expo(u):u;
    camera.position.lerpVectors(a.p,b.p,e);
    const target=new THREE.Vector3().lerpVectors(a.look,b.look,e);
    camera.lookAt(target);
    if(t>=12.5){camera.position.set(0,0,mix(16,21,smooth(12.5,15,t)));camera.lookAt(0,0,-18);}
  }

  const finalOverlay=new THREE.Group();camera.add(finalOverlay);finalOverlay.position.set(0,0,-7.2);
  function overlayText(text,y,size,color){
    const c=document.createElement('canvas');c.width=1400;c.height=220;const x=c.getContext('2d');
    label(x,text,700,110,size,color,750,'center');const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(8.8,1.38),new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false}));
    m.position.y=y;finalOverlay.add(m);return m;
  }
  const finalLine1=overlayText('ONE CONVERSATION',.9,72,'#ffffff');
  const finalLine2=overlayText('Idea  →  App',-.08,92,'#ff8a4c');
  const pill=slab(3.5,.62,.12,glassDark,.22);pill.position.set(0,-1.05,0);finalOverlay.add(pill);
  const pillUI=canvasFace(3.5,.62,(ctx,w,h)=>{border(ctx,w,h,20);label(ctx,'Built with Claude Code',w/2,h/2,25,'#fff',600,'center');});pill.add(pillUI.mesh);
  finalOverlay.visible=false;

  let disposed=false;
  function resize(width,height){
    // renderer's logical landscape dimensions are the inverse of the portrait host.
    const portrait=height>=width;
    const rw=portrait?height:width, rh=portrait?width:height;
    renderer.setSize(rw,rh,false);
    canvas.style.width=`${rw}px`;canvas.style.height=`${rh}px`;
    canvas.style.left='50%';canvas.style.top='50%';
    canvas.style.transform=portrait?'translate(-50%,-50%) rotate(90deg)':'translate(-50%,-50%)';
    camera.aspect=rw/rh;camera.updateProjectionMatrix();
  }

  function update(time){
    if(disposed)return;
    const t=clamp(time,0,15);
    domeMat.uniforms.uTime.value=t;
    cameraAt(t);
    const progress=clamp(t/12.5);
    const drawCount=Math.floor(tube.geometry.index? tube.geometry.index.count*progress : tube.geometry.attributes.position.count*progress);
    tube.geometry.setDrawRange(0,drawCount);
    const p=path.getPointAt(progress);head.position.copy(p);headGlow.position.copy(p);
    const scene1In=1-smooth(2.7,3,t),scene2In=smooth(2.8,3.15,t)*(1-smooth(5.7,6,t)),scene3In=smooth(5.8,6.2,t)*(1-smooth(9.5,10,t)),scene4In=smooth(9.8,10.2,t)*(1-smooth(12.35,12.65,t));
    chatUI.draw(chatUI.ctx,chatUI.canvas.width,chatUI.canvas.height);
    // Redraw the live chat line and cursor deterministically.
    const c=chatUI.ctx,w=chatUI.canvas.width,h=chatUI.canvas.height;
    c.clearRect(0,0,w,h);border(c,w,h,32);label(c,'CLAUDE',54,58,28,'rgba(255,255,255,.64)',650);
    const sentence='Build me a habit tracker with streaks.';
    const n=Math.floor(clamp((t-.25)/1.45)*sentence.length);
    c.save();c.beginPath();c.rect(40,105,w-190,90);c.clip();label(c,sentence.slice(0,n),54,155,39,'#fff',520);
    if(t<1.85&&Math.floor(t*3)%2===0){const width=c.measureText(sentence.slice(0,n)).width;c.fillStyle='#ff8a4c';c.fillRect(54+width+5,130,3,48);}c.restore();
    c.fillStyle=t>1.9?'#ff8a4c':'rgba(255,138,76,.38)';c.beginPath();c.roundRect(w-112,h-104,64,64,18);c.fill();label(c,'↑',w-80,h-70,46,'#17131a',700,'center');
    chatUI.texture.needsUpdate=true;
    reply.scale.setScalar(smooth(2.15,2.65,t));reply.position.y=-1.92+smooth(2.1,2.8,t)*.28;
    replyUI.texture.needsUpdate=true;
    tasks.forEach((task,i)=>{const done=smooth(3.35+i*.38,3.7+i*.38,t);task.g.position.x=mix(1.2,0, smooth(3.05+i*.1,3.55+i*.1,t));task.g.position.z=-i*.12+Math.sin(t*2+i)*.025;const cx=task.ui.ctx,cw=task.ui.canvas.width,ch=task.ui.canvas.height;cx.clearRect(0,0,cw,ch);border(cx,cw,ch,15);label(cx,taskNames[i],48,ch/2,25,'#fff',520);if(done>.01){cx.strokeStyle='#8ef0b2';cx.lineWidth=5;cx.beginPath();cx.arc(cw-54,ch/2,17,-Math.PI/2,-Math.PI/2+Math.PI*2*done);cx.stroke();if(done>.95){cx.beginPath();cx.moveTo(cw-65,ch/2);cx.lineTo(cw-56,ch/2+9);cx.lineTo(cw-40,ch/2-10);cx.stroke();cx.beginPath();cx.moveTo(48,ch/2+15);cx.lineTo(cw-100,ch/2+15);cx.strokeStyle='rgba(255,255,255,.5)';cx.lineWidth=2;cx.stroke();}}task.ui.texture.needsUpdate=true;task.g.position.y=1.18-i*.62+Math.sin(smooth(3,3.5,t)*Math.PI)*.15;});
    fileTiles.forEach((g,i)=>{const a=t*.55+i*Math.PI/3;g.position.x=Math.cos(a)*4.25;g.position.y=Math.sin(a)*1.9;g.rotation.z=Math.sin(t+i)*.12;});
    passed.scale.setScalar(smooth(8.9,9.35,t));
    phone.rotation.y=mix(-.55,0,smooth(10,10.8,t));phone.rotation.z=mix(.16,0,smooth(10,11,t));phone.scale.setScalar(smooth(9.9,10.35,t));
    streak.position.y=1.75+Math.sin(t*3)*.05;streak.scale.setScalar(smooth(10.5,11.3,t));
    deco.forEach((m,i)=>{m.rotation.x=t*.08+(i%4);m.rotation.y=t*.12+i;m.position.y+=0;});
    for(let i=0;i<confettiCount;i++){const d=confData[i];const local=clamp((t-10.8)/2.5);const fall=d.v*local*3.6;dummy.position.set(d.x+Math.sin(t*2+d.phase)*.22,d.y-fall-0.5*local*local,d.z);dummy.rotation.set(d.phase+t*1.8,d.phase*.7+t,d.phase+t*.8);const s=d.s*(local>.98?0:1);dummy.scale.set(s,s,s);dummy.updateMatrix();confetti.setMatrixAt(i,dummy.matrix);}confetti.instanceMatrix.needsUpdate=true;
    finalOverlay.visible=t>=12.5;
    const reveal=smooth(12.65,13.2,t);
    finalOverlay.scale.setScalar(reveal);
    renderer.render(scene,camera);
  }

  function dispose(){
    if(disposed)return;disposed=true;
    scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const arr=Array.isArray(o.material)?o.material:[o.material];arr.forEach(m=>{if(m.map)m.map.dispose();m.dispose();});}});
    renderer.dispose();canvas.remove();
  }
  return {update,resize,destroy:dispose};
}