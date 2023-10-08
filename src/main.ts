import * as THREE from "three";
import {
	backgroundFragmentShader,
	backgroundVertexShader,
} from "./shaders.js";
import { clamp, easeOutQuart, lerp } from "./utilities.js";
import stewie from "./stewie.jpg";

const cirlesVisible: THREE.Object3D<THREE.Object3DEventMap>[] = [];
const circlesInvisible: THREE.Object3D<THREE.Object3DEventMap>[] = [];
const spheres: THREE.Object3D<THREE.Object3DEventMap>[] = [];


const backgroundUniforms = {
	iResolution: { value: new THREE.Vector3() },
	iTime: { value: 0 },
	iDirection: { type: "v2f", value: new THREE.Vector2() },
};

const sphereValues = [
	{x: 50, y: 20, z: 70, s: -0.8, ry: 1},
	{x: 20, y: 20, z: -40, s: 0.2, ry: 2},
	{x: 50, y: -30, z: 30, s: -0.1, ry: 2},
	{x: -30, y: -40, z: 50, s: -0.4, ry: -3.5},
	{x: 0, y: 0, z: 10, s: -0.93, ry: -3.5},
	{x: 30, y: 40, z: 30, s: -0.9, ry: -3.5},
	{x: 10, y: -40, z: 60, s: -0.84, ry: -3.5},
];

let 
	camera: THREE.PerspectiveCamera,
	cubeCamera: THREE.CubeCamera,
	scene: THREE.Scene,
	renderer: THREE.WebGLRenderer,
	torus: THREE.Object3D<THREE.Object3DEventMap>,
	plane: THREE.Object3D<THREE.Object3DEventMap>,
	group: THREE.Object3D<THREE.Object3DEventMap>,
	
	
	video: HTMLVideoElement | null,
	ambientLight,
	directionalLight: THREE.Object3D<THREE.Object3DEventMap>;



let
	vertTurn = 0.0,
	horTurn = 0.0,
	vertKey = "none",
	horKey = "none";

let 
	mouseX = 0, 
	mouseY = 0, 
	playing = true, 
	WIDTH = 0, 
	HEIGHT = 0, 
	TIME = 0;

const addingCycle = () => {
	if (playing)
	{
		const newCircle = circlesInvisible.shift();
		if (newCircle) {
			newCircle.position.z = -3000;
			cirlesVisible.push(newCircle);
		}
	}
	
};

const addingInterval = setInterval(addingCycle, 1000);
let removingInterval;

const removingCycle = () => {
	if (timeout)
	{
		clearInterval(timeout);
	}
	if (playing)
	{
		const oldCircle = cirlesVisible.shift();
		if (oldCircle) {
			circlesInvisible.push(oldCircle);
		}
	}
	
};

const timeout = setTimeout(() => {
	removingInterval = setInterval(removingCycle, 1000);
});



const playingText = document.getElementById("playing");
const directionText = document.getElementById("direction");
const timeText = document.getElementById("time");

const changeText = (element: HTMLElement | null, text: string) => {
	if (element) {
		element.innerHTML = text;
	}
};

const getCameraFeed = () => {
	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia ) {

		const constraints = { video: { width: 1000, height: 1000, facingMode: "user" } };

		navigator.mediaDevices.getUserMedia( constraints ).then( function ( stream ) {

			if (video)
			{
				video.srcObject = stream;
				video.play();
			}

		} ).catch( function ( error ) {

			console.error( "Unable to access the camera/webcam.", error );
			return false;

		} );

	} else {

		console.error( "MediaDevices interface not available." );
		return false;

	}
 
	return true;
};

const normalizeMouseMovement = (x: number, y: number) => {
	if (window) {
		const xNorm = (x - WIDTH / 2) / (WIDTH / 2);
		const yNorm = (y - HEIGHT / 2) / (HEIGHT / 2);

		mouseX = xNorm;
		mouseY = yNorm;
	}
};

