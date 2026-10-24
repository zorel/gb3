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

    /**
     * Posts referencing a given tribune/second, so replacing the post that owns
     * that second can re-resolve those references.
     * @type Map<string, Set<string>>
     */
    clockReferers = new Map();

    /**
     * Posts referencing each post: targetKey -> Set<childKey>.
     * Used to propagate hiding to replies.
     * @type Map<string, Set<string>>
     */
    childrenByTarget = new Map();

    /**
     * Resolved targets of each post: postKey -> Set<targetKey>.
     * Used to diff edges when a reference resolves differently.
     * @type Map<string, Set<string>>
     */
    targetsByPost = new Map();

    constructor(identities = []) {
        this.setBlockedIdentities(identities);
    }

    setBlockedIdentities(identities) {
        this.blockedIdentities = new Set(
            identities.map((identity) => identity.trim()).filter(Boolean),
        );
        this.recompute();
    }

    setDisplayMode(mode) {
        this.displayMode = mode === "gray" ? "gray" : "hide";
    }

    add(post) {
        let key = this.key(post);
        if (this.posts.has(key)) {
            return !this.posts.get(key).hiddenConversation;
        }
        this.posts.set(key, post);
        // Derive the identity-based flag before indexing so that references to
        // this post, resolved below, already see the right state.
        post.hiddenConversation = this.isBlocked(post);

        for (let reference of this.references(post)) {
            this.referersOf(reference).add(key);
        }

        // Registering the post may change which post owns a (tribune, second)
        // clock. When it replaces an existing owner, references can resolve to
        // another post and a previously hidden post may become visible again,
        // so the whole state has to be re-derived like the old fixed point did.
        if (this.index(post)) {
            this.recompute();
            return !post.hiddenConversation;
        }

        if (this.updateTargets(key, post)) {
            post.hiddenConversation = true;
        }
        if (post.hiddenConversation) {
            this.hideReplies(key);
        }
        return !post.hiddenConversation;
    }

    key(post) {
        return `${post.tribune}:${post.id}`;
    }

    isBlocked(post) {
        return (
            this.blockedIdentities.has(post.login) ||
            this.blockedIdentities.has(post.info)
        );
    }

    /**
     * @returns {boolean} true when the post takes over a clock already owned by
     * another post, which may change how existing references resolve
     */
    index(post) {
        let byTime = this.postsByTribuneTime.get(post.tribune);
        if (!byTime) {
            byTime = new Map();
            this.postsByTribuneTime.set(post.tribune, byTime);
        }
        let time = post.time.slice(8);
        let current = byTime.get(time);
        if (current && Number(post.id) < Number(current.id)) {
            return false;
        }
        // When several posts share a second, the last one in post order wins.
        byTime.set(time, post);
        if (current === post) {
            return false;
        }
        this.reResolve(`${post.tribune}:${time}`);
        return current !== undefined;
    }

    referersOf(reference) {
        let clockKey = `${reference.tribune}:${reference.time}`;
        let referers = this.clockReferers.get(clockKey);
        if (!referers) {
            referers = new Set();
            this.clockReferers.set(clockKey, referers);
        }
        return referers;
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
                time: time,
            });
        }
        return references;
    }

    resolve(reference) {
        let byTime = this.postsByTribuneTime.get(reference.tribune);
        return byTime ? byTime.get(reference.time) || null : null;
    }

    /**
     * Resolve the references of a post and update the reply edges.
     * @returns {boolean} true when one of the resolved targets is hidden
     */
    updateTargets(key, post) {
        let previousTargets = this.targetsByPost.get(key);
        let targets = new Set();
        let hiddenTarget = false;
        for (let reference of this.references(post)) {
            let target = this.resolve(reference);
            if (!target) {
                continue;
            }
            let targetKey = this.key(target);
            targets.add(targetKey);
            hiddenTarget = hiddenTarget || Boolean(target.hiddenConversation);
        }

        if (previousTargets) {
            for (let targetKey of previousTargets) {
                if (!targets.has(targetKey)) {
                    this.childrenOf(targetKey).delete(key);
                }
            }
        }
        for (let targetKey of targets) {
            this.childrenOf(targetKey).add(key);
        }
        this.targetsByPost.set(key, targets);
        return hiddenTarget;
    }

    childrenOf(targetKey) {
        let children = this.childrenByTarget.get(targetKey);
        if (!children) {
            children = new Set();
            this.childrenByTarget.set(targetKey, children);
        }
        return children;
    }

    /**
     * Hide every direct or indirect reply of the given hidden posts.
     */
    hideReplies(...seeds) {
        let queue = seeds.slice();
        while (queue.length > 0) {
            let key = queue.pop();
            let children = this.childrenByTarget.get(key);
            if (!children) {
                continue;
            }
            for (let childKey of children) {
                let child = this.posts.get(childKey);
                if (child && !child.hiddenConversation) {
                    child.hiddenConversation = true;
                    queue.push(childKey);
                }
            }
        }
    }

    /**
     * Re-resolve references pointing at a clock whose owning post changed.
     */
    reResolve(clockKey) {
        let referers = this.clockReferers.get(clockKey);
        if (!referers) {
            return;
        }
        for (let key of referers) {
            let post = this.posts.get(key);
            if (!post || post.hiddenConversation) {
                continue;
            }
            if (this.updateTargets(key, post)) {
                post.hiddenConversation = true;
                this.hideReplies(key);
            }
        }
    }

    /**
     * Rebuild every derived structure from scratch. Used when the blocked
     * identities change, which is the only case where posts can become visible
     * again.
     */
    recompute() {
        this.targetsByPost.clear();
        this.childrenByTarget.clear();
        this.clockReferers.clear();

        for (let post of this.posts.values()) {
            post.hiddenConversation = this.isBlocked(post);
        }
        for (let [key, post] of this.posts) {
            for (let reference of this.references(post)) {
                this.referersOf(reference).add(key);
            }
        }

        let queue = [];
        for (let [key, post] of this.posts) {
            if (post.hiddenConversation) {
                // Keep edges up to date even for already hidden posts.
                this.updateTargets(key, post);
                queue.push(key);
            } else if (this.updateTargets(key, post)) {
                post.hiddenConversation = true;
                queue.push(key);
            }
        }
        this.hideReplies(...queue);
    }
}
