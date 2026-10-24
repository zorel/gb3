import { Gc2Post } from "./gc2-post.js";
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

    insertPost(post) {
        GC2_CONVERSATION_FILTER.add(post);
        let shouldRender =
            !post.hiddenConversation ||
            GC2_CONVERSATION_FILTER.displayMode === "gray";
        if (
            !shouldRender ||
            document.getElementById(`${post.id}@${post.tribune}`)
        ) {
            return;
        }

        let postElement = new Gc2Post();
        postElement.ownerTribune = this;
        postElement.setup(post);
        postElement.classList.toggle(
            "gc2-post-filtered",
            post.hiddenConversation,
        );

        let nextSibling = null;
        for (let i = this.children.length - 1; i >= 0; --i) {
            let child = this.children[i];
            if (child.postId > post.id) {
                nextSibling = child;
                break;
            }
        }

        this.insertBefore(postElement, nextSibling);

        if (!post.isMine) {
            let lastReadPostId =
                GC2_STORAGE.getItem(
                    `${this.getAttribute("name")}_lastReadPostId`,
                ) || -1;
            if (post.id > lastReadPostId) {
                this.hasReply |= post.isReply;
                this.hasBigorno |= post.isBigorno;
            }
        }
    }

    markAsRead() {
        this.hasBigorno = false;
        this.hasReply = false;
        let lastPost = this.querySelector("gc2-post:last-of-type");
        if (lastPost) {
            GC2_STORAGE.setItem(
                `${this.getAttribute("name")}_lastReadPostId`,
                lastPost.id,
            );
        }
    }
}
customElements.define("gc2-tribune", Gc2Tribune);

class Gc2Tribunes extends HTMLElement {}
customElements.define("gc2-tribunes", Gc2Tribunes);
