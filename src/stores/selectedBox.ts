import { ref } from "vue";
import type { Box } from "../interfaces/types.ts"

const selectedBox = ref<{ id: string, box: Box}>()

export default selectedBox