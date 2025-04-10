
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gameContainer = document.getElementById('game-container');
const canvas = document.getElementById('three-canvas');
const uiOverlay = document.getElementById('ui-overlay');
const gameArea = document.getElementById('game-area');
const crosshair = document.getElementById('crosshair');
const scoreDisplay = document.getElementById('score');
const missesDisplay = document.getElementById('misses');
const accuracyDisplay = document.getElementById('accuracy');
const timerDisplay = document.getElementById('timer');
const startButton = document.getElementById('start-button');
const difficultySelect = document.getElementById('difficulty');
const finalScoreDisplay = document.getElementById('final-score');
const finalMissesDisplay = document.getElementById('final-misses');
const finalAccuracyDisplay = document.getElementById('final-accuracy');
const adviceText = document.getElementById('advice-text');
const restartButton = document.getElementById('restart-button');
const resultsDiv = document.getElementById('results');
const closeResultsButton = document.getElementById('close-results-button');

closeResultsButton.addEventListener('click', () => {
    resultsDiv.classList.add('hidden');
});

window.addEventListener('resize', onWindowResize);

let score = 0;
let misses = 0;
let gameTimerId = null;
let targetSpawnId = null;
let timeLeft = 60;
let gameRunning = false;
let animationFrameId = null;
const targets = new Map();

const difficultySettings = {
    easy:   { spawnRate: 1500, lifeTime: 3500, size: 0.6 },
    medium: { spawnRate: 1000, lifeTime: 2500, size: 0.5 },
    hard:   { spawnRate: 700,  lifeTime: 1800, size: 0.4 },
    insane: { spawnRate: 450,  lifeTime: 1200, size: 0.3 },
};
let currentDifficulty = difficultySettings.medium;

let scene, camera, renderer, gunModel;
const loader = new GLTFLoader();
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0);

const TARGET_LAYER = 1;
const GUN_LAYER = 2;

const targetGeometry = new THREE.SphereGeometry(1, 16, 16);
const targetMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff, roughness: 0.5, metalness: 0.3 });
const targetHitMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x33ff33, roughness: 0.8, metalness: 0.1 });

let isPointerLocked = false;
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const PI_2 = Math.PI / 2;
const mouseSensitivity = 0.002;

function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    camera = new THREE.PerspectiveCamera(80, gameContainer.clientWidth / gameContainer.clientHeight, 0.1, 1000);
    camera.layers.enableAll();

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.9, metalness: 0.1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);


    loader.load( 'gun.glb', (gltf) => {
            gunModel = gltf.scene;
            console.log("Gun model loaded.");
            const scale = 1; gunModel.scale.set(scale, scale, scale);
            gunModel.position.set(0.2, -0.2, -0.5);
            gunModel.rotation.y = Math.PI;

             gunModel.traverse((child) => {
                 if (child.isMesh) {
                     child.castShadow = true;
                     child.layers.set(GUN_LAYER);
                 }
                 child.layers.set(GUN_LAYER);
             });
             gunModel.layers.set(GUN_LAYER);


            camera.add(gunModel);
            scene.add(camera);
            console.log("Gun attached to camera and set to layer", GUN_LAYER);
        }, undefined, (error) => {
            console.error('Error loading gun.glb:', error);
            const errorGeo = new THREE.BoxGeometry(0.3, 0.3, 0.8);
            const errorMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            const errorMesh = new THREE.Mesh(errorGeo, errorMat);
            errorMesh.position.set(0.2, -0.2, -0.5);
            errorMesh.layers.set(GUN_LAYER);
            camera.add(errorMesh); scene.add(camera);
        }
    );

    animate();
}

function onWindowResize() { 
    if (!renderer || !camera || !gameContainer) return;
    const width = gameContainer.clientWidth;
    const height = gameContainer.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}
