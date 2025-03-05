<script setup lang="ts">
import { useGLTF } from '@tresjs/cientos';
import { useTexture } from '@tresjs/core';
import * as THREE from 'three';
import { onMounted, ref, watch, shallowRef, computed, ComputedRef } from 'vue';
import type { Shelf, Box } from '../interfaces/shelf.interface';
import { shelfNumber } from "../stores/shelfNumber"
import cursorStyle from "../stores/cursorStyle"
import anime from 'animejs';

// Define types
interface BeamGeometry {
    position: [number, number, number];
    width: number;
    height: number;
    depth: number;
}

interface WallGeometry {
    position: [number, number, number];
    rotation: [number, number, number];
    width: number;
    height: number;
}

interface SceneData {
    textures: {
        wall: THREE.Texture;
        floor: THREE.Texture;
        ceiling: THREE.Texture;
        beam: THREE.Texture;
    };
    wallGeometries: WallGeometry[];
    beamGeometries: BeamGeometry[];
    shelves: Shelf[];
}

interface Models {
    shelves: Record<string, THREE.Object3D>,
    // box: THREE.Scene
}

// Room configuration
const ROOM_CONFIG = {
    width: 80,
    depth: 50,
    height: 30,
    numBeams: 6
};


defineExpose({
    cursorStyle
})

// Scene refs - Use shallowRef for Three.js objects to prevent deep reactivity
const warehouseGroup = shallowRef<THREE.Group | null>(null);

// Load models
const loadModels = async (): Promise<Models> => {
    const shelves: Record<string, THREE.Object3D> = {};
    // load shelf models
    for (let i = 1; i <= 4; i++) {
        const { scene } = await useGLTF('/metal_shelf_-_5mb.glb', { draco: true });
        shelves[`shelf${i}`] = scene.clone(); // Clone to ensure unique instances
    }

    // // load box model
    // const { scene: box } = await useGLTF('/beautiful_and_free_basic_cardboard_box_1m_size.glb', { draco: true });

    return {
        shelves,
        // box
    };
};

// Load textures
const loadTextures = async () => {
    const [wall, floor, ceiling, beam] = await useTexture([
        '/empty-red-brick-wall (1).jpg',
        '/Floor_baseColor.jpg',
        '/Ceiling_baseColor.jpg',
        '/vecteezy_concrete-wall-texture_1819580 (1).jpg'
    ]);

    return { wall, floor, ceiling, beam };
};

// Create wall geometries
const createWallGeometries = (): WallGeometry[] => {
    const halfWidth = ROOM_CONFIG.width / 2;
    const halfDepth = ROOM_CONFIG.depth / 2;

    return [
        { // Left wall
            position: [-halfWidth, 0, 0],
            rotation: [0, Math.PI / 2, 0],
            width: ROOM_CONFIG.depth,
            height: ROOM_CONFIG.height
        },
        { // Right wall
            position: [halfWidth, 0, 0],
            rotation: [0, -Math.PI / 2, 0],
            width: ROOM_CONFIG.depth,
            height: ROOM_CONFIG.height
        },
        { // Back wall
            position: [0, 0, -halfDepth],
            rotation: [0, Math.PI, 0],
            width: ROOM_CONFIG.width,
            height: ROOM_CONFIG.height
        },
        { // Front wall
            position: [0, 0, halfDepth],
            rotation: [0, 0, 0],
            width: ROOM_CONFIG.width,
            height: ROOM_CONFIG.height
        }
    ];
};

// Create beam geometries
const createBeamGeometries = (): BeamGeometry[] => {
    const beams: BeamGeometry[] = [];
    const beamSpacing = ROOM_CONFIG.width / (ROOM_CONFIG.numBeams + 1);
    const halfHeight = ROOM_CONFIG.height / 2;

    for (let i = 1; i <= ROOM_CONFIG.numBeams; i++) {
        beams.push({
            position: [(i * beamSpacing) - (ROOM_CONFIG.width / 2), halfHeight, 0],
            width: 2,
            height: 2,
            depth: ROOM_CONFIG.depth
        });
    }

    return beams;
};

