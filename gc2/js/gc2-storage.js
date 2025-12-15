export class Gc2StoredTribunes {

    /**
     * @type Array<String>
     */
    availableTribunes;

    /**
     * @type Array<String>
     */
    static DEFAULT_TRIBUNES = ["devnewton", "dlfp", "gabuzomeu", "sveetch"];

    /**
     * @type Array<String>
     */
    selectedTribunes;
}

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


    async _retrieveAvailableTribunes() {
        let response = await fetch("/gb2c/list");
        let tribunes = await response.json();
        return tribunes;
    }

    /**
     * 
     * @returns {Gc2StoredTribunes}
     */
    async getTribunes() {
        let result = new Gc2StoredTribunes();
        result.availableTribunes = await this._retrieveAvailableTribunes();
        let storedTribunesString = GC2_STORAGE.getItem("tribunes");
        result.selectedTribunes = storedTribunesString ? storedTribunesString.split(",") : Gc2StoredTribunes.DEFAULT_TRIBUNES;
        return result;
    }
}

export const GC2_STORAGE = new Gc2Storage();