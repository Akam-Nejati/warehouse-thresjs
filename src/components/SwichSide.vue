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
    <div class="side-navigation">
        <div class="glass-nav-button left-box" @click="swichToLeft">
            <span class="arrow-left"></span>
        </div>
        <div class="glass-nav-button right-box" @click="swichToRight">
            <span class="arrow-right"></span>
        </div>
    </div>
</template>

<style scoped>
.side-navigation {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 90;
}

.glass-nav-button {
    width: 2.5rem;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0;
    transform: none;
    cursor: pointer;
    pointer-events: auto;

    /* Lighter dark styling */
    background: rgba(30, 30, 40, 0.85);
    border: none;
    border-radius: 0;
    box-shadow: none;

    /* Transition for hover effects */
    transition: all 0.3s ease;
    overflow: hidden;
}

.glass-nav-button::before {
    content: none;
}

.left-box {
    left: 0;
}

.right-box {
    right: 0;
}

.arrow-left,
.arrow-right {
    width: 18px;
    height: 18px;
    border-top: 3px solid rgba(255, 255, 255, 0.95);
    border-right: 3px solid rgba(255, 255, 255, 0.95);
    transform: rotate(-135deg);
    /* Left arrow */
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
    transition: all 0.2s ease;
}

.arrow-right {
    transform: rotate(45deg);
    /* Right arrow */
}

/* Hover effects */
.glass-nav-button:hover {
    background: rgba(45, 45, 60, 0.95);
}

.glass-nav-button:hover .arrow-left,
.glass-nav-button:hover .arrow-right {
    border-color: #ffffff;
    filter: drop-shadow(0 0 4px rgba(100, 100, 255, 0.6));
    transform: scale(1.1) rotate(-135deg);
}

.glass-nav-button:hover .arrow-right {
    transform: scale(1.1) rotate(45deg);
}

/* Active effects */
.glass-nav-button:active {
    background: rgba(55, 55, 90, 0.95);
    border: none;
}

.glass-nav-button:active .arrow-left,
.glass-nav-button:active .arrow-right {
    border-color: #ffffff;
}

/* Mobile optimization */
@media (max-width: 768px) {
    .glass-nav-button {
        width: 1.8rem;
    }

    .arrow {
        height: 1.2rem;
        width: 1.2rem;
    }
}
</style>