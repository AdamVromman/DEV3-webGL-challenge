import * as THREE from "three";
import {
	backgroundFragmentShader,
	backgroundVertexShader,
} from "./shaders.js";
import { clamp, easeOutQuart, lerp } from "./utilities.js";
import stewie from "./stewie.jpg";

let 
	camera: THREE.Camera,
	scene: THREE.Scene,
	renderer: THREE.WebGLRenderer,
	torus: THREE.Object3D<THREE.Object3DEventMap>,
	plane: THREE.Object3D<THREE.Object3DEventMap>,
	
	video: HTMLVideoElement | null,
	ambientLight,
	spotLight;

const cirlesVisible: THREE.Object3D<THREE.Object3DEventMap>[] = [];
const circlesInvisible: THREE.Object3D<THREE.Object3DEventMap>[] = [];
const spheres: THREE.Object3D<THREE.Object3DEventMap>[] = [];

let
	vertTurn = 0,
	horTurn = 0,
	vertKey = "none",
	horKey = "none";

let 
	mouseX = 0, 
	mouseY = 0, 
	playing = true, 
	trackMouse = true, 
	WIDTH = 0, 
	HEIGHT = 0, 
	TIME = 0;

const addingCycle = () => {
	const newCircle = circlesInvisible.shift();
	if (newCircle) {
		newCircle.position.z = -3000;
		cirlesVisible.push(newCircle);
	}
};

const addingInterval = setInterval(addingCycle, 1000);
let removingInterval;

const removingCycle = () => {
	const oldCircle = cirlesVisible.shift();
	if (oldCircle) {
		circlesInvisible.push(oldCircle);
	}
};

const timeout = setTimeout(() => {
	removingInterval = setInterval(removingCycle, 1000);
});

const backgroundUniforms = {
	iResolution: { value: new THREE.Vector3() },
	iTime: { value: 0 },
	iDirection: { value: new THREE.Vector2() },
};
const trackingText = document.getElementById("tracking");
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

const addNewTorus = (distance: number = -3000) => {
	const geometry = new THREE.TorusGeometry(100, 1, 10, 100);
	const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
	torus = new THREE.Mesh(geometry, material);
	torus.position.z = distance;
	torus.position.x = mouseX;
	torus.position.y = mouseY;
	return torus;
};

const playLoop = () => {
	playing = true;
	changeText(trackingText, "playing");
	requestAnimationFrame(animate);
};

const stopLoop = () => {
	changeText(trackingText, "stopped");
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
		scene.background = new THREE.Color(0x000000);



		//CAMERA
		const POV = 90;
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



		//LIGHT
		spotLight = new THREE.SpotLight(0xffffff, 100);
		spotLight.position.set(-100, -100, 500);
		spotLight.angle = Math.PI / 6;
		spotLight.penumbra = 0.5;
		spotLight.decay = 1;
		spotLight.distance = 0;

		ambientLight = new THREE.AmbientLight(0xffffff, 10); // soft white light
		ambientLight.position.z = 500;

		scene.add(spotLight);
		scene.add(ambientLight);



		//CIRCLES
		for (let x = 0; x < 20; x++) {
			const d = (3000 / 20) * -x;
			cirlesVisible.push(addNewTorus(d));
			circlesInvisible.push(addNewTorus());
		}



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
		const sphereGeom = new THREE.SphereGeometry(40, 100, 100);
		const sphereMaterial = new THREE.MeshPhysicalMaterial({
			metalness: 0.8,
			roughness: 0.4,
			color: 0xeba834,
			map: sphereTexture,
			reflectivity: 1.0,
			emissive: 0x000000,

		});
		for (let y = 0; y < 5; y++)
		{
			const sphere = new THREE.Mesh(sphereGeom, sphereMaterial);
			const randomX = -50 + Math.random() * 100;
			const randomY = -50 + Math.random() * 100;
			sphere.position.z = 100;
			sphere.position.x = randomX;
			sphere.position.y = randomY;
			sphere.rotateY(-2);
			spheres.push(sphere);
		}
		spheres.forEach((s) => {
			scene.add(s);
		});
				
	}
};

const render = () => {
	renderer.render(scene, camera);
};

const animate = () => {
	TIME++;
	switch (horKey) {
	case "ArrowLeft":
		horTurn = clamp((horTurn -= 0.01), -1, 1);
		break;
	case "ArrowRight":
		horTurn = clamp((horTurn += 0.01), -1, 1);
		break;
	default:
		if (horTurn < 0) {
			horTurn = clamp((horTurn += 0.01), -1, 0);
		}
		if (horTurn > 0) {
			horTurn = clamp((horTurn -= 0.01), 0, 1);
		}
	}

	switch (vertKey) {
	case "ArrowUp":
		vertTurn = clamp((vertTurn += 0.01), -1, 1);
		break;
	case "ArrowDown":
		vertTurn = clamp((vertTurn -= 0.01), -1, 1);
		break;
	default:
		if (vertTurn < 0) {
			vertTurn = clamp((vertTurn += 0.01), -1, 0);
		}
		if (vertTurn > 0) {
			vertTurn = clamp((vertTurn -= 0.01), 0, 1);
		}
	}

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
	backgroundUniforms.iDirection.value.set(horTurn, vertTurn);
	backgroundUniforms.iTime.value = TIME * 0.01;
	requestAnimationFrame(animate);
	render();
};

init();
requestAnimationFrame(animate);

window.addEventListener("keypress", (e) => {
	if (e.isComposing || e.key === "e") {
		playing ? stopLoop() : playLoop();
	}

	if (e.isComposing || e.key === "t") {
		trackMouse = !trackMouse;
		changeText(playingText, `${trackMouse ? "" : "not "}tracking`);
	}
});

window.addEventListener("mousemove", (e) => {
	if (e.pageX && e.pageY && trackMouse) {
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
