/**
 * NeuroDx - 3D Brain Viewer
 * Uses Three.js to render a interactive, stylized brain visualization.
 */

class BrainViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.brainMesh = null;
        this.pointCloud = null;
        this.isAutoRotating = true;

        this.init();
        this.animate();
    }

    init() {
        // 1. Scene
        this.scene = new THREE.Scene();
        // Transparent background handled by renderer alpha

        // 2. Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
        this.camera.position.z = 4;
        this.camera.position.y = 0.5;

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // 4. Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        const pointLight = new THREE.PointLight(0x007bff, 1.2, 20);
        pointLight.position.set(2, 5, 5);
        this.scene.add(pointLight);

        const rimLight = new THREE.PointLight(0xff00ff, 0.5, 20);
        rimLight.position.set(-5, 0, -5);
        this.scene.add(rimLight);

        // 5. Build Brain Geometry (Stylized)
        this.createBrainModel();

        // 6. Resize Handler
        window.addEventListener('resize', () => this.onResize());
    }

    createBrainModel() {
        const brainGroup = new THREE.Group();

        // Base Mesh (Holographic Lobe Shape)
        // Using Scaled Sphere for Left/Right Hemispheres
        const geom = new THREE.SphereGeometry(1, 32, 32);

        // Material
        const mat = new THREE.MeshPhongMaterial({
            color: 0xeef2f3,
            shininess: 100,
            opacity: 0.8,
            transparent: true,
            flatShading: false,
            side: THREE.DoubleSide
        });

        const leftHemi = new THREE.Mesh(geom, mat);
        leftHemi.position.set(-0.6, 0, 0);
        leftHemi.scale.set(0.7, 1, 1.2);
        leftHemi.rotation.z = 0.1;
        brainGroup.add(leftHemi);

        const rightHemi = new THREE.Mesh(geom, mat);
        rightHemi.position.set(0.6, 0, 0);
        rightHemi.scale.set(0.7, 1, 1.2);
        rightHemi.rotation.z = -0.1;
        brainGroup.add(rightHemi);

        // Add "Activity" Particles
        const partGeom = new THREE.BufferGeometry();
        const partCount = 400;
        const posArray = new Float32Array(partCount * 3);

        for (let i = 0; i < partCount * 3; i += 3) {
            // Random sphere distribution
            const r = 1.5 * Math.cbrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            posArray[i] = r * Math.sin(phi) * Math.cos(theta);
            posArray[i + 1] = r * Math.sin(phi) * Math.sin(theta);
            posArray[i + 2] = r * Math.cos(phi);
        }

        partGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const partMat = new THREE.PointsMaterial({
            size: 0.03,
            color: 0x007bff,
            transparent: true,
            opacity: 0.6
        });

        this.pointCloud = new THREE.Points(partGeom, partMat);
        brainGroup.add(this.pointCloud);

        this.brainMesh = brainGroup;
        this.scene.add(brainGroup);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.isAutoRotating && this.brainMesh) {
            this.brainMesh.rotation.y += 0.005;
            this.pointCloud.rotation.y -= 0.002; // Counter-rotate particles
        }

        this.renderer.render(this.scene, this.camera);
    }

    rotate(dir) {
        this.isAutoRotating = false;
        const speed = 0.5;
        if (dir === 'left') this.brainMesh.rotation.y += speed;
        if (dir === 'right') this.brainMesh.rotation.y -= speed;

        // Resume after delay
        clearTimeout(this.autoRotateTimeout);
        this.autoRotateTimeout = setTimeout(() => this.isAutoRotating = true, 2000);
    }

    toggleAutoRotate() {
        this.isAutoRotating = !this.isAutoRotating;
    }

    onResize() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    window.brainViewer = new BrainViewer('brain3d-container');
});
