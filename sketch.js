// IMPORTS note: had to manually fix paths of imports and their imports
import * as THREE from './node_modules/three/build/three.module.js';										// imports threeJS
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js'						// import GLTFLoader for loading from GLTF (Exporting from Blender)
import { RGBELoader } from './node_modules/three/examples/jsm/loaders/RGBELoader.js';						// imports RGBELoader for loading HDR file to improve lighting
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';				// imports OrbitControls to have orbiting camera controls with mouse
import { RenderPass } from './node_modules/three/examples/jsm/postprocessing/RenderPass.js';				// imports RenderPass for use in creating Glow Effect
import { EffectComposer } from './node_modules/three/examples/jsm/postprocessing/EffectComposer.js'
import { UnrealBloomPass } from './node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from './node_modules/three/examples/jsm/postprocessing/ShaderPass.js'
import { Vector2 } from './node_modules/three/build/three.module.js';
import { GUI } from './node_modules/dat.gui/build/dat.gui.module.js';


// Creating Three.js Scene and Camera
const scene = new THREE.Scene();																			// creates a new Scene object 
scene.background = new THREE.Color(0xeafdff  );																// sets scene's background color to white
const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );		// creates a new perspective camera (fov, aspect, near, far)
camera.position.z = 5;																						// zooms out the camera 5 in the z direction (so we are not inside our objects)
scene.add(camera);


// Adding HDR Environment (High Dynamic Range image file to improve lighting)
new RGBELoader()
    .setPath('assets/')
    .load('venice_sunset_1k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;

    });

// Creating and setting up light
const ambientLight = new THREE.AmbientLight( 0xffffff, 6); 												// creates new ambient light (bright white)
camera.add( ambientLight );																					// adds light to the scene
const directLight = new THREE.DirectionalLight(0xffffff, 0);
directLight.position.set(2, 0, 0);
camera.add(directLight);

// Setting up Renderer (WebGL)
const renderer = new THREE.WebGLRenderer( {antialias:true} );												// creates a new WebGL Renderer (to render to browser)
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );													// sets renderer size to window width and height
document.body.appendChild( renderer.domElement );															// appends renderer to DOM (?)
//renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.setClearColor(0x000000, 0.0);

// Adding orbit controls (for mouse control of camera)
const controls = new OrbitControls( camera, renderer.domElement );											// creates orbit controls (camera, renderer)


// Audio
// create an AudioListener and add it to the camera
const listener = new THREE.AudioListener();
camera.add( listener );

// create a global audio source
const sound = new THREE.Audio( listener );

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load( 'audio/CYGNUSFINAL.wav', function( buffer ) {
	sound.setBuffer( buffer );
	sound.setLoop( true );
	sound.setVolume( 0.5 );
	//sound.play();
});

let isPlaying = false;
document.addEventListener("keydown", onDocumentKeyDown, false);
	function onDocumentKeyDown(event) {
    var keyCode = event.which;
    if (keyCode == 32) {		// 32 -> space bar
		if(isPlaying) {
			sound.pause();
			isPlaying = false;
		}
		else {
			sound.play();
			isPlaying = true;
		}
		
    } 

};

// create an AudioAnalyser, passing in the sound and desired fftSize
const analyser = new THREE.AudioAnalyser( sound, 2048  );


// get the average frequency of the sound
const data = analyser.getAverageFrequency();
console.log(analyser.analyser.frequencyBinCount);
var bufferLength = analyser.analyser.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength);
var testAnalyser = analyser.analyser;
console.log(testAnalyser.getByteTimeDomainData(dataArray));
//console.log(data);

const format = ( renderer.capabilities.isWebGL2 ) ? THREE.RedFormat : THREE.LuminanceFormat;
let uniforms
uniforms = {

	tAudioData: { value: new THREE.DataTexture( analyser.data, 128 / 2, 1, format ) }

};


// Creating a basic box
const geometryCube = new THREE.BoxGeometry(.1,.1,.1   );																	// creates a new box geometry
const materialCube = new THREE.MeshBasicMaterial( { color: 0xfdf7ff } );										// creates a new material with color green
const cube = new THREE.Mesh( geometryCube, materialCube );															// creates a cube from a mesh of the box geometry and material
scene.add( cube );																							// adds cube mesh to the scene
cube.translateY(1);		
cube.translateX(-.24)																				

// Setting up and Loading in GLTF files from Blender
const loader = new GLTFLoader();																			// creates a new GLTFLoader 
let tower;																									// creates model variable

