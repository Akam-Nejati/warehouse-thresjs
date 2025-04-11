<template>
    <div v-if="showMessage" class="rotation-message">
        <div class="message-container">
            <button class="close-button" @click="closeMessage">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="icon-container">
                <svg xmlns="http://www.w3.org/2000/svg" class="rotate-icon" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </div>
            <p class="message-text">Please rotate your device for a better experience</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const showMessage = ref(false);

onMounted(() => {
    checkDeviceOrientation();
    window.addEventListener('resize', checkDeviceOrientation);
});

const checkDeviceOrientation = () => {
    // Check if it's a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
        // Check if the device is in portrait mode
        if (window.innerHeight > window.innerWidth) {
            showMessage.value = true;
        } else {
            showMessage.value = false;
        }
    } else {
        showMessage.value = false;
    }
};

const closeMessage = () => {
    showMessage.value = false;
    // Store in localStorage to prevent showing it again in this session
    localStorage.setItem('rotationMessageClosed', 'true');
};
</script>

<style scoped>
.rotation-message {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
}

.message-container {
    position: relative;
    width: 85%;
    max-width: 320px;
    background: rgba(30, 30, 40, 0.95);
    border-radius: 12px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(55, 55, 70, 0.3);
    color: white;
    padding: 25px 20px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(45, 45, 60, 0.6);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
}

.close-button:hover {
    background: rgba(65, 65, 85, 0.8);
}

.close-button svg {
    width: 16px;
    height: 16px;
}

.icon-container {
    margin: 15px 0 20px;
}

.rotate-icon {
    width: 50px;
    height: 50px;
    color: white;
    animation: rotate 2s infinite ease-in-out;
}

.message-text {
    font-size: 1.1rem;
    font-weight: 500;
    margin: 0;
    padding: 0;
    line-height: 1.5;
    direction: ltr;
}

@keyframes rotate {
    0% {
        transform: rotate(0deg);
    }

    50% {
        transform: rotate(180deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>