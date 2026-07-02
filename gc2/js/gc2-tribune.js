import {Gc2Post} from "./gc2-post.js";
import { GC2_STORAGE } from "./gc2-storage.js";

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
        if (document.getElementById(`${post.id}@${post.tribune}`)) {
            return;
        }

        let postElement = new Gc2Post();
        postElement.setup(post);

        // Find post that would be just after the one we just received.
        // In the typical case, the loop should just never run and nextSibling
        // will be undefined, so the post will be appended.
        let nextSibling = undefined;
        let i = this.children.length - 1;
        while (i > 0 && this.children[i].postId > post.id) {
            nextSibling = this.children[i];
            --i;
        }

        this.insertBefore(postElement, nextSibling);

        if (!post.isMine) {
            let lastReadPostId =  GC2_STORAGE.getItem(`${this.getAttribute("name")}_lastReadPostId`) || -1;
            if (post.id > lastReadPostId) {
                this.hasReply |= post.isReply;
                this.hasBigorno |= post.isBigorno;
            }
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