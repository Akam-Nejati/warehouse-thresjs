<template>
    <div class="modal-backdrop" @click="closeModal">
        <div class="modal-content" @click.stop>
            <!-- Close button -->
            <button class="close-icon" @click="closeModal">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            <!-- Main content area -->
            <div class="modal-body">
                <!-- Option buttons (default view) -->
                <div v-if="currentView === 'options'" class="option-buttons">
                    <h2>Warehouse Manager</h2>
                    <button class="action-button" @click="showAddForm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Product
                    </button>
                    <button class="action-button" @click="showProductList">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="9" y1="21" x2="9" y2="9"></line>
                        </svg>
                        View Products
                    </button>
                    <button class="action-button delete-box-button" @click="deleteBox">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                            </path>
                        </svg>
                        Delete Box
                    </button>
                </div>

                <!-- Add form -->
                <div v-if="currentView === 'add'" class="add-form">
                    <h3>Add New Product</h3>
                    <div class="form-group">
                        <input v-model="newName" type="text" class="name-input" placeholder="Product Name">
                        <input v-model.number="newCount" type="number" class="count-input" placeholder="Quantity">
                    </div>
                    <div class="form-actions">
                        <button @click="handleAdd" class="submit-button">Add Product</button>
                        <button @click="backToOptions" class="cancel-button">Cancel</button>
                    </div>
                </div>

                <!-- Product list -->
                <div v-if="currentView === 'products'" class="product-list">
                    <h3>All Products</h3>
                    <div v-if="items.length === 0" class="empty-state">
                        No products added yet.
                    </div>
                    <div v-else class="items-container">
                        <div v-for="(item, index) in items" :key="index" class="product-item">
                            <div class="item-content">
                                <div class="product-name">{{ item.name }}</div>
                                <div class="product-count">Qty: {{ item.count }}</div>
                            </div>
                            <div class="item-actions">
                                <button @click="editItem(index)" class="edit-button">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" class="icon-small">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                                <button @click="handleDelete(index)" class="delete-button">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" class="icon-small">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path
                                            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                                        </path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="list-actions">
                        <button @click="backToOptions" class="back-button">Back to Options</button>
                    </div>
                </div>

                <!-- Edit form -->
                <div v-if="currentView === 'edit'" class="edit-form">
                    <h3>Edit Product</h3>
                    <div class="form-group">
                        <input v-model="editingItem.name" type="text" class="name-input" placeholder="Product Name">
                        <input v-model.number="editingItem.count" type="number" class="count-input"
                            placeholder="Quantity">
                    </div>
                    <div class="form-actions">
                        <button @click="saveEdit" class="submit-button">Save Changes</button>
                        <button @click="showProductList" class="cancel-button">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, defineEmits, computed } from 'vue';
import selectedBox from '../stores/selectedBox';
import type { BoxContent } from "../interfaces/types.ts"
import showModal from '../stores/modalStatus.ts';
import event from '../stores/deleteBox'

const emit = defineEmits(['update:items', 'close']);

const items = computed<BoxContent[]>(() => selectedBox.value!.box.content)
const newName = ref('');
const newCount = ref(0);
const currentView = ref('options'); // options, add, products, edit
const editingItem = ref({ name: '', count: 0 });
const editingIndex = ref(-1);

function handleAdd() {
    if (newName.value.trim() !== '') {
        const newItems = [...items.value, {
            name: newName.value,
            count: newCount.value
        }];
        selectedBox.value!.box.content = newItems
        newName.value = '';
        newCount.value = 0;
        backToOptions();
    }
}

function handleDelete(index: number) {
    const newItems = [...items.value];
    newItems.splice(index, 1);
    selectedBox.value!.box.content = newItems
}

function updateName(index: number, event: Event) {
    const target = event.target as HTMLInputElement;
    const newItems = [...items.value];
    newItems[index] = {
        ...newItems[index],
        name: target.value
    };
    selectedBox.value!.box.content = newItems
}

function updateCount(index: number, event: Event) {
    const target = event.target as HTMLInputElement;
    const newItems = [...items.value];
    newItems[index] = {
        ...newItems[index],
        count: parseInt(target.value) || 0
    };
    selectedBox.value!.box.content = newItems
}

const deleteBox = () => {
    if (selectedBox.value) {
        event.triggerChildOneAction(selectedBox.value.id);
        closeModal();
    }
};

const closeModal = () => {
    showModal.value = false;
};

const showAddForm = () => {
    currentView.value = 'add';
    newName.value = '';
    newCount.value = 1;
};

const showProductList = () => {
    currentView.value = 'products';
};

const backToOptions = () => {
    currentView.value = 'options';
};

