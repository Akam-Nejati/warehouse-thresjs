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

export interface Box {
    content: string;
    model: THREE.Scene;
}