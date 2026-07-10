import './style.css';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { createIntro } from './ui/Intro';
import { createStoryCard } from './ui/StoryCard';
import { createGalaxy } from './world/Galaxy';
import { createPlanet } from './world/Planet';
import { story } from './data/story';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.0025);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 1.8, 24);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.4, 0.1);
composer.addPass(bloomPass);

const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);

const keyLight = new THREE.PointLight(0x78a8ff, 40, 200, 2);
keyLight.position.set(20, 20, 20);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0xff5fd5, 18, 180, 2);
rimLight.position.set(-30, -20, -20);
scene.add(rimLight);

const galaxy = createGalaxy(scene);
const storyCard = createStoryCard();

const planets = [
    createPlanet(scene, { color: 0x6f8cff, emissive: 0x132c6f, name: '🪐 First Light ✨', scale: 1, position: [-18, -0.4, -90] }),
    createPlanet(scene, { color: 0x8d5cff, emissive: 0x22126d, name: '🌍 New Orbit 🌍', scale: 1.2, position: [-4, -0.55, -140] }),
    createPlanet(scene, { color: 0xff8fb7, emissive: 0x6f1b3d, name: '🌕 Heart Letter 💌', scale: 1.4, position: [9, -0.7, -190] }),
    createPlanet(scene, { color: 0x24d4b0, emissive: 0x0e4d3d, name: '⭐ Brightest Star ✨', scale: 2.1, position: [24, -1, -240] }),
];

const planetGroup = new THREE.Group();
planets.forEach((planet) => planetGroup.add(planet));
scene.add(planetGroup);

const starField = galaxy.stars;
const nebula = galaxy.nebula;

// Prepare raycaster for clicking planets
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const planetMeshes = planets.flatMap((p) => p.children.filter((c) => c.isMesh));

function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(planetMeshes, true);
    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
    } else {
        document.body.style.cursor = '';
    }
}

function onPointerDown(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(planetMeshes, true);
    if (intersects.length > 0) {
        const hit = intersects[0].object;
        const group = planets.find((g) => g.children.includes(hit) || g.children.includes(hit.parent) || g.children.some((ch) => ch.children && ch.children.includes(hit)));
        const index = planets.indexOf(group);
        if (index >= 0) {
            if (currentTargetIndex === index && !isFlying) {
                showStoryCardFor(index);
            } else {
                flyToPlanet(index, true);
            }
        }
    }
}

renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('pointerdown', onPointerDown);

let introComplete = false;
let currentStage = 0;
let journeyActive = false;
let cameraTarget = { x: 0, y: 1.8, z: 24 };
let cameraLookAt = new THREE.Vector3(0, 0, -120);

let currentTargetIndex = -1;
let isFlying = false;
let celebrationParticles = null;
let celebrationParticleData = null;
let heartAnimationActive = false;
let finalCutsceneStage = 'none';

// Ensure camera stays upright
camera.up.set(0, 1, 0);

// DOM buttons (created on demand)
let exploreButton = null;
let continueButton = null;

function animate() {
    requestAnimationFrame(animate);

    starField.rotation.y += 0.0001;
    starField.rotation.x += 0.00003;
    nebula.rotation.y -= 0.00004;

    planets.forEach((planet, index) => {
        planet.rotation.y += 0.002 + index * 0.0002;
        planet.rotation.x += 0.0003;
    });

    if (finalCutsceneStage === 'steady') {
        // keep final camera steady during the ending celebration
        camera.position.copy(cameraTarget);
    } else if (finalCutsceneStage === 'moving') {
        // camera is moving via GSAP during final cutscene; do not override
    } else if (journeyActive && !isFlying) {
        camera.position.x += (cameraTarget.x - camera.position.x) * 0.06;
        camera.position.y += (cameraTarget.y - camera.position.y) * 0.06;
        camera.position.z += (cameraTarget.z - camera.position.z) * 0.06;
    } else if (!journeyActive) {
        camera.position.x += (Math.sin(Date.now() * 0.0003) * 0.1 - camera.position.x) * 0.02;
        camera.position.y += (Math.cos(Date.now() * 0.0002) * 0.05 - camera.position.y) * 0.02;
    }

    // Smooth lookAt is driven by tweens (gsap) — just apply it each frame
    camera.lookAt(cameraLookAt);

    if (heartAnimationActive) {
        updateCelebrationParticles();
    }

    composer.render();
}

