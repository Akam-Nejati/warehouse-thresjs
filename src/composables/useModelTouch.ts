// useModelInteraction.ts
import { ref, onMounted, onUnmounted, Ref } from 'vue'
import * as THREE from 'three'
import { useTresContext } from '@tresjs/core'

// Enhanced type for intersection callback that includes model ID
type IntersectionCallback = (intersection: THREE.Intersection, modelId: string) => void

// Enhanced type for interactive model entry with ID
interface InteractiveModel {
    model: THREE.Object3D;
    id: string;
    callback: IntersectionCallback;
}

type UnregisterFn = () => void

export function useModelInteraction() {
    const interactiveModels: Ref<InteractiveModel[]> = ref([])
    const { renderer, camera } = useTresContext()

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    // Enhanced function to register a model with an ID
    const makeModelInteractive = (
        model: THREE.Object3D,
        id: string,
        callback: IntersectionCallback
    ): UnregisterFn => {
        if (!model) return () => { }

        interactiveModels.value.push({ model, id, callback })

        return () => {
            const index = interactiveModels.value.findIndex(item => item.id === id)
            if (index !== -1) {
                interactiveModels.value.splice(index, 1)
            }
        }
    }

    const handleInteraction = (clientX: number, clientY: number): void => {
        if (!camera.value || !renderer.value || interactiveModels.value.length === 0) return

        const canvas = renderer.value.domElement
        const rect = canvas.getBoundingClientRect()
        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(pointer, camera.value)

        for (const { model, id, callback } of interactiveModels.value) {
            const intersects = raycaster.intersectObject(model, true)
            if (intersects.length > 0) {
                // Pass both the intersection data AND the model ID to the callback
                callback(intersects[0], id)
                break
            }
        }
    }

    const handleMouseClick = (event: MouseEvent): void => {
        handleInteraction(event.clientX, event.clientY)
    }

    const handleTouchStart = (event: TouchEvent): void => {
        event.preventDefault()
        const touch = event.touches[0]
        handleInteraction(touch.clientX, touch.clientY)
    }

    onMounted(() => {
        if (renderer.value) {
            const canvas = renderer.value.domElement
            canvas.addEventListener('click', handleMouseClick)
            canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
        }
    })

    onUnmounted(() => {
        if (renderer.value) {
            const canvas = renderer.value.domElement
            canvas.removeEventListener('click', handleMouseClick)
            canvas.removeEventListener('touchstart', handleTouchStart)
        }
    })

    return { makeModelInteractive }
}