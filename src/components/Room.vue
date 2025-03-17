<script setup lang="ts">
import { useGLTF } from '@tresjs/cientos';
import { useTexture, useTresContext } from '@tresjs/core';
import * as THREE from 'three';
import { onMounted, ref, watch, shallowRef, computed, ComputedRef } from 'vue';
import type { Shelf, Box, BeamGeometry, Models, SceneData, WallGeometry } from '../interfaces/types';
import { shelfNumber } from "../stores/shelfNumber";
import cursorStyle from "../stores/cursorStyle";
import { useModelInteraction } from "../composables/useModelTouch";
import anime from 'animejs';
import selectedBox from '../stores/selectedBox';
import showModal from '../stores/modalStatus';
import { useIndexedDB } from "../composables/useIndexedDB";

// Room configuration
const ROOM_CONFIG = {
    width: 80,
    depth: 50,
    height: 30,
    numBeams: 6
};

defineExpose({
    cursorStyle
});

// Scene refs - Use shallowRef for Three.js objects to prevent deep reactivity
const warehouseGroup = shallowRef<THREE.Group | null>(null);

// Load models
const loadModels = async (): Promise<Models> => {
    const shelves: Record<string, THREE.Object3D> = {};
    // load shelf models
    for (let i = 1; i <= 4; i++) {
        const { scene } = await useGLTF('/metal_shelf_-_5mb2.glb', { draco: true });
        shelves[`shelf${i}`] = scene.clone(); // Clone to ensure unique instances
    }

    return {
        shelves,
    };
};

