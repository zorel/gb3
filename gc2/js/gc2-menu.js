function gc2CloseMenu() {
    let menu = document.getElementsByTagName("gc2-menu")[0];
    menu.style.display = "none";
    menu.clear();
    document.querySelector("gc2-main").style.display = "";
}

export class Gc2Menu extends HTMLElement {
    constructor() {
        super();
        this.style.display = "none";
        this.showSelector();
    }

    showSelector() {
        this.clear();

        let totozButton = document.createElement("button");
        totozButton.innerText = "😱 Totoz";
        totozButton.onclick = () => {
            this.showComponent("gc2-totozsearch");
        };
        this.appendChild(totozButton);

        let emojiButton = document.createElement("button");
        emojiButton.innerText = "💩 Emoji";
        emojiButton.onclick = () => {
            this.showComponent("gc2-emojisearch");
        };
        this.appendChild(emojiButton);

        let attachButton = document.createElement("button");
        attachButton.innerText = "📎 Attach";
        attachButton.onclick = () => {
            this.showComponent("gc2-attach");
        };
        this.appendChild(attachButton);

        let altButton = document.createElement("button");
        altButton.innerText = "⎇ ALT";
        altButton.onclick = () => {
            this.showComponent("gc2-alt");
        };
        this.appendChild(altButton);

        let settingsButton = document.createElement("button");
        settingsButton.innerText = "⚙ Settings";
        settingsButton.onclick = () => {
            window.location.href = "/settings.html";
        };
        this.appendChild(settingsButton);

        let backButton = document.createElement("button");
        backButton.innerText = "↩ Back";
        backButton.onclick = () => {
            gc2CloseMenu();
        };
        this.appendChild(backButton);

        let aboutLink = document.createElement("a");
        aboutLink.innerText = "About gb3";
        aboutLink.href = "https://codeberg.org/devnewton/gb3";
        aboutLink.target = "_blank";
        this.appendChild(aboutLink);
    }

    showComponent(componentName) {
        this.clear();

        let component = document.createElement(componentName);
        this.appendChild(component);
        component.focus();

        let backButton = document.createElement("button");
        backButton.innerText = "Back";
        backButton.onclick = () => {
            this.showSelector();
        };
        this.appendChild(backButton);
    }

    showOnlyTotozSearch() {
        this.showOnlyComponent("gc2-totozsearch");
    }

    showOnlyEmojiSearch() {
        this.showOnlyComponent("gc2-emojisearch");
    }

    showOnlyAttach() {
        this.showOnlyComponent("gc2-attach");
    }

    showOnlyComponent(componentName) {
        this.clear();

        let component = document.createElement(componentName);
        this.appendChild(component);
        component.focus();

        let backButton = document.createElement("button");
        backButton.innerText = "Back";
        backButton.onclick = () => {
            gc2CloseMenu();
        };
        this.appendChild(backButton);
    }

    clear() {
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }
    }
}
customElements.define("gc2-menu", Gc2Menu);

class Gc2TotozSearch extends HTMLElement {
    /**
     * @type HTMLInputElement
     */
    searchInput;

    /**
     * @type HTMLDivElement
     */
    resultsContainer;

    constructor() {
        super();
    }

