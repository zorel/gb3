import { Gc2TribuneNavigator } from "./gc2-tribune-navigator.js";
import { Gc2Tribune } from "./gc2-tribune.js";
import { Gc2Menu } from "./gc2-menu.js";
import { Gc2Alarm } from "./gc2-alarm.js";
import { GC2_STORAGE } from "./gc2-storage.js";

class Gc2Main extends HTMLElement {

    /**
     * @type Map<String, Gc2Tribune>
     */
    tribunes = new Map();

    /**
     * @type Gc2TribuneNavigator
     */
    tribuneNavigator;

    /**
     * @type Gc2Tribunes
     */
    tribunesContainer;

    /**
     * @type HTMLFormElement
     */
    controls;

    /**
     * @type HTMLSelectElement
     */
    tribuneSelect;

    /**
     * @type HTMLInputElement
     */
    messageInput;

    /**
     * @type CallableFunction
     */
    backend2html;

    /**
     * @type CallableFunction
     */
    bouchotSuffixor;

    /**
     * @type string
     */
    activeTribune;

    constructor() {
        super();
    }

    async connectedCallback() {
        this.setupNickname();
        this.setupTribunesContainer();
        this.setupControls();
        this.setupTribuneNavigator();
        this.setupGesture();
        await this.setupBackend2html();
        await this.setupBouchotSuffixor();
        await this.listTribunes();
        this.selectTribune();
        this.appendChild(this.controls);
        this.setupAlarm();
        this.poll();
        setInterval(() => this.poll(), 10000);
    }

    setupAlarm() {
        /**
         * @type Gc2Alarm
         */
        let alarm = document.querySelector("gc2-alarm");
        alarm.start();
    }

    setupTribuneNavigator() {
        this.tribuneNavigator = document.querySelector("gc2-tribune-navigator");
        this.tribuneNavigator.onnavigate = (tribuneName) => {
            this.tribuneSelect.value = tribuneName;
            this.setActiveTribune(tribuneName);
            this.scrollToBottom();
        };
    }

    setupTribunesContainer() {
        this.tribunesContainer = document.createElement("gc2-tribunes");
        this.appendChild(this.tribunesContainer);
    }

    setupNickname() {
        if (!GC2_STORAGE.getItem("nickname")) {
            let consonants = "bcdfghjklmnpqrstvwxz";
            let vowels = "aeiouy";
            let syllabes = 2 + Math.floor(Math.random() * 2);
            let generatedNickname = "";
            for (let i = 0; i < syllabes; ++i) {
                generatedNickname += consonants.charAt(Math.floor(Math.random() * consonants.length));
                generatedNickname += vowels.charAt(Math.floor(Math.random() * vowels.length));
            }
            GC2_STORAGE.setItem("nickname", generatedNickname);
        }
    }

    async setupControls() {
        this.controls = document.createElement("form");
        this.controls.classList.add("gc2-controls");
        this.setupTribuneSelect();
        this.setupMessageInput();
        this.setupShortcutButtons();
        this.setupMenuButton();

        this.controls.onsubmit = (e) => {
            e.preventDefault();
            this.postMessage();
        };
    }

    async postMessage() {
        if (this.messageInput.value && this.tribuneSelect.value) {
            let data = new URLSearchParams();//NEVER use FormData, it forces multipart and backend dont support multipart
            data.set('message', this.messageInput.value);
            data.set('tribune', this.tribuneSelect.value);
            data.set('info', GC2_STORAGE.getItem("nickname"));
            this.messageInput.value = "";
            this.messageInput.classList.toggle("gc2-loading", true);
            let headers = new Headers();
            if (this.tribuneSelect.value === "dlfp") {
                let accessToken = await this.retrieveLinuxfrToken();
                if (!accessToken) {
                    GC2_STORAGE.setItem("linuxfr_unposted_message", data.get('message'));
                    window.location.href = "/gb2c/linuxfr/authorize";
                } else {
                    headers.set('Authorization', `Bearer ${accessToken}`);
                }
            }
            fetch("/gb2c/post", {
                body: data,
                method: "POST",
                headers: headers
            }).then((data) => {
                this.messageInput.classList.toggle("gc2-loading", false);
            }).catch((error) => {
                this.messageInput.classList.toggle("gc2-loading", false);
                console.log(`Cannot post message '${data.get('message')}'. Error: `, error);
            });
        }
    }

