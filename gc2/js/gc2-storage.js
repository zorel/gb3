class Gc2Storage {

    map = new Map();

    /**
     * 
     * @param {string} key 
     * @returns {string}
     */
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
        }
        try {
            return sessionStorage.getItem(key);
        } catch(e) {
        }
        return this.map.get(key);
    }


    /**
     * 
     * @param {string} key
     * @param {string} value
     */
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return;
        } catch (e) {
        }
        try {
            sessionStorage.setItem(key, value);
            return;
        } catch(e) {
        }
        this.map.set(key, value);
    }

    /**
     * 
     * @param {string} key
     */
    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return;
        } catch (e) {
        }
        try {
            sessionStorage.removeItem(key);
            return;
        } catch(e) {
        }
        this.map.delete(key);
    }
}

export const GC2_STORAGE = new Gc2Storage();