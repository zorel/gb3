/**
 * Keeps enough post history to hide a whole conversation rooted at a
 * configured login or user-agent (gb0 uses info for its user-agent).
 */
export class Gc2ConversationFilter {
    posts = new Map();
    blockedIdentities = new Set();
    displayMode = "hide";

    constructor(identities = []) {
        this.setBlockedIdentities(identities);
    }

    setBlockedIdentities(identities) {
        this.blockedIdentities = new Set(identities.map((identity) => identity.trim()).filter(Boolean));
    }

    setDisplayMode(mode) {
        this.displayMode = mode === "gray" ? "gray" : "hide";
    }

    add(post) {
        this.posts.set(this.key(post), post);
        this.recompute();
        return !post.hiddenConversation;
    }

    key(post) {
        return `${post.tribune}:${post.id}`;
    }

    recompute() {
        for (let post of this.posts.values()) {
            post.hiddenConversation = this.blockedIdentities.has(post.login) || this.blockedIdentities.has(post.info);
        }

        // Replies normally arrive after their target, but the fixed point also
        // handles stored posts arriving in an unexpected order.
        let changed;
        do {
            changed = false;
            for (let post of this.posts.values()) {
                if (post.hiddenConversation) {
                    continue;
                }
                for (let reference of this.references(post)) {
                    let target = this.resolve(reference, post.tribune);
                    if (target && target.hiddenConversation) {
                        post.hiddenConversation = true;
                        changed = true;
                        break;
                    }
                }
            }
        } while (changed);
    }

    references(post) {
        let template = document.createElement("template");
        template.innerHTML = post.conversationMessage || post.message;
        return template.content.querySelectorAll("gc2-norloge");
    }

    resolve(reference, sourceTribune) {
        let tribune = reference.getAttribute("bouchot") || sourceTribune;
        let title = reference.getAttribute("title") || "";
        let time = title.slice(-8).replaceAll(":", "");
        if (!/^\d{6}$/.test(time)) {
            return null;
        }

        let candidates = Array.from(this.posts.values()).filter((post) =>
            post.tribune === tribune && post.time.slice(8) === time
        );

        // This matches the existing UI behaviour: when several posts share a
        // second, the last one in post order is the referenced one.
        candidates.sort((a, b) => Number(a.id) - Number(b.id));
        return candidates[candidates.length - 1] || null;
    }
}
