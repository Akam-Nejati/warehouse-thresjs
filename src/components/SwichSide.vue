<script setup lang="ts">
import { shelfNumber } from "../stores/shelfNumber"

function swichToRight() {
    if (shelfNumber.value !== 3) shelfNumber.value++
    
}

function swichToLeft() {
    if (shelfNumber.value !== 0) shelfNumber.value--

}
</script>

<template>
    <div class="left-box" @click="swichToLeft">
        <span class="arrow-left"></span>
    </div>
    <div class="right-box" @click="swichToRight">
        <span class="arrow-right"></span>
    </div>
</template>

<style>
.left-box,
.right-box {
    width: 4rem;
    height: 100dvh;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
    position: absolute;
    top: 0;
    background-color: rgba(0, 0, 0, 0.5);
    cursor: pointer;
}

.left-box {
    left: 0;
}

.right-box {
    right: 0;
}

.arrow-left,
.arrow-right {
    /* padding: 2rem; */
    width: 20px;
    height: 20px;
    border-top: 2px solid white;
    border-right: 2px solid white;
    transform: rotate(-120deg);
}

.arrow-right {
    transform: rotate(45deg);
}
</style>