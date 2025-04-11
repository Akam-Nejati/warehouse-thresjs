<template>
    <div class="zoom-slider-container">
        <div class="zoom-inner">
            <div class="zoom-icon zoom-out">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
            </div>
            <input type="range" class="zoom-slider" min="-10" max="10" step="0.5" v-model="zoomValue"
                @input="updateZoom" />
            <div class="zoom-icon zoom-in">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
    onZoomChange: (value: number) => void;
}>();

// Calculate the slider value based on the zoom factor stored in localStorage
const getSliderValueFromZoomFactor = (zoomFactor: number): number => {
    // Inverse of our zoom calculation
    if (zoomFactor >= 1) {
        // Zoom-in: Convert from zoom factor to slider value (0 to 10)
        return (zoomFactor - 1) * 20;
    } else {
        // Zoom-out: Convert from zoom factor to slider value (-10 to 0)
        return (zoomFactor - 1) * 60;
    }
};

// Initialize with the stored zoom level
const storedZoom = localStorage.getItem('cameraZoom')
    ? parseFloat(localStorage.getItem('cameraZoom')!)
    : 1;

// Set the initial slider value based on the stored zoom factor
const zoomValue = ref(getSliderValueFromZoomFactor(storedZoom));

const updateZoom = () => {
    // Apply asymmetric sensitivity - stronger zoom-in, very gentle zoom-out
    let zoomFactor;

    if (zoomValue.value >= 0) {
        // Zoom-in (right side) - maintain current sensitivity
        zoomFactor = 1 + (zoomValue.value / 20); // Stronger zoom-in: up to 1.5 at max
    } else {
        // Zoom-out (left side) - significantly decrease sensitivity
        zoomFactor = 1 + (zoomValue.value / 60); // Much gentler zoom-out: down to 0.83 at min
    }

    props.onZoomChange(zoomFactor);
};

// Update the slider if the zoom changes from elsewhere
watch(() => localStorage.getItem('cameraZoom'), (newZoomStr) => {
    if (newZoomStr) {
        const newZoom = parseFloat(newZoomStr);
        zoomValue.value = getSliderValueFromZoomFactor(newZoom);
    }
});

// Initialize with stored zoom
onMounted(() => {
    updateZoom();
});
</script>

<style scoped>
.zoom-slider-container {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.zoom-inner {
    /* Dark theme styling to match the navigation */
    background: rgba(30, 30, 40, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 30px;
    padding: 12px 18px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(55, 55, 70, 0.3);
}

.zoom-icon {
    width: 24px;
    height: 24px;
    color: rgba(255, 255, 255, 0.95);
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
    transition: all 0.2s ease;
}

.zoom-icon:hover {
    color: white;
    filter: drop-shadow(0 0 3px rgba(100, 100, 255, 0.6));
    transform: scale(1.1);
}

.zoom-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    width: 180px;
    /* More visible track */
    background: rgba(80, 80, 100, 0.6);
    outline: none;
    border-radius: 4px;
    cursor: pointer;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(100, 100, 120, 0.4);
}

.zoom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    /* Dark theme thumb */
    background: rgba(45, 45, 60, 0.95);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.7);
    transition: all 0.2s ease;
}

.zoom-slider::-webkit-slider-thumb:hover {
    background: rgba(55, 55, 90, 0.95);
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(100, 100, 255, 0.4);
}

.zoom-slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    /* Dark theme thumb */
    background: rgba(45, 45, 60, 0.95);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.7);
    transition: all 0.2s ease;
}

.zoom-slider::-moz-range-thumb:hover {
    background: rgba(55, 55, 90, 0.95);
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(100, 100, 255, 0.4);
}

/* Active state for more interactivity */
.zoom-slider:active::-webkit-slider-thumb {
    background: rgba(55, 55, 100, 0.95);
    border: 2px solid rgba(255, 255, 255, 0.9);
}

.zoom-slider:active::-moz-range-thumb {
    background: rgba(55, 55, 100, 0.95);
    border: 2px solid rgba(255, 255, 255, 0.9);
}

/* Mobile optimization */
@media (max-width: 768px) {
    .zoom-slider-container {
        bottom: 15px;
    }

    .zoom-inner {
        padding: 8px 14px;
        gap: 10px;
    }

    .zoom-slider {
        width: 140px;
    }

    .zoom-icon {
        width: 20px;
        height: 20px;
    }
}
</style>