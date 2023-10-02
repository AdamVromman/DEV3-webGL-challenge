import * as THREE from "three";

let Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  pink: 0xf5986e,
  brownDark: 0x23190f,
  blue: 0x68c3c0,
};

let scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane,
  HEIGHT: number,
  WIDTH: number,
  container,
  sky: { mesh: any; },
  airplane: { mesh: any; propeller: any; },
  sea: { mesh: any; },
  hemisphereLight,
  shadowLight;

const handleWindowResize = (e: any) => {
  // update height and width of the renderer and the camera
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
};

const createScene = () => {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();

  scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

  fieldOfView = 60;
  aspectRatio = WIDTH / HEIGHT;
  nearPlane = 1;
  farPlane = 10000;

  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );

  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = 100;

  renderer = new THREE.WebGLRenderer({
    // Allow transparency to show the gradient background
    // we defined in the CSS
    alpha: true,

    // Activate the anti-aliasing; this is less performant,
    // but, as our project is low-poly based, it should be fine :)
    antialias: true,
  });

  renderer.setSize(WIDTH, HEIGHT);

  // Enable shadow rendering
  renderer.shadowMap.enabled = true;

  // Add the DOM element of the renderer to the
  // container we created in the HTML
  container = document.getElementById("world");
  if (container)
  {
    container.appendChild(renderer.domElement);
  }


  // Listen to the screen: if the user resizes it
  // we have to update the camera and the renderer size
  window.addEventListener("resize", handleWindowResize, false);
};

const createLights = () => {
  // A hemisphere light is a gradient colored light;
  // the first parameter is the sky color, the second parameter is the ground color,
  // the third parameter is the intensity of the light
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);

  // A directional light shines from a specific direction.
  // It acts like the sun, that means that all the rays produced are parallel.
  shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);

  // Set the direction of the light
  shadowLight.position.set(150, 350, 350);

  // Allow shadow casting
  shadowLight.castShadow = true;

  // define the visible area of the projected shadow
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;

  // define the resolution of the shadow; the higher the better,
  // but also the more expensive and less performant
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  scene.add(shadowLight);
  scene.add(hemisphereLight);
};

const AirPlane = function () {
  const mesh = new THREE.Object3D();

  // Create the cabin
  let geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
  let matCockpit = new THREE.MeshPhongMaterial({
    color: Colors.red,
  });
  let cockpit = new THREE.Mesh(geomCockpit, matCockpit);
  cockpit.castShadow = true;
  cockpit.receiveShadow = true;
  mesh.add(cockpit);

  // Create the engine
  let geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
  let matEngine = new THREE.MeshPhongMaterial({
    color: Colors.white,
  });
  let engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 40;
  engine.castShadow = true;
  engine.receiveShadow = true;
  mesh.add(engine);

  // Create the tail
  let geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
  let matTailPlane = new THREE.MeshPhongMaterial({
    color: Colors.red,
  });
  let tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
  tailPlane.position.set(-35, 25, 0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  mesh.add(tailPlane);

  // Create the wing
  let geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
  let matSideWing = new THREE.MeshPhongMaterial({
    color: Colors.red,
  });
  let sideWing = new THREE.Mesh(geomSideWing, matSideWing);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  mesh.add(sideWing);

  // propeller
  let geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
  let matPropeller = new THREE.MeshPhongMaterial({
    color: Colors.brown,
  });
  const propeller = new THREE.Mesh(geomPropeller, matPropeller);
  propeller.castShadow = true;
  propeller.receiveShadow = true;

  // blades
  let geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
  let matBlade = new THREE.MeshPhongMaterial({
    color: Colors.brownDark,
  });

  let blade = new THREE.Mesh(geomBlade, matBlade);
  blade.position.set(8, 0, 0);
  blade.castShadow = true;
  blade.receiveShadow = true;
  propeller.add(blade);
  propeller.position.set(50, 0, 0);
  mesh.add(propeller);

  return { mesh: mesh, propeller: propeller };
};

function createPlane() {
  airplane = AirPlane();
  airplane.mesh.scale.set(0.25, 0.25, 0.25);
  airplane.mesh.position.y = 100;
  scene.add(airplane.mesh);
}

// First let's define a Sea object :
const Sea = function () {
  // create the geometry (shape) of the cylinder;
  // the parameters are:
  // radius top, radius bottom, height, number of segments on the radius, number of segments vertically
  let geom = new THREE.CylinderGeometry(1000, 1000, 800, 400, 100);

  // rotate the geometry on the x axis
  geom.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

  // create the material
  let mat = new THREE.MeshPhongMaterial({
    color: Colors.blue,
    transparent: true,
    opacity: 0.6,
  });

  // To create an object in Three.js, we have to create a mesh
  // which is a combination of a geometry and some material
  const mesh = new THREE.Mesh(geom, mat);

  // Allow the sea to receive shadows
  mesh.receiveShadow = true;

  return { mesh: mesh };
};

const createSea = () => {
  sea = Sea();

  // push it a little bit at the bottom of the scene
  sea.mesh.position.y = -1000;

  // add the mesh of the sea to the scene
  scene.add(sea.mesh);
};

const Cloud = function () {
  // Create an empty container that will hold the different parts of the cloud
  const mesh = new THREE.Object3D();

  // create a cube geometry;
  // this shape will be duplicated to create the cloud
  let geom = new THREE.BoxGeometry(80, 80, 80);

  // create a material; a simple white material will do the trick
  let mat = new THREE.MeshPhongMaterial({
    color: Colors.white,
  });

  // duplicate the geometry a random number of times
  let nBlocs = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < nBlocs; i++) {
    // create the mesh by cloning the geometry
    let m = new THREE.Mesh(geom, mat);

    // set the position and the rotation of each cube randomly
    m.position.x = i * 15;
    m.position.y = Math.random() * 10;
    m.position.z = Math.random() * 10;
    m.rotation.z = Math.random() * Math.PI * 2;
    m.rotation.y = Math.random() * Math.PI * 2;

    // set the size of the cube randomly
    let s = 0.1 + Math.random() * 0.9;
    m.scale.set(s, s, s);

    // allow each cube to cast and to receive shadows
    m.castShadow = true;
    m.receiveShadow = true;

    // add the cube to the container we first created
    mesh.add(m);

    return { mesh: mesh };
  }
};

