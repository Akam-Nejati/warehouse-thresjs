<template>
    <div class="fullscreen-toggle">
        <button @click="toggleFullScreen" class="fullscreen-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path
                    d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
        </button>
    </div>
</template>

<script setup lang="ts">
const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
};
</script>

<style scoped>
.fullscreen-toggle {
    position: fixed;
    top: 10px;
    right: 50px;
    z-index: 100;
}

.fullscreen-button {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(30, 30, 40, 0.85);
    border: 1px solid rgba(55, 55, 70, 0.3);
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    transition: all 0.3s ease;
}

.fullscreen-button:hover {
    background: rgba(45, 45, 60, 0.95);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.fullscreen-button svg {
    width: 20px;
    height: 20px;
}

/* Mobile optimization */
@media (max-width: 768px) {
    .fullscreen-button {
        width: 38px;
        height: 38px;
    }

    .fullscreen-button svg {
        width: 18px;
        height: 18px;
    }

    .fullscreen-toggle {
        right: 35px;
    }
}
</style>