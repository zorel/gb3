/**
 * Keeps enough post history to hide a whole conversation rooted at a
 * configured login or user-agent (gb0 uses info for its user-agent).
 */
export class Gc2ConversationFilter {
    posts = new Map();
    blockedIdentities = new Set();
    displayMode = "hide";

    /**
     * Parsed clock references, cached per post key so the message HTML is only
     * parsed once instead of on every recompute.
     * @type Map<string, Array<{tribune: string, time: string}>>
     */
    referencesCache = new Map();

    /**
     * Index of the latest post for each tribune/second: tribune -> (time -> post).
     * Replaces the full scan of all posts performed for every reference.
     * @type Map<string, Map<string, object>>
     */
    postsByTribuneTime = new Map();

    constructor(identities = []) {
        this.setBlockedIdentities(identities);
    }

    setBlockedIdentities(identities) {
        this.blockedIdentities = new Set(identities.map((identity) => identity.trim()).filter(Boolean));
        this.recompute();
    }

    setDisplayMode(mode) {
        this.displayMode = mode === "gray" ? "gray" : "hide";
    }

    add(post) {
        this.posts.set(this.key(post), post);
        this.index(post);
        this.recompute();
        return !post.hiddenConversation;
    }

    key(post) {
        return `${post.tribune}:${post.id}`;
    }

    index(post) {
        let byTime = this.postsByTribuneTime.get(post.tribune);
        if (!byTime) {
            byTime = new Map();
            this.postsByTribuneTime.set(post.tribune, byTime);
        }
        let time = post.time.slice(8);
        let current = byTime.get(time);
        // When several posts share a second, the last one in post order wins.
        if (!current || Number(post.id) >= Number(current.id)) {
            byTime.set(time, post);
        }
    }

    references(post) {
        let key = this.key(post);
        let references = this.referencesCache.get(key);
        if (!references) {
            references = this.parseReferences(post);
            this.referencesCache.set(key, references);
        }
        return references;
    }

    parseReferences(post) {
        let template = document.createElement("template");
        template.innerHTML = post.conversationMessage || post.message;
        let references = [];
        for (let norloge of template.content.querySelectorAll("gc2-norloge")) {
            let title = norloge.getAttribute("title") || "";
            let time = title.slice(-8).replaceAll(":", "");
            if (!/^\d{6}$/.test(time)) {
                continue;
            }
            references.push({
                tribune: norloge.getAttribute("bouchot") || post.tribune,
                time: time
            });
        }
        return references;
    }

    resolve(reference, sourceTribune) {
        let tribune = reference.tribune || sourceTribune;
        let time = reference.time;
        if (!time) {
            return null;
        }
        let byTime = this.postsByTribuneTime.get(tribune);
        return byTime ? (byTime.get(time) || null) : null;
    }

    recompute() {
        for (let post of this.posts.values()) {
            post.hiddenConversation = this.blockedIdentities.has(post.login) || this.blockedIdentities.has(post.info);
        }

        // Replies normally arrive after their target, but the fixed point also
        // handles stored posts arriving in an unexpected order. Propagate the
        // hidden flag downwards through a reverse index instead of rescanning
        // every post until nothing changes.
        let children = new Map();
        for (let [key, post] of this.posts) {
            for (let reference of this.references(post)) {
                let target = this.resolve(reference, post.tribune);
                if (!target) {
                    continue;
                }
                let targetKey = this.key(target);
                let childKeys = children.get(targetKey);
                if (!childKeys) {
                    childKeys = [];
                    children.set(targetKey, childKeys);
                }
                childKeys.push(key);
            }
        }

        let queue = [];
        for (let [key, post] of this.posts) {
            if (post.hiddenConversation) {
                queue.push(key);
            }
        }
        while (queue.length > 0) {
            let hiddenKey = queue.pop();
            let childKeys = children.get(hiddenKey);
            if (!childKeys) {
                continue;
            }
            for (let childKey of childKeys) {
                let child = this.posts.get(childKey);
                if (child && !child.hiddenConversation) {
                    child.hiddenConversation = true;
                    queue.push(childKey);
                }
            }
        }
    }
}
