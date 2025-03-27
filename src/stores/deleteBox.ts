// import { ref } from 'vue'

// Create a simple event bus
const event = {
    // Method to trigger an event in ChildOne
    triggerChildOneAction(data: any) {
        // This reference will be set by ChildOne
        if (this.deleteHandler) {
            this.deleteHandler(data)
        }
    },

    // This will hold the reference to ChildOne's method
    deleteHandler: null as ((data: any) => void) | null
}

export default event