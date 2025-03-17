<script setup lang="ts">
import { TresCanvas } from '@tresjs/core';
import { OrbitControls } from '@tresjs/cientos';
import {
  SRGBColorSpace,
  NoToneMapping,
  TextureLoader,
  RepeatWrapping,
  LinearFilter,
  PCFSoftShadowMap,
} from 'three';
import { onMounted, ref } from 'vue';
import Room from './components/Room.vue';
import SwichSide from './components/SwichSide.vue';
import cursorStyle from "./stores/cursorStyle"
import Modal from "./components/Modal.vue"
import showModal from "./stores/modalStatus"

const texture = ref();

const gl = {
  shadows: true,
  alpha: false,
  shadowMapType: PCFSoftShadowMap, // Changed from BasicShadowMap for better shadows
  outputColorSpace: SRGBColorSpace,
  toneMapping: NoToneMapping,
  windowSize: true,
};

const container = ref<HTMLDivElement | null>(null);
const isModelFullScreen = ref<boolean>(false);
const showRotationMessage = ref<boolean>(false);

async function toggleFullScreen() {
    if (!document.fullscreenElement) {
        if (container.value?.requestFullscreen) {
            await container.value.requestFullscreen();
        }
        isModelFullScreen.value = true;
        checkDeviceOrientation();
    } else {
        if (document.exitFullscreen) {
            await document.exitFullscreen();
        }
        isModelFullScreen.value = false;
        showRotationMessage.value = false;
    }
}

function checkDeviceOrientation() {
    if (isModelFullScreen.value && window.innerWidth < window.innerHeight) {
        showRotationMessage.value = true;
    } else {
        showRotationMessage.value = false;
    }
}

function closeRotationMessage() {
    showRotationMessage.value = false;
}

</script>

<template>
  <div ref="container" class="containter">
    <SwichSide v-if="!showRotationMessage"/>
    <Modal v-if="showModal" />
    <div class="full-screen">
        <img src="./assets/fullscreen.svg" @click="toggleFullScreen" />
    </div>  
    <div v-if="showRotationMessage" class="rotation-message" id="rotationMessage">
      <div class="message-container">
          <button class="close-button" @click="closeRotationMessage()">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#0f172a">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
          </button>
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="#cbd5e1">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p class="message-text">برای تجربه بهتر لطفا گوشی خود را بچرخانید</p>
      </div>
    </div>
    <TresCanvas class="cursor-pointer" :class="cursorStyle === 'pointer' ? 'cursor-pointer' : 'cursor-default'"
      v-bind="gl" shadows>
      <TresPerspectiveCamera :position="[0, 5, 20]" :look-at="[0, 3, 0]" :far="6000" />
      <!-- <OrbitControls /> -->
      <Suspense>
        <Room />
      </Suspense>
    </TresCanvas>
  </div>
</template>


<style>
.containter{
  position: relative;
}

.full-screen {
  position: absolute;
  top: 1rem;     
  right: 5rem;    
  width: 1.25rem;  
  cursor: pointer;
  z-index: 10;
}

.cursor-pointer{
  cursor: pointer;
}

.cursor-default{
  cursor: default;
}

.rotation-message {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
    padding: 0 1rem;
}

.message-container {
    backdrop-filter: blur(4px);
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 0.5rem;
    padding: 1.5rem;
    max-width: 24rem;
    text-align: center;
    position: relative;
}

.close-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    color: #6b7280;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0.25rem;
}

.close-button:hover {
    color: #374151;
}

.icon {
    height: 3rem;
    width: 3rem;
    margin: 0 auto 1rem auto;
    color: #cbd5e1;
}

.message-text {
    font-size: 1.125rem;
    font-weight: 600;
    color: #cbd5e1;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.hidden {
    display: none;
}
</style>