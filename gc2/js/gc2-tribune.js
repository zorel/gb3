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
            postElement.ownerTribune = this;
            postElement.setup(post);
            postElement.classList.toggle("gc2-post-filtered", post.hiddenConversation);
            this.insertPostElement(postElement);
            this.refreshNotifications();
        }
    }

    insertPostElement(postElement) {
        let nextElement = this.findInsertionPoint(postElement.postId);
        if (nextElement) {
            this.insertBefore(postElement, nextElement);
        } else {
            this.appendChild(postElement);
        }
    }

    findInsertionPoint(postId) {
        let postElements = this.getElementsByTagName('gc2-post');
        let wanted = Number(postId);
        let low = 0;
        let high = postElements.length;
        while (low < high) {
            let middle = (low + high) >>> 1;
            if (Number(postElements[middle].postId) <= wanted) {
                low = middle + 1;
            } else {
                high = middle;
            }
        }
        return postElements[low] || null;
    }

    refreshNotifications() {
        this.hasBigorno = false;
        this.hasReply = false;
        let postElements = this.getElementsByTagName('gc2-post');
        let lastReadPostId = GC2_STORAGE.getItem(`${this.getAttribute("name")}_lastReadPostId`) || -1;
        for (let i = postElements.length - 1; i > 0; --i) {
            let post = postElements[i];
            if (post.id <= lastReadPostId || post.isMine) {
                break;
            }
            this.hasReply |= post.isReply;
            this.hasBigorno |= post.isBigorno;
        }
    }

    sortPosts() {
        // Kept for compatibility. Posts are inserted in order, so only reorder
        // the DOM when it is actually needed instead of on every new post.
        let postElements = Array.prototype.slice.call(this.getElementsByTagName('gc2-post'));
        let sortedPosts = postElements.slice().sort((a, b) => Number(a.postId) - Number(b.postId));
        let alreadySorted = sortedPosts.every((element, index) => element === postElements[index]);
        if (!alreadySorted) {
            for (let postElement of sortedPosts) {
                this.appendChild(postElement);
            }
        }
        this.refreshNotifications();
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