// Load textures
const loadTextures = async () => {
    const [wall, floor, ceiling, beam] = await useTexture([
        '/empty-red-brick-wall.jpg',
        '/Floor_baseColor.jpg',
        '/Ceiling_baseColor.jpg',
        '/vecteezy_concrete-wall-texture_1819580.jpg'
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

const { makeModelInteractive } = useModelInteraction();

// Create a bordered box model
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
};

// Create a boxes structure with only one box in first row
const createInitialBoxesStructure = async (rows: number, shelfId: number): Promise<Box[][]> => {
    const boxes: Box[][] = [];

    const { scene: box } = await useGLTF('/beautiful_and_free_basic_cardboard_box_1m_size.glb', { draco: true });

    makeModelInteractive(box, shelfId.toString(), (_, id) => {
        addBox(+id);
    });

    // First row with one box
    boxes.push([{ id: 0, content: [], model: await borderedBoxModel(box), isAddBox: true }]);

    // Remaining rows are empty arrays (no boxes yet)
    for (let i = 1; i < rows; i++) {
        boxes.push([]);
    }

    return boxes;
};

// Update your createShelfConfigurations function with the correct boxes structure
const createShelfConfigurations = async (models: Record<string, THREE.Object3D>): Promise<Shelf[]> => {
    return [
        {
            model: (() => {
                const scene = new THREE.Scene();
                scene.add(models.shelf1.clone());
                return scene;
            })(),
            positions: { x: 30, y: -15, z: -21.5 },
            boxes: await createInitialBoxesStructure(5, 0) // 5 rows, only first row has a box
        },
        {
            model: (() => {
                const scene = new THREE.Scene();
                scene.add(models.shelf2.clone());
                return scene;
            })(),
            positions: { x: 10, y: -15, z: -21.5 },
            boxes: await createInitialBoxesStructure(5, 1)
        },
        {
            model: (() => {
                const scene = new THREE.Scene();
                scene.add(models.shelf3.clone());
                return scene;
            })(),
            positions: { x: -10, y: -15, z: -21.5 },
            boxes: await createInitialBoxesStructure(5, 2)
        },
        {
            model: (() => {
                const scene = new THREE.Scene();
                scene.add(models.shelf4.clone());
                return scene;
            })(),
            positions: { x: -30, y: -15, z: -21.5 },
            boxes: await createInitialBoxesStructure(5, 3)
        }
    ];
};

const ShelfFloorIndex = computed(() => (number: number) => {
    switch (number) {
        case 0:
            return 1.78;
        case 1:
            return 1.380;
        case 2:
            return 0.980;
        case 3:
            return 0.580;
        case 4:
            return 0.180;
        default:
            return 0;
    }
});

// Configure texture
const configureTexture = (texture: THREE.Texture, repeatX = 1, repeatY = 1) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.needsUpdate = true;
    return texture;
};

// Helper function to create a serializable representation of SceneData
const createSerializableSceneData = (data: SceneData): any => {
    return {
        wallGeometries: data.wallGeometries,
        beamGeometries: data.beamGeometries,
        shelves: data.shelves.map(shelf => ({
            positions: shelf.positions,
            boxes: shelf.boxes.map((row, floorIndex) =>
                row.map((box, boxIndex) => ({
                    id: box.id,
                    content: box.content,
                    isAddBox: box.isAddBox,
                    floorIndex,
                    boxIndex
                }))
            )
        }))
    };
};

// Helper function to reconstruct SceneData from serializable format
const reconstructSceneData = async (savedData: any): Promise<SceneData> => {
    // Load required assets
    const models = await loadModels();
    const textures = await loadTextures();

    // Configure textures
    configureTexture(textures.floor, 5, 5);
    configureTexture(textures.ceiling, 5, 5);
    configureTexture(textures.wall, 1, 1);
    configureTexture(textures.beam, 1, 10);

    // Reconstruct shelves with their models and boxes
    const shelves = await Promise.all(savedData.shelves.map(async (shelfData: any, index: number) => {
        // Create shelf model
        const shelfScene = new THREE.Scene();
        shelfScene.add(models.shelves[`shelf${index + 1}`].clone());

        // Create shelf with its model
        const shelf: Shelf = {
            model: shelfScene,
            positions: shelfData.positions,
            boxes: []
        };

        // Rebuild boxes for each floor
        shelf.boxes = await Promise.all(shelfData.boxes.map(async (floorBoxes: any[]) => {
            if (!floorBoxes.length) return [];

            return Promise.all(floorBoxes.map(async (boxData) => {
                const { scene: boxModel } = await useGLTF('/beautiful_and_free_basic_cardboard_box_1m_size.glb', { draco: true });

                // Make the box interactive
                if (boxData.isAddBox) {
                    makeModelInteractive(boxModel, index.toString(), (_, id) => {
                        addBox(+id);
                    });
                    return {
                        id: boxData.id,
                        content: boxData.content,
                        model: await borderedBoxModel(boxModel),
                        isAddBox: true
                    };
                } else {
                    makeModelInteractive(boxModel, `${index}-${boxData.floorIndex}-${boxData.id}`, (_, id) => {
                        showModal.value = true;
                        const [shelf, floor, box] = id.split('-').map(Number);
                        selectedBox.value = sceneData.value?.shelves[shelf].boxes[floor][box];
                    });
                    return {
                        id: boxData.id,
                        content: boxData.content,
                        model: boxModel
                    };
                }
            }));
        }));

        // Position shelf
        shelfScene.position.set(
            shelfData.positions.x,
            shelfData.positions.y,
            shelfData.positions.z
        );
        shelfScene.scale.set(10, 10, 10);

        return shelf;
    }));

    return {
        textures,
        wallGeometries: savedData.wallGeometries || createWallGeometries(),
        beamGeometries: savedData.beamGeometries || createBeamGeometries(),
        shelves
    };
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

const shelfLoading = ref<boolean>(false);

const addBox = async (shelfIndex: number) => {
    shelfLoading.value = true
    if (!sceneData.value) return -1

    const currentFloorIndex = computed((): number => {
        if (!sceneData.value) return -1

        let floorNumber: number = 0;

        sceneData.value.shelves[shelfIndex].boxes.some(floor => {
            if (floor.length) {
                console.log(floor[floor.length - 1].isAddBox ? 4 : 5);
                if (floor.length < 4 || floor[floor.length - 1].isAddBox ) {
                    return floorNumber
                }
                floorNumber++
            }
        })

        return floorNumber
    })

    const { scene: box } = await useGLTF('/beautiful_and_free_basic_cardboard_box_1m_size.glb', { draco: true });

    const floor: Box[] = sceneData.value.shelves[shelfIndex].boxes[currentFloorIndex.value]
    const nextFloor: Box[] = sceneData.value.shelves[shelfIndex].boxes[currentFloorIndex.value + 1]

    const currentBoxId: number = floor.length
    
    floor.unshift({
        id: currentBoxId,
        model: box,
        content: []
    })

    makeModelInteractive(box, `${shelfIndex}-${currentFloorIndex.value}-${currentBoxId}`, (_, id) => {
        showModal.value = true
        const shelf: number = +id[0]
        const floor: number = +id[2]
        const box: number = +id[4]
        console.log(sceneData.value?.shelves[shelf].boxes[floor][box]);
        selectedBox.value = sceneData.value?.shelves[shelf].boxes[floor][box]
    })

    console.log(currentFloorIndex.value)

    if (floor.length === 5 && currentFloorIndex.value !== 4 ) {

        const elementToMove = floor.pop()

        if (currentFloorIndex.value === 4) {
            return
        }            
        nextFloor.push(elementToMove!);
    } else if (floor.length === 5 && currentFloorIndex.value === 4) {
        floor.splice(-1)
    }

    console.log(sceneData.value.shelves)
    shelfLoading.value = false
    
    const { saveScene } = useIndexedDB();
    await saveScene(createSerializableSceneData(sceneData.value));

}

// Initialize data with proper typing - use shallowRef for 3D objects
const sceneData = shallowRef<SceneData | null>(null);
const { loadScene } = useIndexedDB();

// Run initialization on component mount
onMounted(async () => {
    try {
        // First try to load the scene from IndexedDB
        const savedData = await loadScene();

        if (savedData) {
            // If we have saved data, reconstruct the scene
            sceneData.value = await reconstructSceneData(savedData);
        } else {
            // Otherwise initialize a new scene
            sceneData.value = await initializeScene();
        }
    } catch (error) {
        console.error("Error initializing scene:", error);
        // Fallback to creating a new scene if loading fails
        sceneData.value = await initializeScene();
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
            if (warehouseGroup.value) {
                warehouseGroup.value.position.set(animationTarget.x, animationTarget.y, animationTarget.z);
            }
        }
    });
});