const editItem = (index: number) => {
    editingIndex.value = index;
    editingItem.value = { ...items.value[index] };
    currentView.value = 'edit';
};

const saveEdit = () => {
    if (editingItem.value.name.trim() && editingItem.value.count > 0) {
        const newItems = [...items.value];
        newItems[editingIndex.value] = editingItem.value;
        selectedBox.value!.box.content = newItems;
        showProductList();
    }
};
</script>

<style scoped>
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    position: relative;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    /* Dark theme matching slider and navigation */
    background: rgba(30, 30, 40, 0.95);
    border-radius: 12px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(55, 55, 70, 0.3);
    color: white;
    padding: 30px;
}

.close-icon {
    position: absolute;
    top: 15px;
    right: 15px;
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

.close-icon:hover {
    background: rgba(65, 65, 85, 0.8);
    transform: scale(1.1);
}

.close-icon svg {
    width: 16px;
    height: 16px;
}

.modal-body {
    margin-top: 10px;
}

h2 {
    color: white;
    font-size: 1.8rem;
    margin-bottom: 30px;
    text-align: center;
}

h3 {
    color: white;
    font-size: 1.4rem;
    margin-bottom: 20px;
    text-align: center;
}

.option-buttons {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 0 15px;
}

.action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(45, 45, 60, 0.8);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: 500;
    gap: 10px;
    transition: all 0.2s ease;
}

.action-button:hover {
    background: rgba(55, 55, 90, 0.9);
    transform: translateY(-2px);
}

.button-icon {
    width: 20px;
    height: 20px;
}

.form-group {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}

.name-input {
    padding: 12px 15px;
    border-radius: 6px;
    border: 1px solid rgba(75, 75, 90, 0.4);
    background: rgba(25, 25, 35, 0.6);
    color: white;
    font-size: 1rem;
}

.count-input {
    padding: 12px 15px;
    border-radius: 6px;
    border: 1px solid rgba(75, 75, 90, 0.4);
    background: rgba(25, 25, 35, 0.6);
    color: white;
    font-size: 1rem;
    width: 50%;
    align-self: flex-start;
}

.form-actions {
    display: flex;
    gap: 10px;
    justify-content: space-between;
}

.submit-button,
.back-button {
    padding: 12px 20px;
    border-radius: 6px;
    border: none;
    background: rgba(55, 55, 90, 0.95);
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;
}

.submit-button:hover,
.back-button:hover {
    background: rgba(75, 75, 120, 0.95);
}

.cancel-button {
    padding: 12px 20px;
    border-radius: 6px;
    border: 1px solid rgba(75, 75, 90, 0.4);
    background: rgba(35, 35, 45, 0.5);
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;
}

.cancel-button:hover {
    background: rgba(45, 45, 55, 0.7);
}

.product-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.empty-state {
    text-align: center;
    color: #a0aec0;
    padding: 30px 0;
}

.items-container {
    max-height: 50vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
    padding-right: 5px;
}

.product-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    background: rgba(40, 40, 55, 0.6);
    border-radius: 6px;
    border: 1px solid rgba(75, 75, 90, 0.3);
}

.item-content {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.product-name {
    font-weight: 500;
    font-size: 1.05rem;
}

.product-count {
    color: #a0aec0;
    font-size: 0.9rem;
}

.item-actions {
    display: flex;
    gap: 10px;
}

.edit-button,
.delete-button {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(45, 45, 60, 0.7);
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
}

.edit-button:hover {
    background: rgba(65, 65, 95, 0.8);
}

.delete-button {
    background: rgba(90, 45, 45, 0.7);
}

.delete-button:hover {
    background: rgba(120, 45, 45, 0.8);
}

.icon-small {
    width: 16px;
    height: 16px;
}

.list-actions {
    margin-top: 10px;
}

.delete-box-button {
    background: rgba(180, 45, 45, 0.8);
    border: 1px solid rgba(200, 60, 60, 0.3);
}

.delete-box-button:hover {
    background: rgba(220, 50, 50, 0.9);
}

/* Mobile optimization */
@media (max-width: 768px) {
    .modal-content {
        padding: 20px 15px;
        max-height: 80vh;
    }

    .option-buttons {
        gap: 10px;
    }

    .action-button {
        padding: 12px;
        font-size: 1rem;
    }

    h2 {
        font-size: 1.5rem;
        margin-bottom: 20px;
    }

    h3 {
        font-size: 1.2rem;
        margin-bottom: 15px;
    }

    .form-group {
        gap: 10px;
    }

    .name-input,
    .count-input {
        padding: 10px;
    }

    .submit-button,
    .back-button,
    .cancel-button {
        padding: 10px 15px;
    }

    .items-container {
        max-height: 40vh;
    }
}
</style>