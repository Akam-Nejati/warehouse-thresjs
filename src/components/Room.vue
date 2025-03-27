<script setup lang="ts">
import { useGLTF } from '@tresjs/cientos';
import { useTexture } from '@tresjs/core';
import * as THREE from 'three';
import { onMounted, ref, watch, shallowRef, computed, onUnmounted } from 'vue';
import type { Shelf, Box, BeamGeometry, Models, SceneData, WallGeometry } from '../interfaces/types';
import { shelfNumber } from "../stores/shelfNumber";
import cursorStyle from "../stores/cursorStyle";
import { useModelInteraction } from "../composables/useModelTouch";
import anime from 'animejs';
import selectedBox from '../stores/selectedBox';
import showModal from '../stores/modalStatus';
import { useIndexedDB } from "../composables/useIndexedDB";
import event from '../stores/deleteBox'


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

    // Add interactive behavior to the "add box" placeholder and store unregister callback
    const boxIdentifier = shelfId.toString();
    const unregister = makeModelInteractive(box, boxIdentifier, (_, id) => {
        addBox(+id);
    });
    unregisterCallbacks.value.set(boxIdentifier, unregister);

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
                    const boxIdentifier = index.toString();
                    const unregister = makeModelInteractive(boxModel, boxIdentifier, (_, id) => {
                        addBox(+id);
                    });
                    unregisterCallbacks.value.set(boxIdentifier, unregister);

                    // Set visibility based on whether it's in the last row and the row is full
                    if (boxData.floorIndex === 4) {
                        // Count regular boxes in this floor to determine if it's full
                        const regularBoxCount = floorBoxes.filter(b => !b.isAddBox).length;
                        const shouldBeVisible = regularBoxCount < 4;
                        boxModel.visible = shouldBeVisible;

                        // Only register the interactive handler if the placeholder should be visible
                        if (!shouldBeVisible) {
                            // If it's hidden, unregister the event handler
                            unregisterCallbacks.value.delete(boxIdentifier);
                            unregister(); // Call the unregister function we just created
                        }
                    }

                    return {
                        id: boxData.id,
                        content: boxData.content,
                        model: await borderedBoxModel(boxModel),
                        isAddBox: true
                    };
                } else {
                    const boxIdentifier = `${index}-${boxData.floorIndex}-${boxData.id}`;
                    const unregister = makeModelInteractive(boxModel, boxIdentifier, (_, id) => {
                        showModal.value = true;
                        console.log("hello")
                        const [shelf, floor, boxId] = id.split('-').map(Number);
                        const box = sceneData.value?.shelves[shelf].boxes[floor].find(box => {
                            console.log("Comparing:", box.id, boxId);
                            return box.id === boxId;
                        });
                        console.log("sceneData.value?.shelves[shelf].boxes")
                        if (box) {
                            selectedBox.value = {
                                id,
                                box
                            }
                        } else {
                            console.log("box not found")
                        }
                    });
                    unregisterCallbacks.value.set(boxIdentifier, unregister);

                    return {
                        id: boxData.id,
                        content: boxData.content || [], // Ensure content is never undefined
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

// Add a Map to store the unregister functions for each box
const unregisterCallbacks = ref(new Map<string, () => void>());

const addBox = async (shelfIndex: number) => {
    shelfLoading.value = true
    if (!sceneData.value) return -1

    const currentFloorIndex = computed((): number => {
        if (!sceneData.value) return -1

        let floorNumber: number = 0;

        sceneData.value.shelves[shelfIndex].boxes.some(floor => {
            if (floor.length) {
                console.log(floor[floor.length - 1].isAddBox ? 4 : 5);
                if (floor.length < 4 || floor[floor.length - 1].isAddBox) {
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

    console.log(floor[0].id)
    const currentBoxId: number = Date.now()

    // Find and remove the "add box" placeholder if it exists
    let placeholderBoxIndex = -1;
    let placeholderBox: Box | null = null;

    for (let i = 0; i < floor.length; i++) {
        if (floor[i].isAddBox) {
            placeholderBoxIndex = i;
            placeholderBox = floor[i];
            break;
        }
    }

    if (placeholderBoxIndex !== -1) {
        // Remove the placeholder from the current floor
        floor.splice(placeholderBoxIndex, 1);
    }

    // Add the new box to the end of the floor
    floor.push({
        id: currentBoxId,
        model: box,
        content: []
    });

    // Store the unregister callback with the box's unique identifier
    const boxIdentifier = `${shelfIndex}-${currentFloorIndex.value}-${currentBoxId}`;
    const unregister = makeModelInteractive(box, boxIdentifier, (_, id) => {
        showModal.value = true
        const [shelf, floor, boxId] = id.split('-').map(Number);
        const box = sceneData.value?.shelves[shelf].boxes[floor].find(box => {
            console.log("Comparing:", box.id, boxId);
            console.log(box.id === boxId);
            return box.id === boxId;
        });

        if (box) {
            selectedBox.value = {
                id,
                box
            }
        } else {
            console.log("box not found")
        }
    });

    unregisterCallbacks.value.set(boxIdentifier, unregister);

    // Check if the current floor is now full (4 regular boxes) and not the last floor
    if (floor.length === 4 && currentFloorIndex.value < 4) {
        // Move the placeholder to the next floor if it's not already there
        if (placeholderBox) {
            // Create a new interactive handler for the placeholder with the new floor
            const newPlaceholderIdentifier = shelfIndex.toString();
            const placeholderUnregister = unregisterCallbacks.value.get(shelfIndex.toString());
            if (placeholderUnregister) {
                placeholderUnregister();
                unregisterCallbacks.value.delete(shelfIndex.toString());
            }

            const newUnregister = makeModelInteractive(placeholderBox.model, newPlaceholderIdentifier, (_, id) => {
                addBox(+id);
            });
            unregisterCallbacks.value.set(newPlaceholderIdentifier, newUnregister);

            // Add the placeholder to the beginning of the next floor
            nextFloor.push(placeholderBox);
        }
    } else if (currentFloorIndex.value < 4 && placeholderBox) {
        // If the floor is not full, add the placeholder back at the end
        floor.push(placeholderBox);
    } else if (currentFloorIndex.value === 4) {
        if (floor.length < 4 && placeholderBox) {
            // Last row has space - show the placeholder
            // Make sure the placeholder is visible
            placeholderBox.model.visible = true;

            // Ensure the placeholder's click event is active
            const newPlaceholderIdentifier = shelfIndex.toString();
            const placeholderUnregister = unregisterCallbacks.value.get(shelfIndex.toString());
            if (placeholderUnregister) {
                placeholderUnregister();
                unregisterCallbacks.value.delete(shelfIndex.toString());
            }

            const newUnregister = makeModelInteractive(placeholderBox.model, newPlaceholderIdentifier, (_, id) => {
                addBox(+id);
            });
            unregisterCallbacks.value.set(newPlaceholderIdentifier, newUnregister);

            floor.push(placeholderBox);
        } else if (floor.length >= 4 && placeholderBox) {
            // Last row is full - hide the placeholder but keep it in the data structure
            placeholderBox.model.visible = false;

            // Disable the placeholder's click event when hidden
            const placeholderUnregister = unregisterCallbacks.value.get(shelfIndex.toString());
            if (placeholderUnregister) {
                placeholderUnregister();
                unregisterCallbacks.value.delete(shelfIndex.toString());
            }

            floor.push(placeholderBox);
        } else if (floor.length === 5) {
            // For the last row, if it's full, remove the oldest box
            floor.shift();
        }
    }

    console.log(sceneData.value.shelves)
    shelfLoading.value = false

    const { saveScene } = useIndexedDB();
    await saveScene(createSerializableSceneData(sceneData.value));
}

function removeAndShift<T>(array: Array<Array<T>>, row: number, col: number): Array<Array<T>> {
    // Get the dimensions of the original array
    const numRows: number = array.length;
    const rowLengths: number[] = array.map(row => row.length);
    // const totalElements: number = rowLengths.reduce((sum, length) => sum + length, 0);

    // Step 1: Flatten the array
    const flattened: T[] = [];
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array[i].length; j++) {
            flattened.push(array[i][j]);
        }
    }

    // Step 2: Find the index of the element to remove in the flattened array
    let flatIndex: number = 0;
    for (let i = 0; i < row; i++) {
        flatIndex += array[i].length;
    }
    flatIndex += col;

    // Step 3: Remove the element
    flattened.splice(flatIndex, 1);

    // Step 4: Reconstruct the array with the same dimensions
    const result: Array<Array<T>> = [];
    let currentIndex: number = 0;

    for (let i = 0; i < numRows; i++) {
        const newRow: T[] = [];
        // If this is the last row, add all remaining elements
        if (i === numRows - 1) {
            while (currentIndex < flattened.length) {
                newRow.push(flattened[currentIndex]);
                currentIndex++;
            }
        } else {
            // Otherwise, add the same number of elements as in the original row
            for (let j = 0; j < rowLengths[i]; j++) {
                // If we've reached the end of the flattened array, break
                if (currentIndex >= flattened.length) break;
                newRow.push(flattened[currentIndex]);
                currentIndex++;
            }
        }
        result.push(newRow);
    }

    return result;
}

// delete box
const deleteBox = async (data: string) => {
    shelfLoading.value = true

    const [shelf, floor, boxId] = data.split('-').map(Number);
    console.log(sceneData.value?.shelves[shelf].boxes);
    // find box index and remove it
    const boxIndex = sceneData.value?.shelves[shelf].boxes[floor].findIndex(box => box.id === boxId);
    console.log("Found box at index:", boxIndex);

    if (sceneData.value && boxIndex !== undefined && boxIndex !== -1) {
        try {
            // First, get a reference to the box's 3D model to dispose it properly
            const boxToDelete = sceneData.value.shelves[shelf].boxes[floor][boxIndex];

            // Dispose of the 3D model resources
            if (boxToDelete && boxToDelete.model) {
                const model = boxToDelete.model;

                // Remove the model from its parent in the scene
                if (model.parent) {
                    model.parent.remove(model);
                }

                // Dispose of any materials, geometries, and textures in the model
                model.traverse((object) => {
                    if (object instanceof THREE.Mesh) {
                        if (object.geometry) {
                            object.geometry.dispose();
                        }

                        if (object.material) {
                            // Handle array of materials
                            if (Array.isArray(object.material)) {
                                object.material.forEach(material => {
                                    disposeMaterial(material);
                                });
                            } else {
                                // Handle single material
                                disposeMaterial(object.material);
                            }
                        }
                    }
                });
            }

            // Helper function to dispose material and its textures
            function disposeMaterial(material: THREE.Material): void {
                // Dispose textures
                Object.keys(material).forEach(prop => {
                    const value = (material as any)[prop];
                    if (value instanceof THREE.Texture) {
                        value.dispose();
                    }
                });

                material.dispose();
            }

            // First, unregister the interactive event for the box being deleted
            const boxIdentifier = `${shelf}-${floor}-${boxId}`;
            if (unregisterCallbacks.value.has(boxIdentifier)) {
                const unregister = unregisterCallbacks.value.get(boxIdentifier);
                if (unregister) unregister();
                unregisterCallbacks.value.delete(boxIdentifier);
            }

            // Now remove the box from the data structure
            sceneData.value.shelves[shelf].boxes = removeAndShift<Box>(sceneData.value.shelves[shelf].boxes!, floor, boxIndex);

            // Rebuild all interactive handlers for remaining boxes in the affected shelf
            // Unregister existing callbacks for this shelf
            const shelfPrefix = `${shelf}-`;
            for (const [key, unregister] of Array.from(unregisterCallbacks.value.entries())) {
                if (key.startsWith(shelfPrefix)) {
                    unregister();
                    unregisterCallbacks.value.delete(key);
                }
            }

            // Re-register callbacks for all boxes in this shelf
            sceneData.value.shelves[shelf].boxes.forEach((floorBoxes, floorIndex) => {
                floorBoxes.forEach(box => {
                    // Check if this is the "add box" placeholder on the last row
                    if (floorIndex === 4 && box.isAddBox) {
                        // Make the placeholder visible again if there's space in the last row
                        if (floorBoxes.length <= 4) {
                            box.model.visible = true;

                            // Re-enable the placeholder's click event when visible
                            const placeholderId = shelf.toString();
                            const newUnregister = makeModelInteractive(box.model, placeholderId, (_, id) => {
                                addBox(+id);
                            });
                            unregisterCallbacks.value.set(placeholderId, newUnregister);
                        } else {
                            box.model.visible = false;

                            // Disable the placeholder's click event when hidden
                            const placeholderId = shelf.toString();
                            if (unregisterCallbacks.value.has(placeholderId)) {
                                const unregister = unregisterCallbacks.value.get(placeholderId);
                                if (unregister) unregister();
                                unregisterCallbacks.value.delete(placeholderId);
                            }
                        }

                        // Skip adding a regular interactive handler for the placeholder
                        // since we've handled it specially above
                        return;
                    }

                    const newIdentifier = `${shelf}-${floorIndex}-${box.id}`;
                    const unregister = makeModelInteractive(box.model, newIdentifier, (_, id) => {
                        showModal.value = true;
                        const [s, f, bId] = id.split('-').map(Number);
                        const foundBox = sceneData.value?.shelves[s].boxes[f].find(b => b.id === bId);

                        if (foundBox) {
                            selectedBox.value = {
                                id,
                                box: foundBox
                            };
                        } else {
                            console.log("box not found");
                        }
                    });
                    unregisterCallbacks.value.set(newIdentifier, unregister);
                });
            });

            // Force a re-render by creating a new shallow copy of the affected shelf's boxes
            // This ensures Vue detects the change and updates the DOM
            sceneData.value = {
                ...sceneData.value,
                shelves: sceneData.value.shelves.map((s, i) => {
                    if (i === shelf) {
                        return {
                            ...s,
                            boxes: [...s.boxes] // create a new array reference
                        };
                    }
                    return s;
                })
            };

            // Give the DOM a chance to update
            await new Promise(resolve => setTimeout(resolve, 10));

            console.log(sceneData.value.shelves[shelf].boxes)
            const { saveScene } = useIndexedDB();
            await saveScene(createSerializableSceneData(sceneData.value));
        } finally {
            shelfLoading.value = false
            showModal.value = false
        }
    } else {
        console.log("Box not found for deletion, ID:", boxId);
        shelfLoading.value = false;
    }
}

// Initialize data with proper typing - use shallowRef for 3D objects
const sceneData = shallowRef<SceneData | null>(null);
const { loadScene } = useIndexedDB();

// Run initialization on component mount
onMounted(async () => {
    try {
        // set delete method
        event.deleteHandler = deleteBox

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

// Clean up all interactive handlers when component is unmounted
onUnmounted(() => {
    // Call all unregister functions
    for (const unregister of unregisterCallbacks.value.values()) {
        unregister();
    }
    // Clear the map
    unregisterCallbacks.value.clear();
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