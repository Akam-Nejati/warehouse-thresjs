import * as THREE from "three"


export interface Shelf {
    model: THREE.Scene;
    positions: {
        x: number;
        y: number;
        z: number;
    },
    boxes: Box[][]
}

export interface BoxContent {
    name: string,
    count: number
}

export interface Box {
    id: number;
    content: BoxContent[];
    model: THREE.Scene;
    isAddBox?: boolean;
}

// Define types
export interface BeamGeometry {
    position: [number, number, number];
    width: number;
    height: number;
    depth: number;
}

export interface WallGeometry {
    position: [number, number, number];
    rotation: [number, number, number];
    width: number;
    height: number;
}

export interface SceneData {
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

export interface Models {
    shelves: Record<string, THREE.Object3D>,
} 