loader.load( './assets/tower.gltf', function ( gltf ) {													// promise to load in gltf file
	tower = gltf.scene;																						// sets model variable to gltf.scene (model)
	scene.add( gltf.scene );																				// adds model to the scene
	tower.rotateY(-.25);

}, undefined, function ( error ) {																			// sends error if fails to load model

	console.error( error );

} );


if(tower) tower.rotateY(-1);	







// Sphere
const sphereGeometry = new THREE.SphereGeometry( .2, 6  , 6 );
const wireframe = new THREE.EdgesGeometry(sphereGeometry);
//const sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xadd8e6 } );
const sphereMaterial = new THREE.LineBasicMaterial({ color: 0xadd8e6 });

const sphere = new THREE.LineSegments(wireframe, sphereMaterial);
scene.add( sphere );
sphere.translateY(1);
sphere.translateZ(0);
sphere.translateX(-.24)


console.log(sphere.position.z)

// Adds a directional light that comes off of the mana sphere and matches the same light blue color
/*
const directLight2 = new THREE.DirectionalLight(0xadd8e6, 1.2);
directLight.position.set(sphere.position.x, sphere.position.y, sphere.position.z);
camera.add(directLight2);
*/


/*
const points = [];
points.push( new THREE.Vector3( - 10, 0, 0 ) );
points.push( new THREE.Vector3( 0, 10, 0 ) );
points.push( new THREE.Vector3( 10, 0, 0 ) );

const geometry = new THREE.BufferGeometry().setFromPoints( points );
const material = new THREE.MeshBasicMaterial( { color: 0xadd8e6 } );
const line = new THREE.Line( geometry, material );
scene.add( line );


const curvePoints = [];
curvePoints.push( new THREE.Vector3( - 10, 0, 0 ) );
curvePoints.push( new THREE.Vector3( 0, 10, 0 ) );
curvePoints.push( new THREE.Vector3( 10, 0, 0 ) );

console.log(curvePoints[1])

const linecurve = new THREE.LineCurve3(curvePoints[0],curvePoints[1]);
*/

const torusGeometry = new THREE.TorusGeometry( 4, .15, 4, 8 );
const torusMaterial = new THREE.MeshBasicMaterial( { color: 0xb9b9b9 } );



const torus = new THREE.Mesh( torusGeometry, torusMaterial );

scene.add( torus );
torus.rotateX(2);
torus.rotateZ(0);
torus.translateX(-.3)
torus.translateY(.3)



const gui = new GUI()

// Creating a GUI and a subfolder.


var palette = {
	background_color: '#eafdff', // CSS string
	torus_color: '#b9b9b9', // CSS string
	sphere_color: '#add8e6', // CSS string
	cube_color: '#fdf7ff', // CSS string
  };
  gui.addColor(palette, 'background_color').onChange(() => {
	scene.background = new THREE.Color(Number(palette.background_color.toString().replace('#', '0x')));	
  });
  
  gui.addColor(palette, 'torus_color').onChange(() => {
	torus.material.color.setHex(Number(palette.torus_color.toString().replace('#', '0x')))
  });

  gui.addColor(palette, 'sphere_color').onChange(() => {
	sphere.material.color.setHex(Number(palette.sphere_color.toString().replace('#', '0x')))
  });

  gui.addColor(palette, 'cube_color').onChange(() => {
	cube.material.color.setHex(Number(palette.cube_color.toString().replace('#', '0x')))
  });

 
 
  

// Constantly animates
function animate() {
	requestAnimationFrame( animate );
	//renderer.render( scene, camera );
	//if (tower) tower.rotation.y += 0.01;
	dataArray = analyser.getFrequencyData();
	  //console.log(dataArray);
	for(var i = 0 ; i < 1 ; i++) {
		sphere.scale.set(dataArray[i] / 160 + .6, dataArray[i] / 160 + .6, dataArray[i] / 160     + .6  );
	}
	for(var i = 700 ; i < 710         ; i++) {
		torus.scale.set(dataArray[i] / 1000 + .6, dataArray[i] / 1000 + .6, dataArray[i] / 1000      + .6  );
	}

	//sphere.scale.set(analyser.getAverageFrequency()/100 + 0.2 , analyser.getAverageFrequency()/100 + 0.2,analyser.getAverageFrequency()/100 + 0.2);
	//console.log(analyser.getData())
	//console.log(analyser.data);
	//uniforms.tAudioData.value.needsUpdate = true;
	//torus.rotateY(.004);
	cube.rotateY(.01 )
	cube.rotateZ(.01 )
	renderer.render(scene, camera);

}
animate();

