<script setup lang="ts">
import { TresCanvas } from '@tresjs/core';
import {
  SRGBColorSpace,
  NoToneMapping,
  PCFSoftShadowMap,
} from 'three';
import { ref, provide, computed, watch, onMounted } from 'vue';
import Room from './components/Room.vue';
import SwichSide from './components/SwichSide.vue';
import cursorStyle from "./stores/cursorStyle"
import Modal from "./components/Modal.vue"
import showModal from "./stores/modalStatus"
import SceneLoader from './components/SceneLoader.vue';
import ZoomSlider from './components/ZoomSlider.vue';
import FullscreenToggle from './components/FullscreenToggle.vue';
import RotationMessage from './components/RotationMessage.vue';

// Loader state that will be shared between App and Room
const loaderState = ref({
  progress: 0,
  isComplete: false,
  statusText: 'Initializing...'
});

// Camera state - make sure to initialize it from localStorage
const cameraZoom = ref(localStorage.getItem('cameraZoom') ? parseFloat(localStorage.getItem('cameraZoom')!) : 1);
const basePosition = [0, 5, 20]; // Base camera position

// Watch zoom changes and save to localStorage
watch(cameraZoom, (newZoom) => {
  localStorage.setItem('cameraZoom', newZoom.toString());
});

// Ensure zoom is properly initialized
onMounted(() => {
  // Force update of camera position based on stored zoom level
  const storedZoom = localStorage.getItem('cameraZoom');
  if (storedZoom) {
    cameraZoom.value = parseFloat(storedZoom);
  }
});

// Computed camera position that adjusts z-distance based on zoom factor
const cameraPosition = computed<[number, number, number]>(() => {
  // Keep x and y the same, but adjust z based on zoom
  return [
    basePosition[0],
    basePosition[1],
    basePosition[2] / cameraZoom.value
  ];
});

// Provide the loaderState to be consumed by child components
provide('loaderState', loaderState);

const gl = {
  shadows: true,
  alpha: false,
  shadowMapType: PCFSoftShadowMap, // Changed from BasicShadowMap for better shadows
  outputColorSpace: SRGBColorSpace,
  toneMapping: NoToneMapping,
  windowSize: true,
};

const container = ref<HTMLDivElement | null>(null);
const camera = ref(null);

// Handle zoom changes from the slider
const handleZoomChange = (zoomFactor: number) => {
  // Apply limits to prevent extreme zoom levels
  // The constraints help ensure the camera doesn't zoom too far in or out
  const MIN_ZOOM = 0.83;  // Minimum zoom level (much gentler zoom-out)
  const MAX_ZOOM = 1.5;   // Maximum zoom level (unchanged)

  // Clamp zoom factor between limits
  const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomFactor));
  cameraZoom.value = clampedZoom;
};
</script>

<template>
  <div ref="container" class="containter">
    <SwichSide />
    <Modal v-if="showModal" />
    <!-- Scene Loader that exists outside of TresCanvas -->
    <SceneLoader :progress="loaderState.progress" :is-complete="loaderState.isComplete"
      :status-text="loaderState.statusText" />
    <!-- Zoom Slider -->
    <ZoomSlider v-if="loaderState.isComplete" :onZoomChange="handleZoomChange" />
    <!-- Fullscreen toggle -->
    <FullscreenToggle />
    <!-- Rotation message for mobile -->
    <RotationMessage />
    <TresCanvas class="cursor-pointer" :class="cursorStyle === 'pointer' ? 'cursor-pointer' : 'cursor-default'"
      v-bind="gl" shadows>
      <TresPerspectiveCamera ref="camera" :position="cameraPosition" :look-at="[0, 3, 0]" :far="6000" />
      <Suspense>
        <Room />
      </Suspense>
    </TresCanvas>
  </div>
</template>


<style>
.containter {
  position: relative;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-default {
  cursor: default;
}

.hidden {
  display: none;
}
</style>