function onMouseMove(event) { 
    if (!isPointerLocked) return;
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    euler.y -= movementX * mouseSensitivity;
    euler.x -= movementY * mouseSensitivity;
    euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
    camera.quaternion.setFromEuler(euler);
}
function handlePointerLockChange() {
    if (document.pointerLockElement === gameContainer) {
        console.log('%cPointer Locked - Setting isPointerLocked = true', 'color: green; font-weight: bold;');
        isPointerLocked = true;
        document.addEventListener('mousemove', onMouseMove, false);
        uiOverlay.style.cursor = 'none';
        crosshair.style.display = 'block';
    } else {
        console.log('%cPointer Unlocked - Setting isPointerLocked = false', 'color: orange; font-weight: bold;');
        isPointerLocked = false;
        document.removeEventListener('mousemove', onMouseMove, false);
        uiOverlay.style.cursor = 'default';
    }
}
function lockPointer() { 
    gameContainer.requestPointerLock = gameContainer.requestPointerLock || gameContainer.mozRequestPointerLock;
    gameContainer.requestPointerLock();
}
function unlockPointer() { 
     document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
     document.exitPointerLock();
}
document.addEventListener('pointerlockchange', handlePointerLockChange, false);
document.addEventListener('mozpointerlockchange', handlePointerLockChange, false);

function animate() {
    animationFrameId = requestAnimationFrame(animate);
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

gameContainer.addEventListener('mousedown', (e) => {
    console.log("mousedown event triggered");

    if (!gameRunning) {
        console.log(" -> Game not running. Attempting lock.");
        if (!isPointerLocked) lockPointer();
        return;
    }
    if (!isPointerLocked) {
        console.log(" -> Game running BUT pointer not locked. Attempting lock.");
         lockPointer();
         return; 
    }
    console.log("isPointerLocked:", isPointerLocked, "gameRunning:", gameRunning);

    console.log("Click registered, processing raycasting...");

    raycaster.layers.set(TARGET_LAYER);
    console.log("Raycaster set to layer:", raycaster.layers.mask, "TARGET_LAYER =", TARGET_LAYER);

    raycaster.setFromCamera(pointer, camera);

    const targetMeshes = Array.from(targets.keys());
    console.log("Number of targets to check:", targetMeshes.length);
    
    targetMeshes.forEach((mesh, index) => {
        console.log(`Target ${index} layer:`, mesh.layers.mask);
    });

    const intersects = raycaster.intersectObjects(targetMeshes, false);
    console.log("Intersections found:", intersects.length);

    if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        console.log("Hit registered on:", hitObject.uuid);
        
        if (targets.has(hitObject) && !targets.get(hitObject).hit) {
            console.log("Processing hit for target:", hitObject.uuid);
            hitTarget(hitObject);
        } else {
            console.log("Hit invalid target on layer:", hitObject.uuid);
            misses++;
            updateHUD();
        }
    } else {
        console.log("Missed - no intersections found");
        misses++;
        updateHUD();
    }
});

startButton.addEventListener('click', () => { if (!gameRunning) startGame(); });
difficultySelect.addEventListener('change', (e) => { currentDifficulty = difficultySettings[e.target.value]; });
restartButton.addEventListener('click', () => { resultsDiv.classList.add('hidden'); startGame(); });
window.addEventListener('resize', onWindowResize);


function startGame() { 
    score = 0; misses = 0; timeLeft = 60; gameRunning = true;
    updateHUD(); clearAllTargets();
    currentDifficulty = difficultySettings[difficultySelect.value];
    resultsDiv.classList.add('hidden');
    startButton.disabled = true; difficultySelect.disabled = true;
    euler.set(0, 0, 0, 'YXZ'); camera.quaternion.setFromEuler(euler);
    lockPointer();
    clearTimeout(gameTimerId); clearTimeout(targetSpawnId);
    gameTimerLoop(); targetSpawnLoop();
    console.log("Game Started:", currentDifficulty);
}
function gameTimerLoop() { 
    if (!gameRunning) return; updateTimer();
    gameTimerId = setTimeout(gameTimerLoop, 1000);
}
function targetSpawnLoop() { 
    if (!gameRunning) return; spawnTarget();
    targetSpawnId = setTimeout(targetSpawnLoop, currentDifficulty.spawnRate);
}

function endGame() {
    if (!gameRunning) return;
    gameRunning = false;

    clearTimeout(gameTimerId); clearTimeout(targetSpawnId);
    gameTimerId = null; targetSpawnId = null;

    unlockPointer();
    clearAllTargets();

    finalScoreDisplay.textContent = score;
    finalMissesDisplay.textContent = misses;
    const finalAccuracy = calculateAccuracy();
    finalAccuracyDisplay.textContent = finalAccuracy.toFixed(1);
    adviceText.textContent = getImprovementAdvice(finalAccuracy);

    resultsDiv.classList.remove('hidden');

    console.log("Game Over - Results Shown");
}

