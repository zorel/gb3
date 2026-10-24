import { GC2_STORAGE } from "./gc2-storage.js";

class Gc2Settings {
    handleNickname() {
        let nicknameInput = document.getElementById("nickname");
        nicknameInput.value = GC2_STORAGE.getItem("nickname") || "";
        nicknameInput.oninput = (e) => {
            GC2_STORAGE.setItem("nickname", e.target.value);
        };
    }

    async handleTribunes() {
        let storedTribunes = await GC2_STORAGE.getTribunes();
        /**
         * @type HTMLSelectElement
         */
        let tribuneSelect = document.getElementById("tribunes");
        for (let tribune of storedTribunes.availableTribunes) {
            /**
             * @type HTMLOptionElement
             */
            let option = document.createElement("option");
            option.value = tribune;
            option.selected = storedTribunes.selectedTribunes.includes(tribune);
            option.innerText = tribune;
            tribuneSelect.appendChild(option);
        }
        tribuneSelect.onchange = () => {
            let tribuneArray = [];
            for (let option of tribuneSelect.options) {
                if (option.selected) {
                    tribuneArray.push(option.value);
                }
            }
            GC2_STORAGE.setItem("tribunes", tribuneArray.join(","));
        };
    }

    handlePlopList() {
        let plopInput = document.getElementById("plopList");
        if (!plopInput) return;
        plopInput.value = GC2_STORAGE.getItem("plop_list") || "";
        plopInput.oninput = (e) => {
            // store raw CSV; the storage accessor getPlopList() will parse it when used
            GC2_STORAGE.setItem("plop_list", e.target.value);
        };
    }

    handleBlockedIdentities() {
        let input = document.getElementById("blockedIdentities");
        if (!input) return;
        input.value = GC2_STORAGE.getItem("blocked_identities") || "";
        input.oninput = (e) => {
            GC2_STORAGE.setItem("blocked_identities", e.target.value);
            window.dispatchEvent(new Event("gc2-blocked-identities-changed"));
        };
    }

    handleBlockedDisplayMode() {
        let select = document.getElementById("blockedDisplayMode");
        if (!select) return;
        select.value = GC2_STORAGE.getBlockedDisplayMode();
        select.onchange = (e) => {
            GC2_STORAGE.setItem("blocked_display_mode", e.target.value);
            window.dispatchEvent(new Event("gc2-blocked-identities-changed"));
        };
    }

    handleBackButton() {
        let backButton = document.getElementById("backButton");
        backButton.onclick = () => {
            window.location.href = "/";
        };
    }
}
const GC2_SETTINGS = new Gc2Settings();
GC2_SETTINGS.handleNickname();
GC2_SETTINGS.handleTribunes();
GC2_SETTINGS.handlePlopList();
GC2_SETTINGS.handleBlockedIdentities();
GC2_SETTINGS.handleBlockedDisplayMode();
GC2_SETTINGS.handleBackButton();