    async retrieveLinuxfrToken() {
        try {
            let accessToken = GC2_STORAGE.getItem("linuxfr_access_token");
            if (!accessToken) {
                return null;
            }
            let expiresAt = parseInt(GC2_STORAGE.getItem("linuxfr_expires_at"), 10) || 0;
            if (expiresAt > Date.now()) {
                return accessToken;
            }
            let refreshData = new URLSearchParams();
            refreshData.set("refresh_token", GC2_STORAGE.getItem("linuxfr_refresh_token"));
            let response = await fetch("/gb2c/linuxfr/refresh", {
                body: refreshData,
                method: "POST",
            });
            let token = await response.json();
            if (token.access_token) {
                GC2_STORAGE.setItem("linuxfr_access_token", token.access_token);
                GC2_STORAGE.setItem("linuxfr_refresh_token", token.refresh_token);
                GC2_STORAGE.setItem("linuxfr_expires_at", Date.now() + token.expires_in * 1000);
                return token.access_token;
            }
        } catch (e) {
            console.log("Cannot retrieve linuxfr access token");
        }
    }

    setupShortcutButtons() {
        let totozButton = document.createElement("button");
        totozButton.type = "button";
        totozButton.classList.add("gc2-shortcuts-button");
        totozButton.innerText = "😱";
        totozButton.onclick = () => {
            this.style.display = "none";
            /**
             * @type Gc2Menu
             */
            let menu = document.querySelector('gc2-menu');
            menu.style.display = "";
            menu.showOnlyTotozSearch();
        };
        this.controls.appendChild(totozButton);

        let emojiButton = document.createElement("button");
        emojiButton.type = "button";
        emojiButton.classList.add("gc2-shortcuts-button");
        emojiButton.innerText = "💩";
        emojiButton.onclick = () => {
            this.style.display = "none";
            /**
             * @type Gc2Menu
             */
            let menu = document.querySelector('gc2-menu');
            menu.style.display = "";
            menu.showOnlyEmojiSearch();
        };
        this.controls.appendChild(emojiButton);

        let attachButton = document.createElement("button");
        attachButton.type = "button";
        attachButton.classList.add("gc2-shortcuts-button");
        attachButton.innerText = "📎";
        attachButton.onclick = () => {
            this.style.display = "none";
            /**
             * @type Gc2Menu
             */
            let menu = document.querySelector('gc2-menu');
            menu.style.display = "";
            menu.showOnlyAttach();
        };
        this.controls.appendChild(attachButton);
    }

    setupMenuButton() {
        let menuButton = document.createElement("button");
        menuButton.type = "button";
        menuButton.id = "menu-button";
        menuButton.innerText = "⋯";
        menuButton.onclick = () => {
            this.style.display = "none";
            /**
             * @type Gc2Menu
             */
            let menu = document.querySelector('gc2-menu');
            menu.style.display = "";
            menu.showSelector();
        };
        this.controls.appendChild(menuButton);
    }

    setupTribuneSelect() {
        this.tribuneSelect = document.createElement("select");
        this.tribuneSelect.onchange = () => {
            this.setActiveTribune(this.tribuneSelect.value);
            this.scrollToBottom();
        };
        this.controls.appendChild(this.tribuneSelect);
    }

    setupMessageInput() {
        this.messageInput = document.createElement("input");
        this.messageInput.id = "gc2-message";
        this.messageInput.type = "text";
        this.messageInput.enterKeyHint = "send";
        this.messageInput.spellcheck = true;
        this.messageInput.onkeydown = (e) => {
            if (e.altKey) {
                if (this.handleAltShortcut(e.key)) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            }
        };
        this.controls.appendChild(this.messageInput);
    }

    async setupBackend2html() {
        let response = await fetch("/peg/backend2html.pegjs");
        let text = await response.text();
        this.backend2html = peg.generate(text);
    }

    selectTribune() {
        let unposted = GC2_STORAGE.getItem("linuxfr_unposted_message");
        if (unposted) {
            this.setActiveTribune("dlfp", false);
            this.messageInput.value = unposted;
            GC2_STORAGE.removeItem("linuxfr_unposted_message");
        } else {
            let tribuneName = window.location.hash.slice(1);
            if (this.isTribune(tribuneName)) {
                this.setActiveTribune(tribuneName, false);
            }
        }
    }