function onWindowResize() {

	if (window)
	{
		WIDTH = window.innerWidth;
		HEIGHT = window.innerHeight;
	}
	camera.updateProjectionMatrix();

	renderer.setSize( WIDTH, HEIGHT );

}

const addNewCircle = (distance: number = -3000) => {
	const geometry = new THREE.TorusGeometry(100, 5, 10, 100);
	const material = new THREE.MeshPhysicalMaterial({ 
		color: 0x822315,
		roughness: 0.1,
		metalness: 1.0
	});
	torus = new THREE.Mesh(geometry, material);
	torus.position.z = distance;
	torus.position.x = mouseX;
	torus.position.y = mouseY;
	return torus;
};

const playLoop = () => {
	playing = true;
	changeText(playingText, "playing");
	requestAnimationFrame(animate);
};

const stopLoop = () => {
	changeText(playingText, "stopped");
	playing = false;
};

const init = () => {
	const container = document.getElementById("container");
	const canvas = document.getElementById("canvas");
	video = document.getElementById("video") as HTMLVideoElement;

	if (window && container && canvas && video) {

		//CONTAINER
		WIDTH = window.innerWidth;
		HEIGHT = window.innerHeight;



		//RENDERER
		renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(WIDTH, HEIGHT);
		container.appendChild(renderer.domElement);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;



		//SCENE
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0xffffff);



		//CAMERA
		const POV = 60;
		const near = 1;
		const far = 10000;

		camera = new THREE.PerspectiveCamera(POV, WIDTH /  HEIGHT, near, far);
		camera.position.x = 0;
		camera.position.z = 200;

		scene.add(camera);



		//BACKGROUND
		const geometry = new THREE.PlaneGeometry(WIDTH * 10, HEIGHT * 10);
		const texture = new THREE.ShaderMaterial({
			uniforms: backgroundUniforms,
			vertexShader: backgroundVertexShader,
			fragmentShader: backgroundFragmentShader,
			transparent: true,
		});

		plane = new THREE.Mesh(geometry, texture);
		plane.position.z = -3000;
		scene.add(plane);

		scene.fog = new THREE.Fog( 0x000000, 1500, 3000 );



		//LIGHT
		directionalLight = new THREE.DirectionalLight(0xffffff, 20);
		directionalLight.position.set(0, 0, 500);

		const light1 = new THREE.DirectionalLight(0xffffff, 20);
		light1.position.set(-200, -200, 300);
		scene.add(light1);

		const light2 = new THREE.DirectionalLight(0xffffff, 20);
		light2.position.set(200, 400, 100);
		scene.add(light2);


		ambientLight = new THREE.AmbientLight(0xffffff, 10); // soft white light

		scene.add(directionalLight);
		scene.add(ambientLight);



		//CIRCLES
		for (let x = 0; x < 20; x++) {
			const d = (3000 / 20) * -x;
			cirlesVisible.push(addNewCircle(d));
			circlesInvisible.push(addNewCircle());
		}



		const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
		cubeRenderTarget.texture.type = THREE.HalfFloatType;
		cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);

		//SPHERE
		const webcamAvailable = getCameraFeed();
		let sphereTexture;
		if (webcamAvailable)
		{
			sphereTexture = new THREE.VideoTexture( video );
		} else 
		{
			const textureLoader = new THREE.TextureLoader();
			sphereTexture = textureLoader.load(stewie);
		}

		sphereTexture.colorSpace = THREE.SRGBColorSpace;
		const sphereGeom = new THREE.IcosahedronGeometry(40, 100);
		const sphereMaterial = new THREE.MeshPhysicalMaterial({
			metalness: 1.0,
			roughness: 0.1,
			color: 0xffbb00,
			envMap: cubeRenderTarget.texture,
			map: sphereTexture,
			emissive: 0x000000,
			emissiveIntensity: 10,
			reflectivity: 0.5,
			fog: false
		});

		

		group = new THREE.Group();
		sphereValues.forEach((value) => {
			const sphere = new THREE.Mesh(sphereGeom, sphereMaterial);
			sphere.receiveShadow = true;
			sphere.scale.set(1 + value.s, 1 + value.s,  1 + value.s);
			sphere.position.z = value.z;
			sphere.position.x = value.x;
			sphere.position.y = value.y;
			sphere.rotation.y = value.ry;
			spheres.push(sphere);
			group.add(sphere);
		});
		scene.add(group);
				
	}
};