function updateCelebrationParticles() {
    if (!celebrationParticleData || !celebrationParticles) return;
    const { startPositions, midPositions, endPositions, count, progress, stage, randomOffsets } = celebrationParticleData;
    const positions = celebrationParticles.geometry.attributes.position.array;

    if (stage === 'explode') {
        for (let i = 0; i < count; i++) {
            const si = i * 3;
            positions[si] = THREE.MathUtils.lerp(startPositions[si], midPositions[si], progress);
            positions[si + 1] = THREE.MathUtils.lerp(startPositions[si + 1], midPositions[si + 1], progress);
            positions[si + 2] = THREE.MathUtils.lerp(startPositions[si + 2], midPositions[si + 2], progress);
        }
    } else if (stage === 'gather') {
        for (let i = 0; i < count; i++) {
            const si = i * 3;
            positions[si] = THREE.MathUtils.lerp(midPositions[si], endPositions[si], progress);
            positions[si + 1] = THREE.MathUtils.lerp(midPositions[si + 1], endPositions[si + 1], progress);
            positions[si + 2] = THREE.MathUtils.lerp(midPositions[si + 2], endPositions[si + 2], progress);
        }
    } else if (stage === 'idle') {
        const time = Date.now() * 0.0012;
        for (let i = 0; i < count; i++) {
            const si = i * 3;
            const wobble = Math.sin(time + randomOffsets[si]) * 0.04;
            const wobbleY = Math.sin(time + randomOffsets[si + 1]) * 0.04;
            const wobbleZ = Math.sin(time + randomOffsets[si + 2]) * 0.04;
            positions[si] = endPositions[si] + wobble;
            positions[si + 1] = endPositions[si + 1] + wobbleY;
            positions[si + 2] = endPositions[si + 2] + wobbleZ;
        }
    }

    celebrationParticles.geometry.attributes.position.needsUpdate = true;
}

function createHeartTargetPositions(total, center, scale = 1) {
    const positions = new Float32Array(total * 3);
    for (let i = 0; i < total; i++) {
        const t = Math.random() * Math.PI * 2;
        const radius = 0.8 + Math.random() * 0.35;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        const offsetX = x * 0.12 * radius * scale;
        const offsetY = y * 0.12 * radius * scale;
        const offsetZ = (Math.random() - 0.5) * 1.5 * scale;

        positions[i * 3] = center.x + offsetX;
        positions[i * 3 + 1] = center.y + offsetY;
        positions[i * 3 + 2] = center.z + offsetZ;
    }
    return positions;
}

function pulseHeart() {
    if (!celebrationParticles) return;
    gsap.to(celebrationParticles.scale, {
        x: 1.08,
        y: 1.08,
        z: 1.08,
        duration: 1.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
    });
    gsap.to(celebrationParticles.material, {
        opacity: 0.95,
        duration: 1.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
    });
}

function setCameraTo(target) {
    gsap.to(camera.position, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration: 3,
        ease: 'power3.inOut',
    });
}