// Save scene data when modal is closed
watch(showModal, async () => {
    if (!showModal.value && sceneData.value) {
        const { saveScene } = useIndexedDB();
        try {
            // Create a serializable version of the scene data
            const serializableData = createSerializableSceneData(sceneData.value);
            await saveScene(serializableData);
        } catch (error) {
            console.error("Error saving scene data:", error);
        }
    }
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
        <primitive v-if="sceneData && !shelfLoading" v-for="(shelf, shelfIndex) in sceneData.shelves"
            :key="`shelf-${shelfIndex}`" :object="shelf.model">
            <TresGroup v-for="(floor, floorIndex) in shelf.boxes" :key="`floor-${shelfIndex}-${floorIndex}`"
                :position="[0, ShelfFloorIndex(floorIndex)!, 0]">
                <primitive @pointer-enter="cursorStyle = 'pointer'" @pointer-leave="cursorStyle = 'auto'"
                    :rotation="[0, 1.64, 0]" :position="[boxPosition(boxIndex)!, 0, 0]" :scale="[1.5, 1.5, 1.5]"
                    v-for="(box, boxIndex) in floor" :key="`box-${shelfIndex}-${floorIndex}-${boxIndex}`"
                    :object="box.model" />
            </TresGroup>
        </primitive>
    </TresGroup>
</template>