// Define a Sky Object
const Sky = function () {
  // Create an empty container
  const mesh = new THREE.Object3D();

  // choose a number of clouds to be scattered in the sky
  const nClouds = 200;

  // To distribute the clouds consistently,
  // we need to place them according to a uniform angle
  let stepAngle = (Math.PI * 2) / nClouds;

  // create the clouds
  for (let i = 0; i < nClouds; i++) {
    let c = Cloud();

    // set the rotation and the position of each cloud;
    // for that we use a bit of trigonometry
    let a = stepAngle * i; // this is the final angle of the cloud
    let h = 750 + Math.random() * 200; // this is the distance between the center of the axis and the cloud itself

    if (c)
    {
 // Trigonometry!!! I hope you remember what you've learned in Math :)
    // in case you don't:
    // we are simply converting polar coordinates (angle, distance) into Cartesian coordinates (x, y)
    c.mesh.position.y = Math.sin(a) * h;
    c.mesh.position.x = Math.cos(a) * h;

    // rotate the cloud according to its position
    c.mesh.rotation.z = a + Math.PI / 2;

    // for a better result, we position the clouds
    // at random depths inside of the scene
    c.mesh.position.z = -400 - Math.random() * 400;

    // we also set a random scale for each cloud
    let s = 1 + Math.random() * 2;
    c.mesh.scale.set(s, s, s);

    // do not forget to add the mesh of each cloud in the scene
    mesh.add(c.mesh);
    }

   
  }

  return { mesh: mesh };
};

const createSky = () => {
  sky = Sky();
  sky.mesh.position.y = -600;
  scene.add(sky.mesh);
};

function updatePlane() {
  // let's move the airplane between -100 and 100 on the horizontal axis,
  // and between 25 and 175 on the vertical axis,
  // depending on the mouse position which ranges between -1 and 1 on both axes;
  // to achieve that we use a normalize function (see below)

  var targetX = normalize(mousePos.x, -1, 1, -100, 100);
  var targetY = normalize(mousePos.y, -1, 1, 25, 175);

  // update the airplane's position
  airplane.mesh.position.y = targetY;
  airplane.mesh.position.x = targetX;
  airplane.propeller.rotation.x += 0.3;
}

function normalize(v: number, vmin: number, vmax: number, tmin: number, tmax: number) {
  var nv = Math.max(Math.min(v, vmax), vmin);
  var dv = vmax - vmin;
  var pc = (nv - vmin) / dv;
  var dt = tmax - tmin;
  var tv = tmin + pc * dt;
  return tv;
}

const loop = () => {
  // Rotate the propeller, the sea and the sky
  airplane.propeller.rotation.x += 0.3;
  sea.mesh.rotation.z += 0.005;
  sky.mesh.rotation.z += 0.01;

  updatePlane();

  // render the scene
  renderer.render(scene, camera);

  // call the loop function again
  requestAnimationFrame(loop);
};

window.addEventListener("load", init, false);

let mousePos = { x: 0, y: 0 };

// now handle the mousemove event

function handleMouseMove(event: { clientX: number; clientY: number; }) {
  // here we are converting the mouse position value received
  // to a normalized value varying between -1 and 1;
  // this is the formula for the horizontal axis:

  let tx = -1 + (event.clientX / WIDTH) * 2;

  // for the vertical axis, we need to inverse the formula
  // because the 2D y-axis goes the opposite direction of the 3D y-axis

  let ty = 1 - (event.clientY / HEIGHT) * 2;
  mousePos = { x: tx, y: ty };
}

function init() {
  // set up the scene, the camera and the renderer
  createScene();

  // add the lights
  createLights();

  // add the objects
  createPlane();
  createSea();
  createSky();

  document.addEventListener("mousemove", handleMouseMove, false);

  // start a loop that will update the objects' positions
  // and render the scene on each frame
  loop();
}