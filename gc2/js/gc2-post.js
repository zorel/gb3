import { GC2_STORAGE } from "./gc2-storage.js";

class Gc2PostIcon extends HTMLElement {
    /**
     * @type boolean
     */
    isMine;

    /**
     * @type boolean
     */
    isBigorno;

    /**
     * @type boolean
     */
    isReply;

    updateIcon(post, messageElement) {
        let nickname = GC2_STORAGE.getItem("nickname") || "";
        let login = GC2_STORAGE.getItem("linuxfr_login") || "";

        this.isMine =
            post.info === nickname ||
            (post.tribune === "dlfp" && post.login === login);

        this.isBigorno = false;
        let bigornos = messageElement.getElementsByTagName("gc2-bigorno");
        for (let bigorno of bigornos) {
            if (
                bigorno === nickname ||
                bigorno === login ||
                bigorno === "moules"
            ) {
                this.isBigorno = true;
                break;
            }
        }

        this.isReply = false;
        let norlogesInMessage =
            messageElement.getElementsByTagName("gc2-norloge");
        for (let norlogeInMessage of norlogesInMessage) {
            let postNorloges = document.querySelectorAll(
                `gc2-tribune[name="${post.tribune}"] gc2-post-norloge[title*=" ${norlogeInMessage.title.slice(-8)}"]`,
            );
            let postNorloge = postNorloges.item(postNorloges.length - 1);
            if (postNorloge) {
                let postIcon =
                    postNorloge.parentElement.querySelector("gc2-post-icon");
                if (postIcon && postIcon.isMine) {
                    this.isReply = true;
                    norlogeInMessage.classList.toggle(
                        "gc2-norloge-is-reply",
                        true,
                    );
                    break;
                }
            }
        }

        if (this.isMine) {
            this.innerText = "⭐";
        } else if (this.isReply) {
            this.innerText = "↩";
        } else if (this.isBigorno) {
            this.innerText = "📢";
        }
    }
}
customElements.define("gc2-post-icon", Gc2PostIcon);

function highlightNorloges(bouchot, norlogeText, showPopup = true) {
    let tribunes = document.getElementsByTagName("gc2-tribune");
    let popup = showPopup && document.querySelector("#gb3-post-popup-content");
    if (popup) {
        popup.innerHTML = "";
    }
    for (let t of tribunes) {
        let isSameBouchot = bouchot === t.getAttribute("name");
        let norloges = t.querySelectorAll(
            `gc2-norloge[title$="${norlogeText.slice(-8)}"]`,
        );
        for (let n of norloges) {
            if (isSameBouchot || n.getAttribute("bouchot") === bouchot) {
                n.classList.toggle("gc2-highlighted", true);
                n.parentElement.classList.toggle("gc2-highlighted", true);
            }
        }
        let postNorloges = t.querySelectorAll(
            `gc2-post-norloge[title*=" ${norlogeText.slice(-8)}"]`,
        );
        for (let n of postNorloges) {
            if (popup) {
                let postBoundingRect = n.parentElement.getBoundingClientRect();
                if (postBoundingRect.top < 0) {
                    popup.innerHTML += `<p>${n.parentElement.innerHTML}</p>`;
                }
            }
            if (isSameBouchot) {
                n.parentElement.classList.toggle("gc2-highlighted", true);
            }
        }
    }
}

function unhighlightNorloges() {
    let popup = document.querySelector("#gb3-post-popup-content");
    if (popup) {
        popup.innerHTML = "";
    }
    let norloges = document.querySelectorAll(".gc2-highlighted");
    for (let n of norloges) {
        n.classList.toggle("gc2-highlighted", false);
    }
}

class Gc2PostNorloge extends HTMLElement {
    constructor() {
        super();

        this.onmouseenter = (_e) => {
            highlightNorloges(
                this.closest("gc2-tribune").getAttribute("name"),
                this.title,
            );
        };

        this.onmouseleave = (_e) => {
            unhighlightNorloges();
        };

        this.onclick = (e) => {
            /**
             * @type HTMLInputElement
             */
            let message = document.getElementById("gc2-message");
            let style;
            if (e.ctrlKey && e.shiftKey) {
                style = "id";
            } else if (e.ctrlKey) {
                style = "iso";
            } else if (e.shiftKey) {
                style = "short";
            }
            if (message.selectionStart < message.value.length / 2) {
                let trimmedMessageValue = message.value.trimStart();
                message.value = `${this.formatNorloge(style)} ${trimmedMessageValue}`;
            } else {
                let trimmedMessageValue = message.value.trimEnd();
                message.value = `${trimmedMessageValue}${trimmedMessageValue && " "}${this.formatNorloge(style)} `;
            }
            message.focus();
        };
    }