function showStory(index) {
    const entry = story[index] || { title: 'Путешествие', text: 'Продолжим нашу историю.', color: '#6f8cff' };
    const planetName = planets[index]?.userData?.name || `Планета ${index + 1}`;
    const imgSize = (index === 0 || index === 3) ? '45%' : '60%';
    const imageHtml = entry.image ?
        `<img src="${entry.image}" alt="${entry.title}" style="max-width:${imgSize}; border-radius:12px; display:block; width:${imgSize}; height:auto; margin:0 auto;" />` :
        `<div class="story-media" style="background: linear-gradient(135deg, ${entry.color || '#6f8cff'}22, transparent);"><span>${entry.title}</span></div>`;

    storyCard.show({
        title: `Планета (${planetName})`,
        text: entry.text,
        media: imageHtml,
        accent: entry.color,
        onContinue: () => {
            if (index < story.length - 1) {
                currentStage = index + 1;
                // fly to next planet after a short delay
                gsap.delayedCall(0.35, () => flyToPlanet(currentStage));
            } else {
                finishJourney();
            }
        },
    });
}

function flyToPlanet(index, openOnArrive = false) {
    if (!planets[index]) return finishJourney();
    journeyActive = true;
    isFlying = true;
    currentTargetIndex = index;
    const targetPlanet = planets[index];
    // ensure any previous camera tweens are stopped so we start from current position
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(camera.quaternion);
    gsap.killTweensOf(cameraLookAt);
    gsap.killTweensOf(cameraTarget);
    // hide any UI while flying
    removeExploreButton();
    removeContinueButton();
    // compute a cinematic camera offset relative to planet
    const targetPos = new THREE.Vector3();
    targetPlanet.getWorldPosition(targetPos);

    // compute planet radius and ring size so the camera stays outside the full object
    let radius = 10;
    let ringRadius = 0;
    try {
        const planetMesh = targetPlanet.children.find((c) => c.isMesh && c.geometry && c.geometry.parameters && c.geometry.parameters.radius !== undefined);
        if (planetMesh) radius = planetMesh.geometry.parameters.radius || radius;
        const ringMesh = targetPlanet.children.find((c) => c.isMesh && c.geometry && c.geometry.parameters && c.geometry.parameters.radius !== undefined && c.geometry.type === 'TorusGeometry');
        if (ringMesh) ringRadius = ringMesh.geometry.parameters.radius || 0;
    } catch (e) {
        // fallback sizes
    }

    const baseDistance = Math.max(radius * 1.5 + 6, 22);
    const safeDistance = baseDistance + ringRadius * 0.3;
    const targetCamPos = targetPos.clone().add(new THREE.Vector3(
        0,
        (targetPlanet.userData ?.scale || 1) * 1.1 + 1.0,
        safeDistance
    ));
    const destination = {
        x: targetCamPos.x,
        y: targetCamPos.y,
        z: targetCamPos.z,
    };
    cameraTarget = {...destination };

    // prepare orientation tween: compute desired quaternion that looks at planet with up=[0,1,0]
    const tmpCam = new THREE.PerspectiveCamera();
    tmpCam.position.copy(camera.position);
    tmpCam.up.set(0, 1, 0);
    tmpCam.lookAt(targetPos);
    const desiredQuat = tmpCam.quaternion.clone();
    const startQuat = camera.quaternion.clone();

    // tween lookAt smoothly to the planet center
    gsap.to(cameraLookAt, { x: targetPos.x, y: targetPos.y, z: targetPos.z, duration: 2.8, ease: 'power3.inOut' });

    // animate bloom and subtle approach
    gsap.to(bloomPass, { strength: 1.6, duration: 1.8, ease: 'power2.out' });

    const quatTween = { t: 0 };
    gsap.to(camera.position, {
        x: destination.x,
        y: destination.y,
        z: destination.z,
        duration: 2.8,
        ease: 'power3.inOut',
    });
    gsap.to(quatTween, {
        t: 1,
        duration: 2.8,
        ease: 'power3.inOut',
        onUpdate: () => {
            camera.quaternion.copy(startQuat).slerp(desiredQuat, quatTween.t);
        },
        onComplete: () => {
            isFlying = false;
            showExploreButton(index);
            if (openOnArrive) {
                showStoryCardFor(index);
            }
        },
    });
}

