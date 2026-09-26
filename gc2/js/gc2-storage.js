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

    /**
     * Get the "plop list" as an array of strings. Stored under key "plop_list" as comma-separated values.
     * @returns {Array<string>}
     */
    getPlopList() {
        try {
            let stored = this.getItem("plop_list");
            if (!stored || stored.length === 0) return [];
            return stored.split(",").map(s => s.trim()).filter(Boolean);
        } catch (e) {
            return [];
        }
    }

    /**
     * Set the "plop list" from an array of strings
     * @param {Array<string>} list
     */
    setPlopList(list) {
        try {
            this.setItem("plop_list", list.join(","));
        } catch (e) {
            // ignore
        }
    }

    getBlockedIdentities() {
        try {
            let stored = this.getItem("blocked_identities");
            if (!stored || stored.length === 0) return [];
            return stored.split(",").map(s => s.trim()).filter(Boolean);
        } catch (e) {
            return [];
        }
    }

    getBlockedDisplayMode() {
        return this.getItem("blocked_display_mode") === "gray" ? "gray" : "hide";
    }
}

export const GC2_STORAGE = new Gc2Storage();