    connectedCallback() {
        let form = document.createElement("form");

        this.searchInput = document.createElement("input");
        this.searchInput.enterKeyHint = "search";
        this.searchInput.type = "text";
        this.searchInput.placeholder = "dont be so vanilla";
        form.appendChild(this.searchInput);

        let searchButton = document.createElement("button");
        searchButton.innerText = "Search";
        searchButton.type = "submit";
        form.appendChild(searchButton);

        form.onsubmit = async (e) => {
            e.preventDefault();

            try {
                const response = await fetch(
                    `/gb2c/totoz/search?terms=${encodeURIComponent(this.searchInput.value)}`,
                    { method: "GET" },
                );
                this.setResults(await response.json());
            } catch (error) {
                console.log(`Cannot search totoz. Error: `, error);
            }
        };
        this.appendChild(form);

        this.resultsContainer = document.createElement("div");
        this.resultsContainer.onclick = (e) => {
            let caption;
            switch (e.target.tagName) {
                case "FIGURE":
                    caption = e.target.querySelector("figcaption");
                    break;
                case "IMG":
                    caption =
                        e.target.parentElement.querySelector("figcaption");
                    break;
                case "FIGCAPTION":
                    caption = e.target;
                    break;
            }
            if (caption) {
                let message = document.getElementById("gc2-message");
                message.value += `${message.value && " "}[:${caption.innerText}] `;
                gc2CloseMenu();
                message.focus();
            }
        };
        this.resultsContainer.classList.add("gc2-totoz-search-results");
        this.appendChild(this.resultsContainer);
    }

    focus() {
        this.searchInput.focus();
    }

    setResults(results) {
        this.clearResults();
        for (let totoz of results.totozes) {
            let totozElement = document.createElement("figure");

            let totozImg = document.createElement("img");
            totozImg.loading = "lazy";
            totozImg.src = totoz.image;
            totozElement.appendChild(totozImg);

            let totozName = document.createElement("figcaption");
            totozName.innerText = totoz.name;
            totozElement.appendChild(totozName);

            this.resultsContainer.appendChild(totozElement);
        }
    }

    clearResults() {
        while (this.resultsContainer.firstChild) {
            this.resultsContainer.removeChild(this.resultsContainer.firstChild);
        }
    }
}
customElements.define("gc2-totozsearch", Gc2TotozSearch);

class Gc2EmojiSearch extends HTMLElement {
    constructor() {
        super();
    }

    /**
     * @type HTMLInputElement
     */
    searchInput;

    connectedCallback() {
        let form = document.createElement("form");

        this.searchInput = document.createElement("input");
        this.searchInput.enterKeyHint = "search";
        this.searchInput.type = "text";
        this.searchInput.placeholder = "poop";
        form.appendChild(this.searchInput);

        let searchButton = document.createElement("button");
        searchButton.innerText = "Search";
        form.appendChild(searchButton);

        form.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const response = await fetch(
                    `/gb2c/emoji/search?terms=${encodeURIComponent(this.searchInput.value)}`,
                    { method: "GET" },
                );
                this.setResults(await response.json());
            } catch (error) {
                console.log(`Cannot search emoji. Error: `, error);
            }
        };
        this.appendChild(form);

        this.resultsContainer = document.createElement("div");
        this.resultsContainer.onclick = (e) => {
            let characters;
            switch (e.target.tagName) {
                case "FIGURE":
                    characters = e.target.querySelector(
                        ".gc2-emoji-characters",
                    );
                    break;
                case "FIGCAPTION":
                    characters = e.target.parentElement.querySelector(
                        ".gc2-emoji-characters",
                    );
                    break;
                default:
                    if (e.target.classList.contains("gc2-emoji-characters")) {
                        characters = e.target;
                    }
            }
            if (characters) {
                let message = document.getElementById("gc2-message");
                message.value += `${message.value && " "}${characters.innerText} `;
                gc2CloseMenu();
                message.focus();
            }
        };
        this.resultsContainer.classList.add("gc2-emoji-search-results");
        this.appendChild(this.resultsContainer);
    }

    focus() {
        this.searchInput.focus();
    }

    setResults(results) {
        this.clearResults();
        for (let emoji of results) {
            let emojiElement = document.createElement("figure");

            let emojiCharacters = document.createElement("p");
            emojiCharacters.innerText = emoji.characters;
            emojiCharacters.classList.add("gc2-emoji-characters");
            emojiElement.appendChild(emojiCharacters);

            let emojiName = document.createElement("figcaption");
            emojiName.innerText = emoji.name;
            emojiElement.appendChild(emojiName);

            this.resultsContainer.appendChild(emojiElement);
        }
    }

    clearResults() {
        while (this.resultsContainer.firstChild) {
            this.resultsContainer.removeChild(this.resultsContainer.firstChild);
        }
    }
}
customElements.define("gc2-emojisearch", Gc2EmojiSearch);

