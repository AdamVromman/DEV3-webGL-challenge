import * as THREE from "three";
import {backgroundFragmentShader, backgroundVertexShader, spherefragmentShader, sphereVertexShader} from './shaders.js';
import stewie from './stewie.jpg';


let camera: THREE.Camera, scene: THREE.Scene, renderer: THREE.WebGLRenderer, torus: THREE.Object3D<THREE.Object3DEventMap>, plane, sphere;

const cirlesVisible: THREE.Object3D<THREE.Object3DEventMap>[] = [];
const circlesInvisible: THREE.Object3D<THREE.Object3DEventMap>[] = [];

let playing = true;
let trackMouse = true;

let WIDTH = 0;
let HEIGHT = 0;
let TIME = 0;

let vertTurn = 0;
let horTurn = 0;
let vertKey = "none";
let horKey = "none";

let mouseX: number, mouseY: number;
const addingCycle = () => {
  const newCircle = circlesInvisible.shift();
  if (newCircle)
  {
    newCircle.position.z = -3000;
    cirlesVisible.push(newCircle);
  }
  
}

const addingInterval = setInterval(addingCycle, 1000);
let removingInterval;

const removingCycle = () => {
  const oldCircle = cirlesVisible.shift();
  if (oldCircle)
  {
    circlesInvisible.push(oldCircle);
  }
}

const timeout = setTimeout(() => {
  removingInterval = setInterval(removingCycle, 1000);
})

const backgroundUniforms = {
  iResolution: {value: new THREE.Vector3()},
  iTime: {value: 0},
  iDirection: {value: new THREE.Vector2()}
}

const textureLoader = new THREE.TextureLoader();

const sphereUniforms = {
  iResolution: {value: new THREE.Vector3()},
  iChannel0: {value: textureLoader.load(stewie)},
  iChannelResolution: {value: new Array(4)},
  iMouse: {value: new THREE.Vector4()}
};

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
  if (window) {
    const xNorm = (x - WIDTH / 2) / (WIDTH / 2)
    const yNorm = (y - HEIGHT / 2) / (HEIGHT / 2)
    
    mouseX = xNorm;
    mouseY = yNorm;
  }
}

function easeOutQuart(x: number): number {
  return 1 - Math.pow(1 - x, 4);
  }

const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;
const clamp = (a: number, min = 0, max = 1) => Math.min(max, Math.max(min, a));

const addNewTorus = (distance: number = -3000) => {

  const geometry = new THREE.TorusGeometry( 100, 1, 10, 100 ); 
  const material = new THREE.MeshBasicMaterial( { color: 0xffffff } ); 
  torus = new THREE.Mesh( geometry, material ); 
  torus.position.z = distance;
  torus.position.x = mouseX;
  torus.position.y = mouseY;
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

  mouseX = 0;
  mouseY = 0;
  
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
      uniforms: backgroundUniforms,
      vertexShader: backgroundVertexShader,
      fragmentShader: backgroundFragmentShader,
      transparent: true
    })

    plane = new THREE.Mesh(geometry, texture);
    plane.position.z = -3000;
    scene.add(plane);
    
    //TORUSSES

    for (let x = 0; x < 20; x++)
    {
      const d = 3000 / 20 * -x;
      cirlesVisible.push(addNewTorus(d));
      circlesInvisible.push(addNewTorus());
    }


    //SPHERE

    // const sphereGeom = new THREE.SphereGeometry(10, 100, 100);
    // //const sphereMaterial = new THREE.MeshBasicMaterial({color: 0xff00ff});
    // const sphereMaterial = new THREE.ShaderMaterial({
    //   uniforms: sphereUniforms,
    //   vertexShader: sphereVertexShader,
    //   fragmentShader: spherefragmentShader
    // })
    // sphere = new THREE.Mesh(sphereGeom, sphereMaterial);
    // sphere.position.z = 100;
    // sphere.position.x = 20;
    // scene.add(sphere);

  }
}



const render = () => {
  renderer.render(scene, camera);
}



const animate = () => {

  TIME++;
  switch (horKey)
  {
    case "ArrowLeft": horTurn = clamp(horTurn -= 0.01, -1, 1); break;
    case "ArrowRight": horTurn = clamp(horTurn += 0.01, -1, 1); break;
    default: 
      if (horTurn < 0)
      {
        horTurn = clamp(horTurn += 0.01, -1, 0);
      }
      if (horTurn > 0)
      {
        horTurn = clamp(horTurn -= 0.01, 0, 1);
      }
  }

  switch (vertKey)
  {
    case "ArrowUp": vertTurn = clamp(vertTurn += 0.01, -1, 1); break;
    case "ArrowDown": vertTurn = clamp(vertTurn -= 0.01, -1, 1); break;
    default: 
      if (vertTurn < 0)
      {
        vertTurn = clamp(vertTurn += 0.01, -1, 0);
      }
      if (vertTurn > 0)
      {
        vertTurn = clamp(vertTurn -= 0.01, 0, 1);
      }
      
  }

  cirlesVisible.forEach((t) => {
    t.position.z += 2.5;
    const x = lerp(600 * horTurn, 0, easeOutQuart((t.position.z + 3000) / 3200));
    const y = lerp(600 * vertTurn, 0, easeOutQuart((t.position.z + 3000) / 3200));
    t.position.x = x;
    t.position.y = y;
    scene.add(t);
    
  })

  circlesInvisible.forEach((c) => {
    scene.remove(c);
  })

  if (!playing)
  {
    return ;
  }

  backgroundUniforms.iResolution.value.set(WIDTH, HEIGHT, 1);
  backgroundUniforms.iDirection.value.set(horTurn, vertTurn);
  backgroundUniforms.iTime.value = TIME * 0.01;

  sphereUniforms.iResolution.value.set(WIDTH, HEIGHT, 1);
  
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

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight")
  {
    horKey = e.key;
  }
  if (e.key === "ArrowUp" || e.key === "ArrowDown")
  {
    vertKey = e.key;
  }
})

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight")
  {
    horKey = "none";
  }
  if (e.key === "ArrowUp" || e.key === "ArrowDown")
  {
    vertKey = "none";
  }
})