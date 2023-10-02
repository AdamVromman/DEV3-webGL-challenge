import * as THREE from "three";

let camera: THREE.Camera, scene: THREE.Scene, light, renderer: THREE.WebGLRenderer, torus: THREE.Object3D<THREE.Object3DEventMap>;

const torusses: THREE.Object3D<THREE.Object3DEventMap>[] = [];

let playing = true;
let trackMouse = true;

let mouseX: number, mouseY: number;

const trackingText = document.getElementById("tracking");
const playingText = document.getElementById("playing");
const directionText = document.getElementById("direction");

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
    mouseX = x - window.innerWidth / 2
    mouseY = -y + window.innerHeight / 2;
    changeText(directionText, `${mouseX}, ${mouseY}`)
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
    const WIDTH = window.innerWidth; 
    const HEIGHT = window.innerHeight;
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

  const loop = Math.floor(time * 0.1) / 100;

  if (loop % 1 === 0)
  {
    torusses.push(addNewTorus());

    const deletedTorus = torusses.shift();
    if (deletedTorus)
    {
      scene.remove(deletedTorus)
    }
     

  }
  torusses.forEach((t) => {
    t.position.z += 2;
    const x = lerp(mouseX, 0, (t.position.z + 3000) / 2000);
    const y = lerp(mouseY, 0, (t.position.z + 3000) / 2000);
    t.position.x = x;
    t.position.y = y;
    
  })


  console.log(`${Math.floor(torusses[19].position.x)} ${Math.floor(torusses[19].position.y)}`);

  if (!playing)
  {
    return ;
  }

  
  requestAnimationFrame(animate)
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