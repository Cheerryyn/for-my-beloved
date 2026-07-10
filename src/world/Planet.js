import * as THREE from 'three';

export function createPlanet(scene, options = {}) {
    const group = new THREE.Group();
    const { color = 0x6f8cff, emissive = 0x16276b, name = 'Amina', scale = 1, position = [0, 0, -220] } = options;

    const planetGeometry = new THREE.SphereGeometry(8 * scale, 64, 64);
    const planetMaterial = new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: 0.14,
        roughness: 0.92,
        metalness: 0.06,
    });

    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.castShadow = false;
    planet.receiveShadow = false;

    const atmosphereGeometry = new THREE.SphereGeometry(8.4 * scale, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);

    const ringGeometry = new THREE.TorusGeometry(12 * scale, 0.18 * scale, 32, 300);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.24,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2.6;

    group.add(planet);
    group.add(atmosphere);
    group.add(ring);

    // store display name and scale for external label rendering
    group.userData = { name, scale };

    group.position.set(...position);
    scene.add(group);

    return group;
}