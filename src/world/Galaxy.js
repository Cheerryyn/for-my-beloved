import * as THREE from 'three';

export function createGalaxy(scene) {
    const galaxyGroup = new THREE.Group();

    const starGeometry = new THREE.BufferGeometry();
    const starCount = 9000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i += 1) {
        const radius = 250 + Math.random() * 400;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.cos(phi);
        positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

        const color = new THREE.Color();
        color.setHSL(0.55 + Math.random() * 0.2, 0.8, 0.7 + Math.random() * 0.2);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    galaxyGroup.add(stars);

    const nebulaGeometry = new THREE.BufferGeometry();
    const nebulaCount = 180;
    const nebulaPositions = new Float32Array(nebulaCount * 3);
    const nebulaColors = new Float32Array(nebulaCount * 3);

    for (let i = 0; i < nebulaCount; i += 1) {
        const radius = 140 + Math.random() * 220;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        nebulaPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        nebulaPositions[i * 3 + 1] = radius * Math.cos(phi);
        nebulaPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

        const color = new THREE.Color(0x5b6cff);
        color.offsetHSL(Math.random() * 0.08, 0.2, 0.1);
        nebulaColors[i * 3] = color.r;
        nebulaColors[i * 3 + 1] = color.g;
        nebulaColors[i * 3 + 2] = color.b;
    }

    nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(nebulaPositions, 3));
    nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(nebulaColors, 3));

    const nebulaMaterial = new THREE.PointsMaterial({
        size: 6,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
    });

    const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
    galaxyGroup.add(nebula);

    scene.add(galaxyGroup);
    return { group: galaxyGroup, stars, nebula };
}