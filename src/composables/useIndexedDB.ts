export function useIndexedDB() {
    const dbName = "myDatabase";
    const storeName = "scenes";
    const version = 1;

    function openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, version);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: "id" });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Failed to open IndexedDB");
        });
    }

    async function saveScene(sceneData: any) {
        const db = await openDB();
        const transaction = db.transaction("scenes", "readwrite");
        const store = transaction.objectStore("scenes");

        function cleanObject(obj: any): any {
            return JSON.parse(JSON.stringify(obj));
        }

        const cleanData = cleanObject(sceneData); // Remove non-serializable properties

        await store.put({ id: "sceneData", data: cleanData });

        transaction.oncomplete = () => console.log("Scene data saved!");
    }

    async function loadScene() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readonly");
            const store = transaction.objectStore(storeName);
            const getRequest = store.get("sceneData");

            getRequest.onsuccess = () => resolve(getRequest.result?.data || null);
            getRequest.onerror = () => reject("Failed to load scene");
        });
    }

    async function deleteScene() {
        const db = await openDB();
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        store.delete("sceneData");
    }

    return { saveScene, loadScene, deleteScene };
}
