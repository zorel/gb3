import { GC2_STORAGE } from "./gc2-storage.js";

let linuxfrInfo = document.getElementById("linuxfr-info");
try {
    let tokenStr = window.atob(window.location.hash.slice(1));
    let token = JSON.parse(tokenStr);
    GC2_STORAGE.setItem("linuxfr_access_token", token.access_token);
    GC2_STORAGE.setItem("linuxfr_refresh_token", token.refresh_token);
    GC2_STORAGE.setItem(
        "linuxfr_expires_at",
        Date.now() + token.expires_in * 1000,
    );
    GC2_STORAGE.setItem("linuxfr_login", token.login);
    linuxfrInfo.innerText =
        "Authorization token successfullty received from linuxfr :-)";
    window.location.href = "/";
} catch (error) {
    console.error(error);
    linuxfrInfo.innerText = "Cannot read authorization token from linuxfr :-(";
}
