
import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const button=document.querySelector('.contract'), address=document.querySelector('.address'), status=document.querySelector('.status');
let timer;
button.addEventListener('click',async()=>{
 clearTimeout(timer);
 try{await navigator.clipboard.writeText(address.textContent);status.textContent='CA copied.';}
 catch{const range=document.createRange();range.selectNodeContents(address);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Select & copy the address.';}
 timer=setTimeout(()=>status.textContent='',4000);
});
const motion=document.querySelector('.motion');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches;
function updateMotion(){motion.textContent=paused?'resume motion':'pause motion';motion.setAttribute('aria-pressed',String(paused));motion.setAttribute('aria-label',paused?'Retomar moedas':'Pausar moedas');}
motion.addEventListener('click',()=>{paused=!paused;updateMotion();});
reduced.addEventListener('change',e=>{paused=e.matches;updateMotion();});updateMotion();

async function startCoins(){
 const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#coins'),alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor(0,0);
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-8,8,5,-5,.1,100);camera.position.z=20;
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
 const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xfff5e8,0x354357,.65));
 const key=new THREE.DirectionalLight(0xfff0dc,2.4);key.position.set(-6,5,3);scene.add(key);
 const rim=new THREE.DirectionalLight(0xe5f2ff,1.1);rim.position.set(4,1,4);scene.add(rim);
 let halfWidth=8;
 function resize(){const ratio=innerWidth/innerHeight;halfWidth=5*ratio;camera.left=-halfWidth;camera.right=halfWidth;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
 resize();addEventListener('resize',resize);
 const gltf=await new GLTFLoader().loadAsync('./assets/bitcoin.glb?v=2');
 const model=gltf.scene;model.updateMatrixWorld(true);
 // Bake imported transforms so the coin rotates around its own center.
 const template=new THREE.Group();
 model.traverse(node=>{if(!node.isMesh)return;const geometry=node.geometry.clone().applyMatrix4(node.matrixWorld);const material=node.material.clone();material.color.set(0xe5ce9b);material.metalness=.88;material.roughness=.38;material.envMapIntensity=1.0;material.normalScale.set(1.8,1.8);template.add(new THREE.Mesh(geometry,material));});
 const bounds=new THREE.Box3().setFromObject(template),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
 template.children.forEach(mesh=>mesh.geometry.translate(-center.x,-center.y,-center.z));
 template.scale.setScalar(1/Math.max(size.x,size.y,size.z));
 // Face the coin toward the viewer regardless of the source model's thin axis.
 if(size.y<Math.min(size.x,size.z))template.rotation.x=Math.PI/2;
 else if(size.x<Math.min(size.y,size.z))template.rotation.y=Math.PI/2;
 const coins=[];const count=innerWidth<600?12:24;
 for(let i=0;i<count;i++){
  const pivot=new THREE.Group();pivot.add(template.clone(true));scene.add(pivot);
  const coin={pivot,speed:.5+Math.random()*.75,spinX:.25+Math.random()*.8,spinY:.5+Math.random()*1.1,phase:Math.random()*6.28,lane:Math.random()};
  pivot.scale.setScalar(.45+Math.random()*.55);pivot.position.set((coin.lane*2-1)*(halfWidth+.8),Math.random()*13-6,Math.random()*3-2);pivot.rotation.set(Math.random()*2,Math.random()*6,Math.random()*3);coins.push(coin);
 }
 document.body.dataset.coins='ready';
 let last=performance.now(),elapsed=0;
 renderer.setAnimationLoop(now=>{const dt=Math.min((now-last)/1000,.04);last=now;if(document.hidden)return;
  if(!paused){elapsed+=dt;for(const c of coins){c.pivot.position.y-=c.speed*dt;c.pivot.position.x=(c.lane*2-1)*(halfWidth+.8)+Math.sin(elapsed*.5+c.phase)*.25;c.pivot.rotation.x+=c.spinX*dt;c.pivot.rotation.y+=c.spinY*dt;c.pivot.rotation.z+=.12*dt;if(c.pivot.position.y < -6){c.pivot.position.y=6+Math.random()*2;c.lane=Math.random();}}}
  renderer.render(scene,camera);
 });
}
startCoins().catch(error=>{console.error('Bitcoin scene could not load',error);motion.hidden=true;document.body.dataset.coins='unavailable';});