class Gc2Attach extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        let form = document.createElement("form");
        form.enctype = "multipart/form-data";
        form.method = "post";

        let fileInput = document.createElement("input");
        fileInput.name = "attachment";
        fileInput.type = "file";
        form.appendChild(fileInput);

        let attachButton = document.createElement("button");
        attachButton.innerText = "Attach";
        form.appendChild(attachButton);

        let progress = document.createElement("img");
        progress.classList.add("gc2-attach-progress");

        let uploadError = document.createElement("p");

        form.onsubmit = async (e) => {
            e.preventDefault();
            progress.src = "/img/loading.svg";

            try {
                const response = await fetch(`/gb2c/attachment/`, {
                    method: "POST",
                    body: new FormData(form),
                });

                progress.src = "";
                let location = response.headers.get("Location");
                if (location) {
                    uploadError.innerText = "";
                    let message = document.getElementById("gc2-message");
                    message.value += `${message.value && " "}${location} `;
                    gc2CloseMenu();
                    message.focus();
                    return;
                }

                switch (response.status) {
                    case 413:
                        uploadError.innerText =
                            "Cannot attach file: file is too large, try less than 1mo.";
                        break;
                    default:
                        uploadError.innerText = `Cannot attach file: http response is ${response.status} ${response.statusText}`;
                        break;
                }
            } catch (error) {
                progress.src = "";
                uploadError.innerText = "Cannot attach file: unknown error";
                console.log(`Cannot attach file. Error: `, error);
            }
        };
        this.appendChild(form);

        this.appendChild(progress);
        this.appendChild(uploadError);

        let imagePreview = document.createElement("img");
        this.appendChild(imagePreview);
        let audioPreview = document.createElement("audio");
        audioPreview.controls = true;
        this.appendChild(audioPreview);
        let videoPreview = document.createElement("video");
        videoPreview.controls = true;
        this.appendChild(videoPreview);

        let updatePreview = () => {
            imagePreview.style.display = "none";
            audioPreview.style.display = "none";
            audioPreview.pause();
            audioPreview.removeAttribute("src");
            audioPreview.load();
            videoPreview.style.display = "none";
            videoPreview.pause();
            videoPreview.removeAttribute("src");
            videoPreview.load();
            if (fileInput.files && fileInput.files.length === 1) {
                let file = fileInput.files[0];
                let type = file.type;
                if (type.startsWith("image")) {
                    imagePreview.src = window.URL.createObjectURL(file);
                    imagePreview.style.display = "";
                } else if (type.startsWith("audio")) {
                    audioPreview.src = window.URL.createObjectURL(file);
                    audioPreview.style.display = "";
                } else if (type.startsWith("video")) {
                    videoPreview.src = window.URL.createObjectURL(file);
                    videoPreview.style.display = "";
                }
            }
        };

        updatePreview();
        fileInput.onchange = () => updatePreview();

        document.addEventListener("paste", (event) => {
            if (!(
                form.offsetWidth ||
                form.offsetHeight ||
                form.getClientRects().length
            )) {
                return;
            }
            let files = (
                event.clipboardData || event.originalEvent.clipboardData
            ).files;
            if (files && files.length === 1) {
                fileInput.files = files;
                updatePreview();
            }
            event.preventDefault();
        });
    }

    focus() {
        //no component to focus
    }
}
customElements.define("gc2-attach", Gc2Attach);

