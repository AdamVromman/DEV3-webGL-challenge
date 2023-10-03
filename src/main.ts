import * as THREE from "three";
import {fragmentShader, vertexShader} from './shaders.js';

let camera: THREE.Camera, scene: THREE.Scene, light, renderer: THREE.WebGLRenderer, torus: THREE.Object3D<THREE.Object3DEventMap>, plane;

const torusses: THREE.Object3D<THREE.Object3DEventMap>[] = [];

let playing = true;
let trackMouse = true;

let WIDTH = 0;
let HEIGHT = 0;

let mouseX: number, mouseY: number;

const uniforms = {
  iResolution: {value: new THREE.Vector3()},
  iTime: {value: 0},
  iMouse: {value: new THREE.Vector4()}
}

const trackingText = document.getElementById("tracking");
const playingText = document.getElementById("playing");
const directionText = document.getElementById("direction");
const timeText = document.getElementById("time");

const changeText = (element: HTMLElement | null, text: string) => 
{
  if (element)
  {
    element.innerHTML = text;
  }
}

const normalizeMouseMovement = (x: number, y: number) => {
  if (window)
  {
    mouseX = x - window.innerWidth / 2;
    mouseY = -y + window.innerHeight / 2;
    changeText(directionText, `${mouseX}, ${mouseY}`);
  }
}

const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;

const addNewTorus = (distance: number = -3000) => {

  const geometry = new THREE.TorusGeometry( 100, 1, 10, 100 ); 
  const material = new THREE.MeshBasicMaterial( { color: 0xffffff } ); 
  torus = new THREE.Mesh( geometry, material ); 
  torus.position.z = distance;
  torus.position.x = mouseX;
  torus.position.y = mouseY;

  scene.add(torus);
  return torus;
}

const playLoop = () => {
  playing = true;
  changeText(trackingText, "playing");
  requestAnimationFrame(animate);
}

const stopLoop = () => {
  changeText(trackingText, "stopped");
  playing = false;
}

const init = () => {
  const container = document.getElementById("container");
  const canvas = document.getElementById("canvas");
  
  if (window && container && canvas) {
    //CONTAINER
    WIDTH = window.innerWidth; 
    HEIGHT = window.innerHeight;
    const aspectRatio = WIDTH / HEIGHT;

    //RENDERER


    renderer = new THREE.WebGLRenderer({canvas, antialias: true,});
    renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( WIDTH, HEIGHT );
    container.appendChild(renderer.domElement);

    //SCENE

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    //CAMERA

    const POV = 90;
    const near = 1;
    const far = 10000;
    

    camera = new THREE.PerspectiveCamera(POV, aspectRatio, near, far);
    camera.position.x = 0;
    camera.position.z = 200;

    scene.add(camera);

    //BACKGROUND

    const geometry = new THREE.PlaneGeometry(WIDTH * 10, HEIGHT * 10);
    //const texture = new THREE.MeshBasicMaterial( { color: 0xff00ff } );
    const texture = new  THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true
    })

    plane = new THREE.Mesh(geometry, texture);
    plane.position.z = -3000;
    scene.add(plane);

    


    //LIGHT
    
    light = new THREE.AmbientLight();

    scene.add(light);
    
    //TORUSSES

    for (let x = 0; x < 20; x++)
    {
      const d = 3000 / 20 * -x;
      torusses.push(addNewTorus(d));
    }


  }
}



const render = () => {
  renderer.render(scene, camera);
}



const animate = (time: number) => {

  const loop = Math.floor(time / 10) / 100;
  console.log(loop);

  changeText(timeText, `${loop.toFixed(2)}s`);

  if (loop % 1 === 0)
  {
    torusses.push(addNewTorus());
     

  }
  torusses.forEach((t) => {
    if (t.position.z > 200)
    {
      torusses.shift();
      scene.remove(t);
    }
    t.position.z += 2;
    const x = lerp(mouseX, 0, (t.position.z + 3000) / 3000);
    const y = lerp(mouseY, 0, (t.position.z + 3000) / 3000);
    t.position.x = x;
    t.position.y = y;
    
  })

  if (!playing)
  {
    return ;
  }

  uniforms.iResolution.value.set(WIDTH, HEIGHT, 1);
  uniforms.iTime.value = loop;
  uniforms.iMouse.value.set(-mouseX, -mouseY, 0, 0)

  
  requestAnimationFrame(animate);
  render()
}


init();
requestAnimationFrame(animate);

window.addEventListener("keypress", (e) => {
  if (e.isComposing || e.key === "e") {
    playing? stopLoop() : playLoop();
    
  }

  if (e.isComposing || e.key === "t") {
    trackMouse = !trackMouse;
    changeText(playingText, `${trackMouse ? "" : "not "}tracking`);
    
  }
});

window.addEventListener("mousemove", (e) => {
  if (e.pageX && e.pageY && trackMouse)
  {
    normalizeMouseMovement(e.pageX, e.pageY)
  }
})