    /**
     * @type EventSource
     */
    postSource;

    /**
     * @type number
     */
    lastPostSourceActivity = 0;

    closeInactivePostSource() {
        if (this.postSource) {
            if (this.postSource.readyState === EventSource.CLOSED) {
                this.postSource = null;
                return;
            }
            let noPostSourceActivitySince = Date.now() - this.lastPostSourceActivity;
            if (noPostSourceActivitySince > 60000) {
                this.postSource.close();
                this.postSource = null;
            }
        }
    }

    poll() {
        this.closeInactivePostSource();
        if (!this.postSource) {
            this.postSource = new EventSource("/gb2c/poll");
            this.postSource.onopen = () => {
                this.lastPostSourceActivity = Date.now();
            };
            this.lastPostSourceActivity = Date.now();
            this.postSource.onmessage = (event) => {
                this.lastPostSourceActivity = Date.now();
                let wasAtbottom = this.isScrollAtBottom();
                let post = JSON.parse(event.data);
                post.message = this.backend2html.parse(post.message);
                this.getTribuneElement(post.tribune).insertPost(post);
                this.updateNotifications();
                if (wasAtbottom) {
                    this.scrollToBottom();
                }
            };
            this.postSource.onerror = (err) => {
                console.log(`Lost connection, retry in few seconds`);
                this.postSource.close();
                this.postSource = null;
            };
        }
    }

    isScrollAtBottom() {
        return (this.tribunesContainer.scrollTop + this.tribunesContainer.clientHeight + 8 /* magic number for bottom approximation */) >= this.tribunesContainer.scrollHeight;
    }

    scrollToBottom() {
        this.tribunesContainer.scrollTop = this.tribunesContainer.scrollHeight;
    }

    isTribune(tribuneName) {
        return this.tribunes.get(tribuneName);
    }

    getTribuneElement(tribuneName) {
        let tribuneElement = this.tribunes.get(tribuneName);
        if (!tribuneElement) {
            var option = document.createElement("option");
            option.text = option.value = tribuneName;
            this.tribuneSelect.add(option);

            if (this.tribuneNavigator) {
                this.tribuneNavigator.addTribune(tribuneName);
            }

            tribuneElement = document.createElement('gc2-tribune');
            tribuneElement.setAttribute("name", tribuneName);
            tribuneElement.style.display = "none";
            this.tribunesContainer.appendChild(tribuneElement);

            this.tribunes.set(tribuneName, tribuneElement);
            this.setActiveTribune(this.tribunes.size === 1 ? tribuneName : this.tribuneSelect.value);
        }
        return tribuneElement;
    }

    setActiveTribune(selectedTribuneName, markPreviousAsRead = true) {
        if (selectedTribuneName === this.activeTribune) {
            return;
        }
        this.addBouchotSuffixInMessageInput(this.activeTribune, selectedTribuneName);
        let previousTribuneElement = this.tribunes.get(this.activeTribune);
        if (previousTribuneElement && markPreviousAsRead) {
            previousTribuneElement.markAsRead();
        }
        this.activeTribune = selectedTribuneName;
        this.tribuneSelect.value = selectedTribuneName;
        this.messageInput.placeholder = selectedTribuneName;
        if (this.tribuneNavigator) {
            this.tribuneNavigator.setActiveTribune(selectedTribuneName);
        }
        this.tribunes.forEach((tribuneElement, tribuneName) => {
            tribuneElement.style.display = tribuneName === selectedTribuneName ? "" : "none";
        });
        this.updateNotifications();
    }

    setupGesture() {
        delete Hammer.defaults.cssProps.userSelect;
        let hammertime = new Hammer(document.querySelector("gc2-main"), {
            inputClass: Hammer.TouchInput
        });
        hammertime.on('swipeleft', (_e) => {
            if (this.tribuneSelect.selectedIndex === 0) {
                this.tribuneSelect.selectedIndex = this.tribuneSelect.options.length - 1;
            } else {
                this.tribuneSelect.selectedIndex = this.tribuneSelect.selectedIndex - 1;
            }
            this.setActiveTribune(this.tribuneSelect.value);
            this.scrollToBottom();
        }
        );
        hammertime.on('swiperight', (_e) => {
            if (this.tribuneSelect.selectedIndex >= (this.tribuneSelect.options.length - 1)) {
                this.tribuneSelect.selectedIndex = 0;
            } else {
                this.tribuneSelect.selectedIndex = this.tribuneSelect.selectedIndex + 1;
            }
            this.setActiveTribune(this.tribuneSelect.value);
            this.scrollToBottom();
        });

    }