function updateTimer() { 
    timeLeft--; timerDisplay.textContent = timeLeft;
    if (timeLeft <= 0) { timerDisplay.textContent = 0; endGame(); }
}



function spawnTarget() {
    const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial.clone());
    targetMesh.material.color.setHex(Math.random() * 0xffffff);

    targetMesh.layers.set(TARGET_LAYER);
    console.log("Target spawned at:", targetMesh.position, "Layer:", targetMesh.layers.mask, 
        "Should be TARGET_LAYER:", TARGET_LAYER);
    const spawnDistance = 15; const spawnRangeX = 15; const spawnRangeY = 8; const spawnDepth = 5;
    const randomX = (Math.random() - 0.5) * spawnRangeX;
    const randomY = (Math.random() - 0.5) * spawnRangeY + (camera.position.y);
    const randomZ = -spawnDistance + (Math.random() - 0.5) * spawnDepth;
    targetMesh.position.set(randomX, randomY, randomZ);

    const scale = currentDifficulty.size;
    targetMesh.scale.set(scale, scale, scale);

    targetMesh.castShadow = true; targetMesh.receiveShadow = true;

    targetMesh.userData = { type: 'target' };
    scene.add(targetMesh);

    console.log("Target spawned at:", targetMesh.position, "Layer:", targetMesh.layers.mask, 
                "Should be TARGET_LAYER:", TARGET_LAYER);

    const timeoutId = setTimeout(() => {
        if (targets.has(targetMesh)) {
            removeTargetMesh(targetMesh);
        }
    }, currentDifficulty.lifeTime);

    targets.set(targetMesh, { timeoutId: timeoutId, hit: false });
}

function hitTarget(targetMesh) {
    if (!targets.has(targetMesh) || targets.get(targetMesh).hit) {
         console.log("Attempted to hit already processed target:", targetMesh.uuid);
         return;
     }

    console.log("Processing hit for target:", targetMesh.uuid);

    score++;

    const targetData = targets.get(targetMesh);
    clearTimeout(targetData.timeoutId);
    targetData.hit = true;

    targetMesh.material = targetHitMaterial.clone();

    targetMesh.layers.set(TARGET_LAYER);


    setTimeout(() => {
        removeTargetMesh(targetMesh);
    }, 150);

    updateHUD();
}

function removeTargetMesh(targetMesh) {
    if (!targetMesh) return;
    const targetData = targets.get(targetMesh);
    if (targetData && targetData.timeoutId) {
        clearTimeout(targetData.timeoutId);
    }
    scene.remove(targetMesh);
    targets.delete(targetMesh);
    if (targetMesh.material && typeof targetMesh.material.dispose === 'function') {
         targetMesh.material.dispose();
     }

}

function clearAllTargets() {
    targets.forEach((targetData, targetMesh) => {
        clearTimeout(targetData.timeoutId);
        scene.remove(targetMesh);
    });
    targets.clear();
}


function calculateAccuracy() { 
    const totalShots = score + misses;
    return totalShots === 0 ? 100.0 : (score / totalShots) * 100;
}
function updateHUD() { 
    scoreDisplay.textContent = score;
    missesDisplay.textContent = misses;
    accuracyDisplay.textContent = calculateAccuracy().toFixed(1);
}
function getImprovementAdvice(accuracy) { 
    if (accuracy >= 95) return "Excellent accuracy! Keep practicing to maintain consistency. Maybe try a harder difficulty?";
    if (accuracy >= 85) return "Great job! Focus on tracking targets smoothly and clicking precisely as the crosshair lines up.";
    if (accuracy >= 70) return "Good effort! Try to anticipate target movement slightly. Ensure your mouse sensitivity is comfortable.";
    if (accuracy >= 50) return "You're getting there! Concentrate on smooth mouse movements rather than jerky motions. Practice slow, deliberate aiming first.";
    return "Keep practicing! Focus on basic mouse control and tracking the targets visually before clicking. Lowering mouse sensitivity might help initially.";
}

initThree();
updateHUD();
timerDisplay.textContent = timeLeft;
resultsDiv.classList.add('hidden');
crosshair.style.display = 'block';