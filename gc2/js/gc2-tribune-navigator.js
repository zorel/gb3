class Gc2TribuneNavigatorButton extends HTMLElement{

    /**
     * @type string
     */
    tribuneName;

    constructor() {
        super();
    }

}

customElements.define('gc2-tribune-navigator-button', Gc2TribuneNavigatorButton);

/**
 * @callback Gc2TribuneNavigator~navigateCallback
 * @param {string} tribuneName
 */

 export class Gc2TribuneNavigator extends HTMLElement {
    constructor() {
        super();
    }

    /**
     * @type Gc2TribuneNavigator~navigateCallback
     */
    onnavigate;

    /**
     * @type Map<String, Gc2TribuneNavigatorButton>
     */
    buttons = new Map();

    addTribune(tribuneName) {
        let tribuneButton = document.createElement("gc2-tribune-navigator-button");
        tribuneButton.tribuneName = tribuneName;
        this.buttons.set(tribuneName, tribuneButton);
        
        let tribuneSpan = document.createElement("span");
        tribuneSpan.innerText = tribuneName;
        tribuneButton.appendChild(tribuneSpan);

        tribuneButton.onclick = () => {
            if(this.onnavigate) {
                this.onnavigate(tribuneName);
            }
        }      
        this.appendChild(tribuneButton);
    }

    setActiveTribune(tribuneName) {
        this.buttons.forEach((element, name) => {
            element.toggleAttribute("active", name === tribuneName);
        });
    }

    /**
     * 
     * @param {string} tribuneName 
     * @param {boolean} hasBigorno 
     * @param {boolean} hasReply 
     */
    setTribuneNotifications(tribuneName, hasBigorno, hasReply) {
        let element = this.buttons.get(tribuneName);
        if (element) {
            element.toggleAttribute("bigorno", hasBigorno);
            element.toggleAttribute("reply", hasReply);
        }
    }
}

customElements.define('gc2-tribune-navigator', Gc2TribuneNavigator);