// Update your createShelfConfigurations function with the correct boxes structure
const createShelfConfigurations = async (models: Record<string, THREE.Object3D>): Promise<Shelf[]> => {
    // Function to create a boxes structure with only one box in first row
    const createInitialBoxesStructure = async (rows: number): Promise<Box[][]> => {

        const borderedBoxModel = async (box: THREE.Scene): Promise<THREE.Scene> => {
            box.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    // Create a wireframe outline using EdgesGeometry
                    const edgesGeometry = new THREE.EdgesGeometry(child.geometry, 15); // 15 degrees threshold
                    const wireframe = new THREE.LineSegments(
                        edgesGeometry,
                        new THREE.LineBasicMaterial({
                            color: 0xffffff, // White border
                            linewidth: 2,
                            transparent: true,
                            opacity: 1
                        })
                    );

                    // Ensure the wireframe is slightly larger than the original mesh
                    wireframe.scale.multiplyScalar(1.06);

                    // Use the same transformation as the parent mesh
                    wireframe.position.copy(child.position);
                    wireframe.quaternion.copy(child.quaternion);
                    wireframe.scale.copy(child.scale);
                    wireframe.scale.multiplyScalar(1.01); // Make slightly larger

                    // Add the wireframe as a sibling to ensure it renders independently
                    if (child.parent) {
                        child.parent.add(wireframe);
                    } else {
                        box.add(wireframe);
                    }
                }
            });

            return box;
        }

        const boxes: Box[][] = [];

        const { scene: box } = await useGLTF('/beautiful_and_free_basic_cardboard_box_1m_size.glb', { draco: true });

        // First row with one box
        boxes.push([{ content: "", model: await borderedBoxModel(box) }]);


        // Remaining rows are empty arrays (no boxes yet)
        for (let i = 1; i < rows; i++) {

            boxes.push([]);
        }

        return boxes;
    };

    return [
        {
            model: (() => {
                const scene = new THREE.Scene();
                scene.add(models.shelf1.clone());
                return scene;
            })(),
            positions: { x: 30, y: -15, z: -21.5 },
            boxes: await createInitialBoxesStructure(5) // 4 rows, only first row has a box
        },
        {
            model: (() => {
                const scene = new THREE.Scene();
                scene.add(models.shelf2.clone());
                return scene;
            })(),
            positions: { x: 10, y: -15, z: -21.5 },
            boxes: await createInitialBoxesStructure(5)
        },
        {
            model: (() => {
                const scene = new THREE.Scene();
                scene.add(models.shelf3.clone());
                return scene;
            })(),
            positions: { x: -10, y: -15, z: -21.5 },
            boxes: await createInitialBoxesStructure(5)
        },
        {
            model: (() => {
                const scene = new THREE.Scene();
                scene.add(models.shelf4.clone());
                return scene;
            })(),
            positions: { x: -30, y: -15, z: -21.5 },
            boxes: await createInitialBoxesStructure(5)
        }
    ];
};

// Configure texture
const configureTexture = (texture: THREE.Texture, repeatX = 1, repeatY = 1) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.needsUpdate = true;
    return texture;
};

// Initialization
const initializeScene = async (): Promise<SceneData> => {
    // Load all required assets
    const models = await loadModels();
    const shelves = await createShelfConfigurations(models.shelves);
    const textures = await loadTextures();

    // Configure textures
    configureTexture(textures.floor, 5, 5);
    configureTexture(textures.ceiling, 5, 5);
    configureTexture(textures.wall, 1, 1);
    configureTexture(textures.beam, 1, 10);

    // Create scene elements
    const wallGeometries = createWallGeometries();
    const beamGeometries = createBeamGeometries();

    // Position shelves manually
    shelves.forEach(shelf => {
        const { x, y, z } = shelf.positions;
        shelf.model.position.set(x, y, z);
        shelf.model.scale.set(10, 10, 10);
    });

    return {
        textures,
        wallGeometries,
        beamGeometries,
        shelves
    };
};

const boxPosition = computed(() => (index: number) => {
    switch (index) {
        case 0:
            return -0.54;
        case 1:
            return -0.178;
        case 2:
            return 0.178;
        case 3:
            return 0.54;
        default:
            return 0;
    }
});

const addBox = () => {
    console.log("hello")
}

// Initialize data with proper typing - use shallowRef for 3D objects
const sceneData = shallowRef<SceneData | null>(null);

// Run initialization on component mount
onMounted(async () => {
    try {
        sceneData.value = await initializeScene();
        console.log(sceneData.value.shelves);
    } catch (error) {
        console.error("Error initializing scene:", error);
    }
});

