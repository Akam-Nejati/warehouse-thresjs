<template>
    <div class="modal-backdrop" @click="$emit('close')">
        <div class="modal-content" @click.stop>
            <h2>Todo Manager</h2>

            <!-- Input form row -->
            <div class="input-row">
                <input v-model.number="newCount" type="number" class="count-input" placeholder="Count" />
                <input v-model="newName" type="text" class="name-input" placeholder="Name" />
                <button @click="handleAdd" class="add-button">Add Item</button>
            </div>

            <!-- Item list -->
            <div class="item-list">
                <div v-for="(item, index) in items" :key="index" class="item">
                    <div class="item-content">
                        <input :value="item.count" @input="updateCount(index, $event)" type="number"
                            class="edit-count" />
                        <input :value="item.name" @input="updateName(index, $event)" type="text" class="edit-name" />
                    </div>
                    <div class="item-actions">
                        <button @click="handleDelete(index)" class="delete-button">Delete</button>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button @click="showModal = false" class="close-button">Close</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, defineEmits, computed } from 'vue';
import selectedBox from '../stores/selectedBox';
import type { BoxContent } from "../interfaces/types.ts"
import showModal from '../stores/modalStatus.ts';

const emit = defineEmits(['update:items', 'close']);

const items = computed<BoxContent[]>(() => selectedBox.value!.content)
const newName = ref('');
const newCount = ref(0);

function handleAdd() {
    if (newName.value.trim() !== '') {
        const newItems = [...items.value, {
            name: newName.value,
            count: newCount.value
        }];
        selectedBox.value!.content = newItems
        newName.value = '';
        newCount.value = 0;
    }
}

function handleDelete(index: number) {
    const newItems = [...items.value];
    newItems.splice(index, 1);
    selectedBox.value!.content = newItems
}

function updateName(index: number, event: Event) {
    const target = event.target as HTMLInputElement;
    const newItems = [...items.value];
    newItems[index] = {
        ...newItems[index],
        name: target.value
    };
    selectedBox.value!.content = newItems
}

function updateCount(index: number, event: Event) {
    const target = event.target as HTMLInputElement;
    const newItems = [...items.value];
    newItems[index] = {
        ...newItems[index],
        count: parseInt(target.value) || 0
    };
    selectedBox.value!.content = newItems
}
</script>

<style scoped>
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    width: 500px;
    max-width: 90%;
    max-height: 80vh;
    overflow-y: auto;
}

h2 {
    margin-top: 0;
    margin-bottom: 20px;
}

.input-row {
    display: flex;
    margin-bottom: 20px;
    gap: 10px;
}

.count-input {
    width: 80px;
}

.name-input {
    flex-grow: 1;
}

.item-list {
    margin-bottom: 20px;
}

.item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;
}

.item-content {
    display: flex;
    gap: 10px;
    flex-grow: 1;
}

.edit-count {
    width: 80px;
}

.edit-name {
    flex-grow: 1;
}

.item-actions {
    margin-left: 10px;
}

button {
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.add-button {
    background-color: #4CAF50;
    color: white;
}

.delete-button {
    background-color: #f44336;
    color: white;
}

.close-button {
    background-color: #ccc;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
}
</style>