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
  PerspectiveCamera,
} from 'three';
import { onMounted, ref } from 'vue';
import Room from './components/Room.vue';
import SwichSide from './components/SwichSide.vue';
import cursorStyle from "./stores/cursorStyle"

const texture = ref();

onMounted(async () => {
  try {
    const loader = new TextureLoader();
    texture.value = await loader.loadAsync('/winding-road-1556177_1280.jpg');
    texture.value.wrapS = RepeatWrapping;
    texture.value.wrapT = RepeatWrapping;
    texture.value.minFilter = LinearFilter;
    texture.value.needsUpdate = true;
  } catch (error) {
    console.error('Error loading texture:', error);
  }
});

const gl = {
  shadows: true,
  alpha: false,
  shadowMapType: PCFSoftShadowMap, // Changed from BasicShadowMap for better shadows
  outputColorSpace: SRGBColorSpace,
  toneMapping: NoToneMapping,
  windowSize: true,
};

</script>

<template>
  <SwichSide />
  <TresCanvas class="cursor-pointer" :class="cursorStyle === 'pinter' ? 'cursor-pointer' : 'cursor-default'" v-bind="gl"
    shadows>
    <TresPerspectiveCamera ref="cameraRef" :position="[0, 0, 20]" :look-at="[0, 5, 0]" :far="6000" />
    <OrbitControls />
    <Suspense>
      <Room />
    </Suspense>
  </TresCanvas>
</template>


<style>
.cursor-pointer{
  cursor: pointer;
}

.cursor-default{
  cursor: default;
}
</style>