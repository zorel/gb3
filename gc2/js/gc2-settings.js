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
        for(let tribune of storedTribunes.availableTribunes) {
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
            for(let option of tribuneSelect.options) {
                if(option.selected) {
                    tribuneArray.push(option.value);
                }
            }
            GC2_STORAGE.setItem("tribunes", tribuneArray.join(","));
        }
    }

    handleBackButton() {
        let backButton = document.getElementById("backButton");
        backButton.onclick = () => {
            window.location.href = "/";
        }
    }
}
const GC2_SETTINGS = new Gc2Settings();
GC2_SETTINGS.handleNickname();
GC2_SETTINGS.handleTribunes();
GC2_SETTINGS.handleBackButton();