const render = () => {
	renderer.render(scene, camera);
};

const animate = () => {
	TIME++;
	changeText(timeText, `${TIME / 100}s`);
	switch (horKey) {
	case "ArrowLeft":
		horTurn = Math.round(clamp((horTurn -= 0.01), -1, 1) * 100) / 100;
		break;
	case "ArrowRight":
		horTurn = Math.round(clamp((horTurn += 0.01), -1, 1) * 100) / 100;
		break;
	default:
		if (horTurn < 0) {
			horTurn = Math.round(clamp((horTurn += 0.01), -1, 0) * 100) / 100;
		}
		if (horTurn > 0) {
			horTurn = Math.round(clamp((horTurn -= 0.01), 0, 1) * 100) / 100;
		}
	}

	switch (vertKey) {
	case "ArrowUp":
		vertTurn = Math.round(clamp((vertTurn += 0.01), -1, 1) * 100) / 100;
		break;
	case "ArrowDown":
		vertTurn = Math.round(clamp((vertTurn -= 0.01), -1, 1) * 100) / 100;
		break;
	default:
		if (vertTurn < 0) {
			vertTurn = Math.round(clamp((vertTurn += 0.01), -1, 0) * 100) / 100;
		}
		if (vertTurn > 0) {
			vertTurn = Math.round(clamp((vertTurn -= 0.01), 0, 1) * 100) / 100;
		}
	}
	changeText(directionText,`${horTurn}, ${vertTurn}`);
	directionalLight.position.x = -horTurn * 300;
	directionalLight.position.y = -vertTurn * 300;

	cirlesVisible.forEach((t) => {
		t.position.z += 2.5;
		const x = lerp(
			600 * horTurn,
			0,
			easeOutQuart((t.position.z + 3000) / 3200)
		);
		const y = lerp(
			600 * vertTurn,
			0,
			easeOutQuart((t.position.z + 3000) / 3200)
		);
		t.position.x = x;
		t.position.y = y;
		scene.add(t);
	});

	circlesInvisible.forEach((c) => {
		scene.remove(c);
	});

	if (!playing) {
		return;
	}

	backgroundUniforms.iResolution.value.set(WIDTH, HEIGHT, 1);
	backgroundUniforms.iDirection.value.set(horTurn / 5, vertTurn / 5);
	backgroundUniforms.iTime.value = TIME * 0.01;
	
	directionalLight.position.set(mouseX * WIDTH, -mouseY * HEIGHT, 500);
	group.rotation.y = TIME / 100;
	spheres.forEach((s, i) => {
		s.rotation.y = -TIME / 100 + 1.5;

	});

	cubeCamera.update(renderer, scene);
	requestAnimationFrame(animate);
	render();
};

init();
requestAnimationFrame(animate);

window.addEventListener("keypress", (e) => {
	if (e.isComposing || e.key === "e") {
		playing ? stopLoop() : playLoop();
	}
});

window.addEventListener("mousemove", (e) => {
	if (e.pageX && e.pageY) {
		normalizeMouseMovement(e.pageX, e.pageY);
	}
});

window.addEventListener("keydown", (e) => {
	if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
		horKey = e.key;
	}
	if (e.key === "ArrowUp" || e.key === "ArrowDown") {
		vertKey = e.key;
	}
});

window.addEventListener("keyup", (e) => {
	if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
		horKey = "none";
	}
	if (e.key === "ArrowUp" || e.key === "ArrowDown") {
		vertKey = "none";
	}
});

window.addEventListener( "resize", onWindowResize );

window.addEventListener("blur", () => {
	stopLoop();
});

window.addEventListener("focus", () => {
	playLoop();
});