function showExploreButton(index) {
    removeExploreButton();
    const entry = story[index] || { title: 'Исследовать', color: '#7fb3ff' };
    exploreButton = document.createElement('button');
    exploreButton.className = 'explore-btn';
    exploreButton.textContent = 'Исследовать планету';
    document.body.appendChild(exploreButton);
    gsap.fromTo(exploreButton, { y: 60, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' });

    exploreButton.onclick = () => {
        removeExploreButton();
        // open story card; when closed, show continue button
        showStoryCardFor(index);
    };
}

function removeExploreButton() {
    if (exploreButton) {
        exploreButton.remove();
        exploreButton = null;
    }
}

function showContinueButton(index) {
    removeContinueButton();
    continueButton = document.createElement('button');
    continueButton.className = 'continue-btn';
    continueButton.textContent = 'Продолжить путешествие';
    document.body.appendChild(continueButton);
    gsap.fromTo(continueButton, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });

    continueButton.onclick = () => {
        removeContinueButton();
        const next = index + 1;
        if (next < planets.length) {
            flyToPlanet(next);
        } else {
            finishJourney();
        }
    };
}

function removeContinueButton() {
    if (continueButton) {
        continueButton.remove();
        continueButton = null;
    }
}

function showStoryCardFor(index) {
    const entry = story[index] || { title: 'Путешествие', text: 'Продолжим нашу историю.', color: '#6f8cff' };
    const planetName = planets[index]?.userData?.name || `Планета ${index + 1}`;
    const imgSize = (index === 0 || index === 3) ? '45%' : '60%';
    const imageHtml = entry.image ?
        `<img src="${entry.image}" alt="${entry.title}" style="max-width:${imgSize}; border-radius:12px; display:block; width:${imgSize}; height:auto; margin:0 auto;" />` :
        `<div class="story-media" style="background: linear-gradient(135deg, ${entry.color || '#6f8cff'}22, transparent);"><span>${entry.title}</span></div>`;

    storyCard.show({
        title: `Планета (${planetName})`,
        text: entry.text,
        media: imageHtml,
        accent: entry.color,
        onContinue: () => {
            // when user closes story, show continue button
            showContinueButton(index);
        },
    });
}

function startJourney() {
    journeyActive = true;
    currentStage = 0;
    gsap.to(bloomPass, { strength: 1.2, duration: 1.6, ease: 'power2.out' });
    // fly to the first planet
    flyToPlanet(0);
}

function finishJourney() {
    journeyActive = false;
    isFlying = false;
    currentTargetIndex = -1;

    gsap.killTweensOf(cameraTarget);
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(camera.quaternion);

    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    celebration.innerHTML = '<h2>I love you, sunshine. ☀️❤️</h2>';
    document.body.appendChild(celebration);
    gsap.from(celebration, { opacity: 0, scale: 0.8, duration: 1.2, ease: 'power3.out' });

    gsap.to(bloomPass, { strength: 3.6, duration: 2.5, ease: 'power2.out' });

    const sceneCenter = new THREE.Vector3();
    planets.forEach((planet) => {
        const planetPos = new THREE.Vector3();
        planet.getWorldPosition(planetPos);
        sceneCenter.add(planetPos);
    });
    sceneCenter.multiplyScalar(1 / planets.length);

    const finalCamera = { x: sceneCenter.x * 0.15, y: 7.4, z: 62 };
    finalCutsceneStage = 'moving';
    gsap.to(camera.position, {
        x: finalCamera.x,
        y: finalCamera.y,
        z: finalCamera.z,
        duration: 4.2,
        ease: 'power2.inOut',
        onComplete: () => {
            finalCutsceneStage = 'steady';
            cameraTarget = {...finalCamera };
            triggerFinalExplosion();
        },
    });
    gsap.to(cameraLookAt, { x: sceneCenter.x, y: sceneCenter.y, z: sceneCenter.z, duration: 4.2, ease: 'power2.inOut' });
    cameraTarget = {...finalCamera };
}

function triggerFinalExplosion() {
    if (celebrationParticles) {
        scene.remove(celebrationParticles);
        celebrationParticles.geometry.dispose();
        celebrationParticles.material.dispose();
        celebrationParticles = null;
        celebrationParticleData = null;
    }

    const particleCount = planets.length * 90;
    const startPositions = new Float32Array(particleCount * 3);
    const midPositions = new Float32Array(particleCount * 3);
    const endPositions = new Float32Array(particleCount * 3);
    const randomOffsets = new Float32Array(particleCount * 3);
    let pointIndex = 0;

    planets.forEach((planet) => {
        const planetPos = new THREE.Vector3();
        planet.getWorldPosition(planetPos);
        const scale = planet.userData ?.scale || 1;
        const jitter = scale * 2.2;

        for (let i = 0; i < 90; i++) {
            startPositions[pointIndex * 3] = planetPos.x + (Math.random() - 0.5) * jitter;
            startPositions[pointIndex * 3 + 1] = planetPos.y + (Math.random() - 0.5) * jitter;
            startPositions[pointIndex * 3 + 2] = planetPos.z + (Math.random() - 0.5) * jitter;
            randomOffsets[pointIndex * 3] = Math.random() * Math.PI * 2;
            randomOffsets[pointIndex * 3 + 1] = Math.random() * Math.PI * 2;
            randomOffsets[pointIndex * 3 + 2] = Math.random() * Math.PI * 2;
            pointIndex += 1;
        }
    });

    planets.forEach((planet) => {
        planet.visible = false;
    });

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(startPositions, 3));
    const particleMaterial = new THREE.PointsMaterial({ size: 0.2, color: 0xff4179, transparent: true, opacity: 0.96, depthWrite: false, blending: THREE.AdditiveBlending });
    celebrationParticles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(celebrationParticles);

    const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const heartCenter = camera.position.clone().add(cameraForward.multiplyScalar(8));
    const endPositionArray = createHeartTargetPositions(particleCount, heartCenter, 0.9);

    for (let i = 0; i < particleCount; i++) {
        const si = i * 3;
        const direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2.4,
            (Math.random() - 0.3) * 2.4,
            (Math.random() - 0.5) * 2.8
        ).normalize();
        const distance = 28 + Math.random() * 16;
        midPositions[si] = startPositions[si] + direction.x * distance;
        midPositions[si + 1] = startPositions[si + 1] + direction.y * distance;
        midPositions[si + 2] = startPositions[si + 2] + direction.z * distance;
        endPositions[si] = endPositionArray[si];
        endPositions[si + 1] = endPositionArray[si + 1];
        endPositions[si + 2] = endPositionArray[si + 2];
    }

    celebrationParticleData = {
        startPositions,
        midPositions,
        endPositions,
        count: particleCount,
        progress: 0,
        stage: 'explode',
        randomOffsets,
    };
    heartAnimationActive = true;

    gsap.to(celebrationParticleData, {
        progress: 1,
        duration: 2.5,
        ease: 'power2.out',
        onUpdate: updateCelebrationParticles,
        onComplete: () => {
            celebrationParticleData.progress = 0;
            celebrationParticleData.stage = 'gather';
            gsap.to(celebrationParticleData, {
                progress: 1,
                duration: 3.5,
                ease: 'power2.inOut',
                onUpdate: updateCelebrationParticles,
                onComplete: () => {
                    celebrationParticleData.stage = 'idle';
                    gsap.to(celebrationParticles.material, { opacity: 0.96, duration: 2.5, ease: 'power1.out' });
                    pulseHeart();
                    gsap.to(bloomPass, { strength: 5.2, duration: 1.2, ease: 'sine.inOut' });
                },
            });
        },
    });
}

createIntro(() => {
    introComplete = true;
    startJourney();
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    bloomPass.setSize(window.innerWidth, window.innerHeight);
});

animate();