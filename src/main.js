import * as THREE from 'three';
import { gsap } from 'gsap';
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
scene.background = new THREE.Color('#05070d');
scene.fog = new THREE.FogExp2('#05070d', 0.018);
const camera = new THREE.PerspectiveCamera(38, 9 / 16, 0.1, 120);
camera.position.set(0, 0, 14);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
mount.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0x8b9ab5, 1.15));
const warm = new THREE.PointLight(0xff9a62, 18, 40);
warm.position.set(-4, 4, 7);
scene.add(warm);
const cool = new THREE.PointLight(0x4bc6d9, 20, 45);
cool.position.set(5, -3, -5);
scene.add(cool);

const world = new THREE.Group();
scene.add(world);

const atmosphere = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 70),
  new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uTint: { value: new THREE.Color('#14243b') } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime; uniform vec3 uTint; varying vec2 vUv;
      float blob(vec2 p, vec2 c, float r){ return exp(-dot(p-c,p-c)/r); }
      void main(){
        vec2 p=vUv;
        float a=blob(p,vec2(.18,.72),.11);
        float b=blob(p,vec2(.84,.34),.16);
        float c=blob(p,vec2(.55,.52),.32);
        float wave=sin(p.y*13.0+uTime*.24+p.x*5.0)*.018;
        vec3 col=vec3(.012,.018,.035)+uTint*(a*.42+b*.26+c*.10+wave);
        col+=vec3(.12,.045,.025)*blob(p,vec2(.32,.18+sin(uTime*.15)*.04),.08);
        gl_FragColor=vec4(col,1.0);
      }`
  })
);
atmosphere.position.set(0, 0, -32);
world.add(atmosphere);

function makeText(text, { w=6, h=1, size=100, color='#f4f5f8', weight=600, align='center' }={}) {
  const canvas=document.createElement('canvas'); canvas.width=1200; canvas.height=260;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.font=`${weight} ${size}px Arial, sans-serif`;
  ctx.textAlign=align; ctx.textBaseline='middle'; ctx.fillStyle=color;
  ctx.shadowColor='rgba(120,190,220,.16)'; ctx.shadowBlur=8;
  ctx.fillText(text, align==='center'?600:80,130,1040);
  const tex=new THREE.CanvasTexture(canvas); tex.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
  mesh.userData.texture=tex; return mesh;
}
function addText(group,text,opts={}) { const m=makeText(text,opts); group.add(m); return m; }
function setVisible(group, visible) { group.visible=visible; }

const starGeo=new THREE.BufferGeometry();
const starPos=new Float32Array(850*3);
for(let i=0;i<850;i++){starPos[i*3]=(Math.random()-.5)*25;starPos[i*3+1]=(Math.random()-.5)*42;starPos[i*3+2]=-28+Math.random()*35;}
starGeo.setAttribute('position',new THREE.BufferAttribute(starPos,3));
const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x91abc4,size:.022,transparent:true,opacity:.5,depthWrite:false}));
world.add(stars);

// 00–04 — the question is a spark, not a title card.
const hook=new THREE.Group(); world.add(hook);
const hookA=addText(hook,'Ты задаёшь вопрос.',{w:7.3,h:.92,size:112,weight:500});
hookA.position.y=.62;
const hookB=addText(hook,'Что происходит дальше?',{w:8.2,h:.95,size:94,weight:650,color:'#e6a77c'});
hookB.position.y=-.58;
const seed=new THREE.Mesh(new THREE.IcosahedronGeometry(.22,3),new THREE.MeshPhysicalMaterial({color:'#e9a477',emissive:'#6e311b',emissiveIntensity:.75,metalness:.32,roughness:.18,clearcoat:1}));
seed.position.set(0,-.02,0); seed.scale.setScalar(.001); hook.add(seed);
const sparkles=[];
for(let i=0;i<100;i++){
  const p=new THREE.Mesh(new THREE.SphereGeometry(.018+Math.random()*.026,8,8),new THREE.MeshBasicMaterial({color:i%3===0?'#f2b184':'#70c9d6',transparent:true,opacity:.85}));
  p.position.set((Math.random()-.5)*7,(Math.random()-.5)*4,(Math.random()-.5)*2);
  hook.add(p); sparkles.push(p);
}

// 04–11 — a sentence breaks into irregular linguistic pieces.
const tokenScene=new THREE.Group(); world.add(tokenScene);
const phrase=addText(tokenScene,'Завтра утром будет солнце.',{w:8.4,h:1.1,size:88,weight:500});
phrase.position.y=1.25;
const tokenWords=['Зав','тра','ут','ром','бу','дет','солн','це'];
const tokenObjects=[];
tokenWords.forEach((word,i)=>{
  const g=new THREE.Group();
  const width=[.78,.72,.54,.82,.54,.75,.94,.54][i];
  const base=new THREE.Mesh(new THREE.BoxGeometry(width,.48,.12),new THREE.MeshPhysicalMaterial({color:i%2?'#1a5261':'#653e32',metalness:.4,roughness:.28,clearcoat:.8,transparent:true,opacity:.96}));
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(base.geometry),new THREE.LineBasicMaterial({color:i%2?'#74c8d1':'#e7a276',transparent:true,opacity:.62}));
  const label=addText(g,word,{w:width*.9,h:.32,size:105,color:'#f5e9df',weight:650});
  label.position.z=.09;
  g.add(base,edge);
  g.position.set((i-3.5)*.93,Math.sin(i*1.8)*.32,-(i%3)*.28);
  g.rotation.z=(i%2?-.1:.07);
  tokenScene.add(g); tokenObjects.push(g);
});
const tokenDust=[];
for(let i=0;i<75;i++){
  const p=new THREE.Mesh(new THREE.TetrahedronGeometry(.025+Math.random()*.03),new THREE.MeshBasicMaterial({color:i%2?'#71c7d4':'#d99870',transparent:true,opacity:.8}));
  p.position.set((Math.random()-.5)*8,(Math.random()-.5)*3,-1-Math.random()*3);tokenScene.add(p);tokenDust.push(p);
}

// 11–22 — context becomes a deep, breathing field of curved paths.
const contextScene=new THREE.Group(); world.add(contextScene);
const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.72,5),new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uColor:{value:new THREE.Color('#8bd2d7')}},
  vertexShader:`varying vec3 vN; varying vec3 vP; void main(){vN=normalize(normalMatrix*normal);vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform float uTime;uniform vec3 uColor;varying vec3 vN;varying vec3 vP;void main(){float fres=pow(1.0-abs(dot(normalize(vN),vec3(0.,0.,1.))),2.0);float bands=.5+.5*sin(vP.y*17.+vP.x*9.+uTime*.8);vec3 c=uColor*(.14+fres*.8+bands*.08);gl_FragColor=vec4(c,.92);}`,
  transparent:true,depthWrite:false
}));
core.position.set(0,0,-1);contextScene.add(core);
const rings=[];
for(let i=0;i<8;i++){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.45+i*.29,.009+(i%3)*.004,5,180),new THREE.MeshBasicMaterial({color:i%2?'#4ba8b7':'#d18b67',transparent:true,opacity:.34-(i%3)*.045}));
  ring.rotation.set(.28+i*.18,.16*i,.22*i);ring.position.set(Math.sin(i*2)*.22,Math.cos(i*1.3)*.22,-1-i*.45);
  contextScene.add(ring);rings.push(ring);
}
const filaments=[];
for(let i=0;i<34;i++){
  const points=[];
  const phase=i/34*Math.PI*2;
  for(let j=0;j<=70;j++){
    const t=j/70;
    const r=1.15+1.4*t;
    points.push(new THREE.Vector3(Math.cos(phase+t*2.4)*r,Math.sin(phase+t*2.4)*r*.72,-.5-t*7));
  }
  const curve=new THREE.CatmullRomCurve3(points);
  const geo=new THREE.TubeGeometry(curve,90,.008+(i%4)*.002,5,false);
  const mat=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uColor:{value:new THREE.Color(i%4===0?'#e1a077':'#63bac7')},uSeed:{value:i*.7}},
    vertexShader:`varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float uTime;uniform vec3 uColor;uniform float uSeed;varying vec3 vPos;void main(){float pulse=pow(max(0.,sin(vPos.z*2.5-uTime*2.0+uSeed)),12.);gl_FragColor=vec4(uColor*(.26+pulse*.9),.48+pulse*.28);}`,
    transparent:true,depthWrite:false
  });
  const line=new THREE.Mesh(geo,mat);contextScene.add(line);filaments.push(line);
}
const contextCaption=addText(contextScene,'Контекст меняет значение',{w:7.6,h:.68,size:72,color:'#cce4e5',weight:500});
contextCaption.position.set(0,-3.15,0);

// 22–31 — possible next steps fan out; one path is chosen.
const choiceScene=new THREE.Group();world.add(choiceScene);
const choiceCore=new THREE.Mesh(new THREE.SphereGeometry(.22,24,24),new THREE.MeshBasicMaterial({color:'#f0ad7f'}));
choiceCore.position.set(0,0,0);choiceScene.add(choiceCore);
const options=['пойдёт','будет','начнётся','изменится','останется'];
const branches=[];
options.forEach((word,i)=>{
  const angle=(-.78+i*.39);
  const end=new THREE.Vector3(Math.sin(angle)*3.2,Math.cos(angle)*2.8,-2.4-Math.abs(i-2)*.22);
  const start=new THREE.Vector3(0,0,0);
  const mid=start.clone().lerp(end,.54);mid.x+=(i-2)*.18;
  const curve=new THREE.QuadraticBezierCurve3(start,mid,end);
  const line=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.012,5,false),new THREE.MeshBasicMaterial({color:i===2?'#e7a47c':'#5b9eac',transparent:true,opacity:.42}));
  choiceScene.add(line);
  const dot=new THREE.Mesh(new THREE.SphereGeometry(.045,12,12),new THREE.MeshBasicMaterial({color:i===2?'#ffd1a7':'#86cbd2'}));
  dot.position.copy(end);choiceScene.add(dot);
  const label=addText(choiceScene,word,{w:1.7,h:.48,size:84,color:i===2?'#ffe0c6':'#a9c8cf',weight:550});
  label.position.copy(end).add(new THREE.Vector3(0,.38,.05));
  branches.push({line,dot,label,end,angle});
});
const chosenGlow=new THREE.Mesh(new THREE.SphereGeometry(.16,20,20),new THREE.MeshBasicMaterial({color:'#f7c49d',transparent:true,opacity:.9}));
chosenGlow.scale.setScalar(.001);choiceScene.add(chosenGlow);

// 31–40 — a sentence assembles, then reveals the catch.
const finishScene=new THREE.Group();world.add(finishScene);
const outputLine=addText(finishScene,'Завтра утром будет солнце.',{w:8.1,h:1.0,size:88,weight:600});
outputLine.position.y=.9;
const cursor=addText(finishScene,'▍',{w:.25,h:.9,size:100,color:'#e9a77e'});
cursor.position.set(3.85,.9,.1);
const finalOne=addText(finishScene,'Это не понимание.',{w:7.8,h:.8,size:80,color:'#b7dadd',weight:500});
finalOne.position.y=-.5;finalOne.material.opacity=0;
const finalTwo=addText(finishScene,'Это прогноз следующего токена.',{w:8.4,h:.9,size:70,color:'#f1c09c',weight:600});
finalTwo.position.y=-1.48;finalTwo.material.opacity=0;

const chapters=[
  {at:0,tag:'ОДИН ВОПРОС',title:'Что происходит внутри ИИ?',sub:'Ты отправил сообщение. Начинается цепочка вычислений.'},
  {at:4,tag:'01 / РАЗБИЕНИЕ',title:'Текст распадается на части',sub:'Модель получает не смысл целиком, а последовательность токенов.'},
  {at:11,tag:'02 / КОНТЕКСТ',title:'Каждая часть связана с другими',sub:'Механизм внимания оценивает, что важно учитывать прямо сейчас.'},
  {at:22,tag:'03 / ВЫБОР',title:'Впереди — несколько вариантов',sub:'Модель оценивает вероятности возможного следующего токена.'},
  {at:31,tag:'04 / ПРОДОЛЖЕНИЕ',title:'Ответ собирается по частям',sub:'Выбранный токен становится контекстом для следующего шага.'},
  {at:36,tag:'ЗАПОМНИ',title:'Похоже на мысль. Но это прогноз.',sub:'Уверенный тон не делает ответ автоматически верным.'}
];
let currentChapter=-1;
function updateChapter(t){
  let idx=0;for(let i=0;i<chapters.length;i++)if(t>=chapters[i].at)idx=i;
  if(idx===currentChapter)return;currentChapter=idx;
  const c=chapters[idx];eyebrow.textContent=c.tag;headline.textContent=c.title;subline.textContent=c.sub;
}

const tl=gsap.timeline({paused:true,defaults:{ease:'power2.inOut'}});
tl.fromTo(hook.scale,{x:.84,y:.84,z:.84},{x:1,y:1,z:1,duration:1.5},0);
tl.fromTo(seed.scale,{x:.001,y:.001,z:.001},{x:1,y:1,z:1,duration:.7,ease:'back.out(2)'},2.4);
tl.to(hookA.material,{opacity:0,duration:.35},3.15);
tl.to(hookB.material,{opacity:0,duration:.35},3.15);
sparkles.forEach((p,i)=>{
  const a=i/100*Math.PI*2;const r=.5+(i%8)*.12;
  tl.to(p.position,{x:Math.cos(a)*r,y:Math.sin(a)*r,z:-2-(i%5)*.35,duration:1.15,ease:'power2.in'},3.05+(i%10)*.025);
  tl.to(p.scale,{x:.1,y:.1,z:.1,duration:.6},3.2+(i%9)*.03);
});
tl.fromTo(tokenScene.scale,{x:.001,y:.001,z:.001},{x:1,y:1,z:1,duration:.75,ease:'back.out(1.4)'},4);
tl.fromTo(phrase.position,{y:1.25,z:0},{y:1.25,z:.2,duration:.01},4);
tl.to(phrase.material,{opacity:0,duration:.3},6.6);
tokenObjects.forEach((g,i)=>{
  tl.fromTo(g.rotation,{x:(i%2?-.6:.6),y:(i%3-.8)},{x:0,y:0,duration:.6},6.5+i*.045);
  tl.to(g.position,{x:(i-3.5)*1.02,y:Math.sin(i*2.1)*.65,z:-.4+(i%3)*.18,duration:1.2},7.1+i*.035);
});
tokenDust.forEach((p,i)=>tl.to(p.position,{x:(i%11-5)*.55,y:(i%7-3)*.45,z:-3-(i%6),duration:1.3},8+(i%12)*.035));
tl.to(tokenScene.position,{z:-4,duration:1.2},9.5);
tl.fromTo(contextScene.scale,{x:.1,y:.1,z:.1},{x:1,y:1,z:1,duration:1.3,ease:'power3.out'},11);
tl.to(camera.position,{z:8.4,x:.2,duration:2.8,ease:'sine.inOut'},11.4);
tl.to(contextScene.rotation,{y:.16,x:-.1,duration:7},12);
rings.forEach((r,i)=>tl.to(r.rotation,{z:r.rotation.z+(i%2?-.5:.55),x:r.rotation.x+.18,duration:5.5},12+i*.08));
tl.to(camera.position,{z:4.7,y:.15,x:-.35,duration:4,ease:'sine.inOut'},16);
tl.to(core.scale,{x:1.2,y:1.2,z:1.2,duration:2,yoyo:true,repeat:1},16);
tl.to(contextCaption.material,{opacity:0,duration:.4},20.3);
tl.to(contextScene.scale,{x:.65,y:.65,z:.65,duration:1},21);
tl.to(camera.position,{z:13,y:0,x:0,duration:1.1},21);
tl.fromTo(choiceScene.scale,{x:.001,y:.001,z:.001},{x:1,y:1,z:1,duration:.7,ease:'back.out(1.3)'},22);
branches.forEach((b,i)=>{
  tl.fromTo(b.dot.scale,{x:.001,y:.001,z:.001},{x:1,y:1,z:1,duration:.35},22.4+i*.14);
  tl.fromTo(b.label.material,{opacity:0},{opacity:1,duration:.35},22.5+i*.14);
});
tl.to(branches[0].line.material,{opacity:.12,duration:.5},26.4);
tl.to(branches[1].line.material,{opacity:.12,duration:.5},26.4);
tl.to(branches[3].line.material,{opacity:.12,duration:.5},26.4);
tl.to(branches[4].line.material,{opacity:.12,duration:.5},26.4);
tl.to(branches[2].line.material,{opacity:.95,duration:.55},26.4);
tl.to(chosenGlow.scale,{x:1,y:1,z:1,duration:.4,ease:'back.out(2)'},26.5);
tl.to(chosenGlow.position,{x:branches[2].end.x,y:branches[2].end.y,z:branches[2].end.z,duration:.8},26.5);
tl.to(choiceScene.position,{z:-1.3,duration:1.1},29.5);
tl.fromTo(finishScene.scale,{x:.001,y:.001,z:.001},{x:1,y:1,z:1,duration:.7},31);
tl.to(cursor.position,{x:3.85,y:.9,duration:.1},31);
tl.fromTo(finalOne.material,{opacity:0},{opacity:1,duration:.6},35.7);
tl.to(outputLine.material,{opacity:.35,duration:.6},35.7);
tl.fromTo(finalTwo.material,{opacity:0},{opacity:1,duration:.7},36.5);
tl.to(cursor.material,{opacity:0,duration:.2},36.5);
tl.to(camera.position,{z:11.5,duration:3,ease:'sine.inOut'},32);
tl.to(stars.rotation,{y:.12,duration:40},0);

function resize(){
  const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight);
  camera.aspect=9/16;camera.updateProjectionMatrix();
  renderer.setSize(w,h,false);
}
const observer=new ResizeObserver(resize);observer.observe(mount);resize();

function timeLabel(t){return `00:${String(Math.floor(t)).padStart(2,'0')}`;}
function renderFrame(seconds){
  const t=THREE.MathUtils.clamp(seconds,0,DURATION);
  tl.time(t,false);
  atmosphere.material.uniforms.uTime.value=t;
  core.material.uniforms.uTime.value=t;
  filaments.forEach(f=>f.material.uniforms.uTime.value=t);
  updateChapter(t);
  timecode.textContent=`${timeLabel(t)} / 00:40`;
  progress.style.width=`${t/DURATION*100}%`;
  renderer.render(scene,camera);
}
window.renderFrame=renderFrame;window.videoDuration=DURATION;

let currentTime=0,lastTimestamp=0,raf=0,playing=false;
function syncControls(){
  playToggle.setAttribute('aria-label',playing?'Пауза':'Воспроизвести');
  playIcon.textContent=playing?'Ⅱ':'▶';
  playLabel.textContent=playing?'Пауза':'Смотреть';
}
function pause(){
  playing=false;lastTimestamp=0;if(raf)cancelAnimationFrame(raf);raf=0;syncControls();
}
function frame(now){
  if(!playing)return;
  if(!lastTimestamp)lastTimestamp=now;
  currentTime+=(now-lastTimestamp)/1000;lastTimestamp=now;
  if(currentTime>=DURATION){currentTime=DURATION;renderFrame(currentTime);pause();return;}
  renderFrame(currentTime);raf=requestAnimationFrame(frame);
}
function play(){
  if(playing)return;if(currentTime>=DURATION)currentTime=0;
  playing=true;lastTimestamp=0;syncControls();raf=requestAnimationFrame(frame);
}
function toggle(){playing?pause():play();}
stage.addEventListener('click',e=>{if(e.target.closest('button'))return;toggle();});
playToggle.addEventListener('click',e=>{e.stopPropagation();toggle();});
scenarioToggle.addEventListener('click',e=>{e.stopPropagation();pause();scenarioModal.hidden=false;scenarioClose.focus();});
scenarioClose.addEventListener('click',()=>{scenarioModal.hidden=true;});
scenarioModal.addEventListener('click',e=>{if(e.target===scenarioModal)scenarioModal.hidden=true;});
window.addEventListener('keydown',e=>{
  if(e.code==='Escape'&&!scenarioModal.hidden){scenarioModal.hidden=true;return;}
  if(e.code==='Space'&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();toggle();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
renderFrame(0);play();
