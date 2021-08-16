import { GC2_STORAGE } from "./gc2-storage.js";

let nickname = document.getElementById("nickname");
nickname.value = GC2_STORAGE.getItem("nickname") || "";
nickname.oninput = (e) => {
    GC2_STORAGE.setItem("nickname", e.target.value);
};

let backButton = document.getElementById("backButton");
backButton.onclick = () => {
    window.location.href = "/";
}