class Gc2Alt extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        let blamButton = document.createElement("button");
        blamButton.innerText = "BLAM";
        blamButton.onclick = () => {
            document.getElementsByTagName("gc2-main")[0].altBlam();
            gc2CloseMenu();
            document.getElementById("gc2-message").focus();
        };
        this.appendChild(blamButton);

        let momentButton = document.createElement("button");
        momentButton.innerText = "Moment";
        momentButton.onclick = () => {
            document.getElementsByTagName("gc2-main")[0].altMoment();
            gc2CloseMenu();
            document.getElementById("gc2-message").focus();
        };
        this.appendChild(momentButton);

        let phiButton = document.createElement("button");
        phiButton.innerText = "φ";
        phiButton.onclick = () => {
            document.getElementsByTagName("gc2-main")[0].altPhi();
            gc2CloseMenu();
            document.getElementById("gc2-message").focus();
        };
        this.appendChild(phiButton);

        let boldButton = document.createElement("button");
        boldButton.innerText = "Bold";
        boldButton.onclick = () => {
            document.getElementsByTagName("gc2-main")[0].altBold();
            gc2CloseMenu();
            document.getElementById("gc2-message").focus();
        };
        this.appendChild(boldButton);

        let italicButton = document.createElement("button");
        italicButton.innerText = "Italic";
        italicButton.onclick = () => {
            document.getElementsByTagName("gc2-main")[0].altItalic();
            gc2CloseMenu();
            document.getElementById("gc2-message").focus();
        };
        this.appendChild(italicButton);

        let underlineButton = document.createElement("button");
        underlineButton.innerText = "Underline";
        underlineButton.onclick = () => {
            document.getElementsByTagName("gc2-main")[0].altUnderline();
            gc2CloseMenu();
            document.getElementById("gc2-message").focus();
        };
        this.appendChild(underlineButton);

        let strikeThroughButton = document.createElement("button");
        strikeThroughButton.innerText = "Strike through";
        strikeThroughButton.onclick = () => {
            document.getElementsByTagName("gc2-main")[0].altStrikeThrough();
            gc2CloseMenu();
            document.getElementById("gc2-message").focus();
        };
        this.appendChild(strikeThroughButton);

        let teletextButton = document.createElement("button");
        teletextButton.innerText = "Teletext";
        teletextButton.onclick = () => {
            document.getElementsByTagName("gc2-main")[0].altTeletext();
            gc2CloseMenu();
            document.getElementById("gc2-message").focus();
        };
        this.appendChild(teletextButton);

        let codeButton = document.createElement("button");
        codeButton.innerText = "Code";
        codeButton.onclick = () => {
            document.getElementsByTagName("gc2-main")[0].altCode();
            gc2CloseMenu();
            document.getElementById("gc2-message").focus();
        };
        this.appendChild(codeButton);

        let spoilerButton = document.createElement("button");
        spoilerButton.innerText = "Spoiler";
        spoilerButton.onclick = () => {
            document.getElementsByTagName("gc2-main")[0].altSpoiler();
            gc2CloseMenu();
            document.getElementById("gc2-message").focus();
        };
        this.appendChild(spoilerButton);

        let pafButton = document.createElement("button");
        pafButton.innerText = "Paf";
        pafButton.onclick = () => {
            document.getElementsByTagName("gc2-main")[0].altPaf();
            gc2CloseMenu();
            document.getElementById("gc2-message").focus();
        };
        this.appendChild(pafButton);

        let acappellaButton = document.createElement("button");
        acappellaButton.innerText = "♪";
        acappellaButton.onclick = () => {
            document.getElementsByTagName("gc2-main")[0].altAcappella();
            gc2CloseMenu();
            document.getElementById("gc2-message").focus();
        };
        this.appendChild(acappellaButton);

        let lastPostedButton = document.createElement("button");
        lastPostedButton.innerText = "Last posted";
        lastPostedButton.onclick = () => {
            document.getElementsByTagName("gc2-main")[0].altLastPosted();
            gc2CloseMenu();
            document.getElementById("gc2-message").focus();
        };
        this.appendChild(lastPostedButton);
    }

    focus() {
        //no component to focus
    }
}
customElements.define("gc2-alt", Gc2Alt);
