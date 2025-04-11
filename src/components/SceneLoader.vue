<template>
    <div class="loading-container" :style="{ opacity: fadeOut ? 0 : 1, visibility: fadeOut ? 'hidden' : 'visible' }">
        <div class="loader-content">
            <div class="spinner-container">
                <div class="progress-ring">
                    <div class="progress-circle" :style="{ transform: `rotate(${progress * 3.6}deg)` }"></div>
                </div>
                <div class="spinner-inner-circle"></div>
            </div>
            <div class="text-container">
                <div class="percentage">{{ Math.round(progress) }}%</div>
                <div class="status-text">{{ statusText }}</div>
            </div>
        </div>
        <!-- <div class="loading-dots">
            <span class="dot" v-for="i in 3" :key="i"></span>
        </div> -->
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
    progress: number;
    isComplete: boolean;
    statusText?: string;
}>();

const fadeOut = ref(false);

// Watch for completion to trigger the fade out
watch(() => props.isComplete, (isComplete) => {
    if (isComplete) {
        // Delay the fade out slightly to show 100%
        setTimeout(() => {
            fadeOut.value = true;
        }, 500);
    }
});
</script>

<style scoped>
.loading-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(18, 18, 24, 1);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    transition: opacity 0.8s ease-out, visibility 0.8s ease-out;
}

.loader-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.spinner-container {
    position: relative;
    width: 160px;
    height: 160px;
    margin-bottom: 20px;
}

.progress-ring {
    position: absolute;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background-color: #2a2a36;
    overflow: hidden;
}

.progress-circle {
    position: absolute;
    width: 50%;
    height: 100%;
    background-color: #4f46e5;
    right: 0;
    transform-origin: left center;
    transition: transform 0.3s ease;
    box-shadow: 0 0 15px rgba(79, 70, 229, 0.5);
}

.spinner-inner-circle {
    position: absolute;
    top: 20px;
    left: 20px;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background-color: rgba(18, 18, 24, 0.95);
    z-index: 1;
}

.text-container {
    text-align: center;
    color: #ffffff;
    font-family: sans-serif;
    margin-top: 15px;
    width: 100%;
}

.percentage {
    font-size: 2.5rem;
    font-weight: 700;
}

.status-text {
    font-size: 1.2rem;
    color: #a0aec0;
    margin-top: 0.5rem;
    max-width: 300px;
    margin: 0.5rem auto 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.loading-dots {
    display: flex;
    gap: 6px;
    margin-top: 5px;
}

.dot {
    width: 8px;
    height: 8px;
    background-color: #4f46e5;
    border-radius: 50%;
    display: inline-block;
    animation: pulse 1.5s infinite ease-in-out;
}

.dot:nth-child(2) {
    animation-delay: 0.2s;
}

.dot:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes pulse {

    0%,
    100% {
        transform: scale(0.8);
        opacity: 0.5;
    }

    50% {
        transform: scale(1.2);
        opacity: 1;
    }
}
</style>