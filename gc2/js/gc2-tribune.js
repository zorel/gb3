import {Gc2Post} from "./gc2-post.js";
import { GC2_STORAGE } from "./gc2-storage.js";
import { Gc2ConversationFilter } from "./gc2-conversation-filter.js";

export const GC2_CONVERSATION_FILTER = new Gc2ConversationFilter();

export class Gc2Tribune extends HTMLElement {

    /**
     * @type boolean
     */
    hasBigorno = false;

    /**
     * @type boolean
     */
    hasReply = false;

    constructor() {
        super();
    }

    insertPost(post) {
        GC2_CONVERSATION_FILTER.add(post);
        let shouldRender = !post.hiddenConversation || GC2_CONVERSATION_FILTER.displayMode === "gray";
        if (shouldRender && !document.getElementById(`${post.id}@${post.tribune}`)) {
            let postElement = new Gc2Post();
            postElement.setup(post);
            postElement.classList.toggle("gc2-post-filtered", post.hiddenConversation);
            this.appendChild(postElement);
            this.sortPosts();
        }
    }

    sortPosts() {
        let postElements = this.getElementsByTagName('gc2-post');
        Array.prototype.slice.call(postElements).sort((a, b) => {
            if (a.postId < b.postId) {
                return -1;
            } else if (a.postId > b.postId) {
                return 1;
            }
            return 0;
        }).forEach((p) => {
            this.appendChild(p);
        });

        this.hasBigorno = false;
        this.hasReply = false;
        let lastReadPostId =  GC2_STORAGE.getItem(`${this.getAttribute("name")}_lastReadPostId`) || -1;
        for (let i = postElements.length - 1; i > 0; --i) {
            let post = postElements[i];
            if(post.id <= lastReadPostId || post.isMine) {
                break;
            }
            this.hasReply |= post.isReply;
            this.hasBigorno |= post.isBigorno;
        }
    }

    markAsRead() {
        this.hasBigorno = false;
        this.hasReply = false;
        let lastPost = this.querySelector('gc2-post:last-of-type');
        if(lastPost) {
            GC2_STORAGE.setItem(`${this.getAttribute("name")}_lastReadPostId`, lastPost.id);
        }
    }
}
customElements.define('gc2-tribune', Gc2Tribune);

class Gc2Tribunes extends HTMLElement {
    constructor() {
        super();
    }
}
customElements.define('gc2-tribunes', Gc2Tribunes);