// Watch for shelf number changes
watch(shelfNumber, () => {
    const currentSceneData = sceneData.value;

    if (!currentSceneData || !warehouseGroup.value) return;

    const shelf = currentSceneData.shelves[shelfNumber.value];
    if (!shelf || !shelf.model) {
        console.warn(`Shelf ${shelfNumber.value} not found`);
        return;
    }

    // Create a plain object for animation that matches the position
    const position = warehouseGroup.value.position;
    const animationTarget = {
        x: position.x,
        y: position.y,
        z: position.z
    };

    anime({
        targets: animationTarget,
        x: shelf.positions.x,
        duration: 300,
        easing: 'easeInOutQuad',
        update: function () {
            // Update the actual position from our animation target object
            position.set(animationTarget.x, animationTarget.y, animationTarget.z);
        }
    });
});
</script>

<template>
    <TresGroup ref="warehouseGroup" :position="[-10, 0, 0]">
        <!-- Room Structure -->
        <TresGroup>
            <!-- Walls -->
            <TresMesh v-if="sceneData" v-for="(wall, index) in sceneData.wallGeometries" :key="`wall-${index}`"
                :geometry="new THREE.PlaneGeometry(wall.width, wall.height).toNonIndexed()"
                :position="new THREE.Vector3(...wall.position)" :rotation="new THREE.Euler(...wall.rotation)"
                receive-shadow>
                <TresMeshStandardMaterial :map="sceneData.textures.wall" :side="THREE.DoubleSide" :roughness="0.8"
                    :metalness="0.2" />
            </TresMesh>

            <!-- Floor -->
            <TresMesh v-if="sceneData"
                :geometry="new THREE.PlaneGeometry(ROOM_CONFIG.width, ROOM_CONFIG.depth).toNonIndexed()"
                :position="new THREE.Vector3(0, -15, 0)" :rotation="new THREE.Euler(-Math.PI / 2, 0, 0)" receive-shadow>
                <TresMeshStandardMaterial :map="sceneData.textures.floor" :side="THREE.DoubleSide" :roughness="0.8"
                    :metalness="0.1" />
            </TresMesh>

            <!-- Ceiling -->
            <TresMesh v-if="sceneData"
                :geometry="new THREE.PlaneGeometry(ROOM_CONFIG.width, ROOM_CONFIG.depth).toNonIndexed()"
                :position="new THREE.Vector3(0, 15, 0)" :rotation="new THREE.Euler(Math.PI / 2, 0, 0)" receive-shadow>
                <TresMeshStandardMaterial :map="sceneData.textures.ceiling" :side="THREE.DoubleSide" :roughness="0.8"
                    :metalness="0.1" />
            </TresMesh>

            <!-- Beams -->
            <TresMesh v-if="sceneData" v-for="(beam, index) in sceneData.beamGeometries" :key="`beam-${index}`"
                :geometry="new THREE.BoxGeometry(beam.width, beam.height, beam.depth).toNonIndexed()"
                :position="new THREE.Vector3(...beam.position)" receive-shadow>
                <TresMeshStandardMaterial :map="sceneData.textures.beam" :roughness="0.8" :metalness="0.2" />
            </TresMesh>
        </TresGroup>

        <!-- Lighting -->
        <TresGroup>
            <TresAmbientLight :intensity="0.7" />
            <TresDirectionalLight :position="new THREE.Vector3(10, 10, 10)" :intensity="1.5" cast-shadow />
            <TresHemisphereLight :skyColor="0xffffff" :groundColor="0x444444" :intensity="0.8" />
            <TresPointLight :position="new THREE.Vector3(0, 10, 0)" :intensity="0.8" cast-shadow />
        </TresGroup>

        <!-- Shelves -->
        <primitive v-if="sceneData" v-for="(shelf, index) in sceneData.shelves" :key="`shelf-${index}`"
            :object="shelf.model">
            <TresGroup :position="[0, 1.78, 0]">
                <primitive @click="addBox" @pointer-enter="cursorStyle = 'pinter'" @pointer-leave="cursorStyle = 'auto'"
                    :rotation="[0, 1.64, 0]" :position="[boxPosition(index), 0, 0]" :scale="[1.5, 1.5, 1.5]"
                    v-for="(box, index) in shelf.boxes[0]" :key="`box-0${index}`" :object="box.model" />
            </TresGroup>
            <TresGroup></TresGroup>
            <TresGroup></TresGroup>
            <TresGroup></TresGroup>
            <TresGroup></TresGroup>
        </primitive>
    </TresGroup>
</template>