    formatNorloge(style) {
        if (!style) {
            let now = new Date();
            let dateLocal = new Date(
                now.getTime() - now.getTimezoneOffset() * 60 * 1000,
            );
            let dateLocalStr = dateLocal.toISOString().slice(0, 10);
            if (this.title.slice(0, 10) === dateLocalStr) {
                style = "normal";
            } else {
                style = "longlong";
            }
        }
        switch (style) {
            case "iso":
                return `${this.title.slice(0, 10)}T${this.title.slice(11, 19)}`;
            case "long":
                return `${this.title.slice(5, 7)}/${this.title.slice(8, 102)}#${this.title.slice(11, 19)}`;
            case "normal":
                return this.title.slice(11, 19);
            case "short":
                return this.title.slice(11, 16);
            case "id":
                return `#${this.parentElement.id.split("@", 1)[0]}`;
            case "longlong":
            default:
                return this.title;
        }
    }
}
customElements.define("gc2-post-norloge", Gc2PostNorloge);

class Gc2Norloge extends HTMLElement {
    constructor() {
        super();

        this.onmouseenter = (_e) => {
            highlightNorloges(this.findBouchot(), this.title);
        };

        this.onmouseleave = (_e) => {
            unhighlightNorloges();
        };

        this.onclick = (e) => {
            let n = this.findQuotedNorloge();
            if (n) {
                let tribunes = document.querySelector("gc2-tribunes");
                if (tribunes) {
                    tribunes.scrollTop =
                        n.offsetTop - e.clientY + tribunes.offsetTop + 20;
                }
            }
        };
    }

    findBouchot() {
        return (
            this.getAttribute("bouchot") ||
            this.closest("gc2-tribune").getAttribute("name")
        );
    }

    findQuotedNorloge() {
        let bouchot = this.findBouchot();
        let gc2Main = document.querySelector("gc2-main");
        if (gc2Main) {
            gc2Main.setActiveTribune(bouchot);
        }
        let results = document.querySelectorAll(
            `gc2-tribune[name="${bouchot}"] gc2-post-norloge[title*=" ${this.title.slice(-8)}"]`,
        );
        return results.item(results.length - 1);
    }
}
customElements.define("gc2-norloge", Gc2Norloge);

class Gc2Moule extends HTMLElement {
    constructor() {
        super();
        this.onclick = (_e) => {
            let message = document.getElementById("gc2-message");
            message.value += `${message.value && " "}${this.innerText}< `;
            message.focus();
        };
    }
}
customElements.define("gc2-moule", Gc2Moule);

class Gc2Message extends HTMLElement {}
customElements.define("gc2-message", Gc2Message);

export class Gc2Post extends HTMLElement {
    /**
     * @type string
     */
    postId;

    /**
     * @type string
     */
    tribune;

    /**
     * @type Gc2PostIcon
     */
    postIcon;

    setupWithTribune(post) {
        let tribuneElement = document.createElement("gc2-post-tribune");
        tribuneElement.innerText = post.tribune;
        this.appendChild(tribuneElement);
        this.setup(post);
    }

    setup(post) {
        this.id = "".concat(post.id, "@", post.tribune);
        this.postId = post.id;
        this.tribune = post.tribune;

        this.iconElement = document.createElement("gc2-post-icon");
        this.appendChild(this.iconElement);

        let timeElement = document.createElement("gc2-post-norloge");
        let t = post.time;
        let dateText = `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`;
        let timeText = `${t.slice(8, 10)}:${t.slice(10, 12)}:${t.slice(12, 14)}`;
        timeElement.innerText = timeText;
        timeElement.title = `${dateText} ${timeText}`;
        this.appendChild(timeElement);

        let citeElement = document.createElement("gc2-moule");
        citeElement.innerText = post.login || post.info || "coward";
        citeElement.title = post.info;
        this.appendChild(citeElement);

        let messageElement = document.createElement("gc2-message");
        messageElement.innerHTML = post.message;
        this.appendChild(messageElement);

        this.iconElement.updateIcon(post, messageElement);
    }

    /**
     * @type boolean
     */
    get isMine() {
        return this.iconElement.isMine;
    }

    /**
     * @type boolean
     */
    get isBigorno() {
        return this.iconElement.isBigorno;
    }

    /**
     * @type boolean
     */
    get isReply() {
        return this.iconElement.isReply;
    }
}
customElements.define("gc2-post", Gc2Post);
