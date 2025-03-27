<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

const container = ref<HTMLDivElement>()
const control = ref<HTMLDivElement>()
const sliderPosition = ref<number>()
const prevSliderPosition = ref<number>()
const isDragging = ref<boolean>()
const firstY = ref<number>()

function updateSliderPosition(clientY: number) {
  if (!container.value) return;
  

  const containerRect = container.value.getBoundingClientRect();

  const minPosition = 0;
  const maxPosition = containerRect.height;

  let newPosition = (clientY + 9) - containerRect.top;

  console.log("container --------> " + containerRect.top);
  console.log(containerRect);
  console.log(clientY);
  

  if (newPosition < minPosition) {
    newPosition = minPosition;
  } else if (newPosition > maxPosition) {
    newPosition = maxPosition;
  }

  sliderPosition.value = newPosition;
}

watch(sliderPosition, (newPosition, oldPosition) => {
  if (!control.value) return;

  if (newPosition === oldPosition) return;

  prevSliderPosition.value = oldPosition || control.value.offsetTop;
})

function handleSliderMouseDown(event: MouseEvent) {
  isDragging.value = true;
  firstY.value = event.clientY;
  event.preventDefault();
}

function handleSliderMove(event: MouseEvent | TouchEvent) {
  if (!isDragging.value) return;

  const clientY = 'touches' in event
    ? event.touches[0].clientY
    : event.clientY;

  updateSliderPosition(clientY);
}

function handleSliderEnd() {
  isDragging.value = false;
}

onMounted(() => {
  document.addEventListener('mousemove', handleSliderMove);
  document.addEventListener('mouseup', handleSliderEnd);
})
</script>

<template>
  <div class="sliders" ref="container">
    <div class="vertical">
      <div ref="control" class="controls" @mousedown="handleSliderMouseDown" :style="{ 'top': `${sliderPosition}px` }">
      </div>
    </div>
  </div>
</template>

<style>
.sliders {
  z-index: 100;
  height: 50vh;
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
}

.sliders .vertical {
  z-index: 100;
  position: absolute;
  right: 6rem;
  top: 50%;
  transform: translateY(-50%);
  height: 100%;
  padding: .5rem;
  border-radius: 50px;
  background-color: #535bf2;
}

.sliders .vertical .controls {
  width: 2rem;
  height: 2rem;
  content: "";
  display: block;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translateX(-50%) translateY(-50%);
  background-color: red;
  border-radius: 50px;
  cursor: pointer;
}
</style>