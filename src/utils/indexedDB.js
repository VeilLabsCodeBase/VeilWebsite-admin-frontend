import { INDEXDB_NAME } from '@/utils/constants'
class DB {
    #dbName = INDEXDB_NAME
    #storeName = 'imgCachesData'
    #db

    // 打开数据库
    openStore() {
        if (this.#db) return

        const request = window.indexedDB.open(this.#dbName, 1)
        return new Promise((resolve, reject) => {
            request.onsuccess = event => {
                this.#db = event.target.result
                resolve(true)
            }
            request.onerror = event => reject(event)
            request.onupgradeneeded = event => {
                const { result } = event.target
                if (!result.objectStoreNames.contains(this.#storeName)) {
                    const store = result.createObjectStore(this.#storeName, { autoIncrement: true, keyPath: 'id' })
                    store.createIndex('', 'id', { unique: true })
                }
            }
        })
    }

    // 新增/修改 数据
    putItem(data) {
        const store = this.#db.transaction([this.#storeName], 'readwrite').objectStore(this.#storeName)
        const request = store.put({ ...data, updated_at: parseInt(new Date().getTime() / 1000) })
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(true)
            request.onerror = event => reject(event)
        })
    }

    // 删除数据
    deleteItem(id) {
        const store = this.#db.transaction([this.#storeName], 'readwrite').objectStore(this.#storeName)
        const request = store.delete(id)
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(true)
            request.onerror = event => reject(event)
        })
    }

    // 查询一条数据
    getItem(id) {
        const store = this.#db.transaction(this.#storeName).objectStore(this.#storeName)
        const request = store.get(id)
        return new Promise((resolve, reject) => {
            request.onsuccess = event => resolve(event.target.result)
            request.onerror = () => reject(false)
        })
    }

    // 查询所有数据
    getAllItems() {
        const store = this.#db.transaction(this.#storeName).objectStore(this.#storeName)
        const request = store.getAll()
        return new Promise((resolve, reject) => {
            request.onsuccess = event => resolve(event.target.result)
            request.onerror = () => reject(false)
        })
    }
}

const db = new DB()

export const dbPutItem = async data => {
    try {
        await db.openStore()
        db.putItem(data)
    } catch {}
}

export const dbDeleteItem = async id => {
    try {
        await db.openStore()
        db.deleteItem(id)
    } catch {}
}

export const dbGetItem = async id => {
    try {
        await db.openStore()
        return db.getItem(id)
    } catch {
        return false
    }
}

export const dbGetAllItems = async () => {
    try {
        await db.openStore()
        return db.getAllItems()
    } catch {
        return []
    }
}