    async listTribunes() {
        let response = await fetch("/gb2c/list");
        let tribunes = await response.json();
        tribunes.forEach(t => this.getTribuneElement(t));
    }

    handleAltShortcut(keychar) {
        switch (keychar) {
            case 'o':
                this.insertTextInMessage('_o/* <b>BLAM</b>! ');
                return true;
            case 'm':
                this.insertTextInMessage(`====> <b>Moment ${this.getSelectedText()}</b> <====`, 16);
                return true;
            case 'f':
                this.insertTextInMessage('\u03C6');
                return true;
            case 'b':
                this.insertTextInMessage(`<b>${this.getSelectedText()}</b>`, 3);
                return true;
            case 'i':
                this.insertTextInMessage(`<i>${this.getSelectedText()}</i>`, 3);
                return true;
            case 'u':
                this.insertTextInMessage(`<u>${this.getSelectedText()}</u>`, 3);
                return true;
            case 's':
                this.insertTextInMessage(`<s>${this.getSelectedText()}</s>`, 3);
                return true;
            case 't':
                this.insertTextInMessage(`<tt>${this.getSelectedText()}</tt>`, 4);
                return true;
            case 'c':
                this.insertTextInMessage(`<code>${this.getSelectedText()}</code>`, 6);
                return true;
            case 'd':
                this.insertTextInMessage(`<spoiler>${this.getSelectedText()}</spoiler>`, 9);
                return true;
            case 'p':
                this.insertTextInMessage('_o/* <b>paf!</b> ');
                return true;
            case 'a':
                this.insertTextInMessage(`\u266A <i>${this.getSelectedText()}</i> \u266A`, 5);
                return true;
        }
        return false;
    }

    getSelectedText() {
        return this.messageInput.value.substring(this.messageInput.selectionStart, this.messageInput.selectionEnd);
    }

    insertTextInMessage(text, pos) {
        if (!pos) {
            pos = text.length;
        }
        var selectionEnd = this.messageInput.selectionStart + pos;
        this.messageInput.value = this.messageInput.value.substring(0, this.messageInput.selectionStart) + text + this.messageInput.value.substring(this.messageInput.selectionEnd);
        this.messageInput.focus();
        this.messageInput.setSelectionRange(selectionEnd, selectionEnd);
    }

    async setupBouchotSuffixor() {
        let response = await fetch("/peg/bouchotsuffixor.pegjs");
        let text = await response.text();
        this.bouchotSuffixor = peg.generate(text);
    }

    addBouchotSuffixInMessageInput(previousTribuneName, nextTribuneName) {
        this.messageInput.value = this.bouchotSuffixor.parse(this.messageInput.value, { oldBouchot: previousTribuneName, newBouchot: nextTribuneName });
    }

    updateNotifications() {
        let bigorno = false;
        let reply = false;
        this.tribunes.forEach((tribuneElement, tribuneName) => {
            let option = this.tribuneSelect.querySelector(`option[value="${tribuneName}"`);
            if (option) {
                if (tribuneElement.hasBigorno) {
                    bigorno = true;
                    if (option.innerText.indexOf("📢") < 0) {
                        option.innerText += "📢";
                    }
                } else {
                    option.innerText = option.innerText.replace("📢", "");
                }
                if (tribuneElement.hasReply) {
                    reply = true;
                    if (option.innerText.indexOf("↩") < 0) {
                        option.innerText += "↩";
                    }
                } else {
                    option.innerText = option.innerText.replace("↩", "");
                }
                if (this.tribuneNavigator) {
                    this.tribuneNavigator.setTribuneNotifications(tribuneName, tribuneElement.hasBigorno, tribuneElement.hasReply);
                }
            }
        });
        if (bigorno) {
            if (document.title.indexOf("📢") < 0) {
                document.title = `📢${document.title}`;
            }
        } else {
            document.title = document.title.replace("📢", "");
        }
        if (reply) {
            if (document.title.indexOf("↩") < 0) {
                document.title = `↩${document.title}`;
            }
        } else {
            document.title = document.title.replace("↩", "");
        }
    }

}
customElements.define('gc2-main', Gc2Main);