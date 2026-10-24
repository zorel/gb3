/**
 * Message formatting for gc2.
 *
 * This replaces the two Peggy grammars that used to be compiled in the
 * browser (backend2html.pegjs and bouchotsuffixor.pegjs). Both are small
 * tokenizers with a handful of rules, so a hand-written scanner produces the
 * exact same output much faster and without shipping a parser generator.
 */

const TAG_NAMES = new Map([
    ["spoiler", "gc2-spoiler"],
    ["b", "b"],
    ["i", "i"],
    ["s", "s"],
    ["u", "u"],
    ["tt", "tt"],
    ["code", "code"],
]);

const OPEN_TAG = /<(spoiler|b|i|s|u|tt|code)>/y;
const CLOSE_TAG = /<\/(spoiler|b|i|s|u|tt|code)>/y;
const ENTITY = /&(?:lt|gt|amp|quot|apos);/y;
const TOTOZ = /\[:([^\]]+)\]/y;
const URL_PATTERN =
    /(?:(?:https?|ftp):\/\/|data:[A-Za-z0-9./:;=]+,)[^< \t\r\n"]+/y;

// Messages only allow these four whitespace characters, on purpose: the
// original grammars used [ \t\r\n] and nothing else.
function isWhitespace(code) {
    return code === 32 || code === 9 || code === 10 || code === 13;
}

function isDigit(code) {
    return code >= 48 && code <= 57;
}

// h, f and d are the only possible first letters of a URL.
function startsURL(code) {
    return code === 104 || code === 102 || code === 100;
}

// Any character that can begin something other than plain text.
const PLAIN_RUN = /[^<>&"'[0-9hfd \t\r\n]+/y;

const NORLOGES = [
    {
        pattern:
            /(\d{4})-([0-1]\d)-([0-3]\d)[T# ]([0-2]\d):([0-5]\d):([0-5]\d)(@[a-z]+)?/y,
        title: (m) => `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`,
        time: (m) => `${m[4]}:${m[5]}:${m[6]}`,
    },
    {
        pattern:
            /([0-1]\d)\/([0-3]\d)#([0-2]\d):([0-5]\d):([0-5]\d)(@[a-z]+)?/y,
        title: (m) => `${m[1]}-${m[2]} ${m[3]}:${m[4]}:${m[5]}`,
        time: (m) => `${m[3]}:${m[4]}:${m[5]}`,
    },
    {
        pattern: /([0-2]\d):([0-5]\d):([0-5]\d)(@[a-z]+)?/y,
        title: (m) => `${m[1]}:${m[2]}:${m[3]}`,
        time: (m) => `${m[1]}:${m[2]}:${m[3]}`,
    },
    {
        pattern: /([0-2]\d):([0-5]\d)(@[a-z]+)?/y,
        title: (m) => `${m[1]}:${m[2]}`,
        time: (m) => `${m[1]}:${m[2]}`,
    },
];

function matchNorloge(message, index) {
    for (const norloge of NORLOGES) {
        norloge.pattern.lastIndex = index;
        const match = norloge.pattern.exec(message);
        if (match) {
            const bouchot = /@[a-z]+$/.exec(match[0]);
            return {
                end: index + match[0].length,
                title: norloge.title(match),
                time: norloge.time(match),
                bouchot: bouchot ? bouchot[0] : undefined,
            };
        }
    }
    return null;
}

function renderNorloge({ title, time, bouchot }) {
    const suffix = bouchot || "";
    const attribute = bouchot ? ` bouchot="${bouchot.slice(1)}"` : "";
    return `<gc2-norloge title="${title}"${attribute}>${time}${suffix}</gc2-norloge>`;
}

// Bigorno words are [a-zA-Z0-9-_]+, as in the original grammar.
function isBigornoChar(code) {
    return (
        (code >= 97 && code <= 122) ||
        (code >= 65 && code <= 90) ||
        isDigit(code) ||
        code === 45 ||
        code === 95
    );
}

function isBigornoFollow(code) {
    return (
        isWhitespace(code) ||
        code === 60 || // <
        code === 59 || // ;
        code === 58 || // :
        code === 91 || // [
        code === 44 // ,
    );
}

/**
 * Match a bigorno at the start of the input or right after a whitespace.
 * The original rule also swallowed an optional extra whitespace and dropped
 * the "<" (or "&lt;") separator, so the scanner reproduces that exactly.
 */
function matchBigorno(message, index) {
    const length = message.length;
    const atStart = index === 0;
    let cursor = index;
    if (!atStart) {
        cursor += 1; // the single whitespace captured as "spaces"
    }
    if (cursor < length && isWhitespace(message.charCodeAt(cursor))) {
        cursor += 1; // optional extra whitespace, swallowed but not emitted
    }

    let wordEnd = cursor;
    while (wordEnd < length && isBigornoChar(message.charCodeAt(wordEnd))) {
        wordEnd += 1;
    }
    if (wordEnd === cursor) {
        return null;
    }

    // Longest word first, like the greedy `+` of the grammar, with the
    // separator search backtracking over the word.
    for (let end = wordEnd; end > cursor; end -= 1) {
        let after;
        if (message.charCodeAt(end) === 60) {
            after = end + 1;
        } else if (message.startsWith("&lt;", end)) {
            after = end + 4;
        } else {
            continue;
        }
        if (after >= length || isBigornoFollow(message.charCodeAt(after))) {
            return {
                end: after,
                spaces: atStart ? "" : message[index],
                word: message.slice(cursor, end),
            };
        }
    }
    return null;
}

function escapeChar(character) {
    switch (character) {
        case "<":
            return "&lt;";
        case ">":
            return "&gt;";
        case "&":
            return "&amp;";
        case '"':
            return "&quot;";
        case "'":
            return "&apos;";
        default:
            return character;
    }
}

function escapeDots(value) {
    return value.replaceAll(".", "&#46;");
}

/**
 * Render a link exactly like the original grammar did: let the browser
 * normalise the URL through an anchor element and serialise it back.
 */
function renderLink(href) {
    const anchor = document.createElement("a");
    try {
        anchor.innerText = new URL(href).hostname || "url";
    } catch {
        anchor.innerText = "url";
    }
    anchor.href = href;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    return anchor.outerHTML;
}

function renderTotoz(name) {
    return `<gc2-totoz>${escapeDots(name)}<img src="https://nsfw.totoz.eu/img/${encodeURI(name)}" loading="lazy"></gc2-totoz>`;
}

const URL_PREFIX = '<a href="';
const URL_SUFFIX = /">[^<]+<\/a>/y;

/**
 * Convert a raw backend message to the HTML rendered by gc2.
 * @param {string} message
 * @returns {string}
 */
function htmlParser() {
    if (!htmlParser.instance) {
        htmlParser.instance = new DOMParser();
    }
    return htmlParser.instance;
}

/**
 * Convert a raw backend message to the HTML rendered by gc2.
 * @param {string} message
 * @returns {string}
 */
export function backend2html(message) {
    const parts = [];
    const tagStack = [];
    const length = message.length;
    let index = 0;

    while (index < length) {
        const code = message.charCodeAt(index);
        let match;

        // 1. URLs wrapped in <a href="...">label</a> markup.
        if (code === 60 /* < */ && message.startsWith(URL_PREFIX, index)) {
            URL_PATTERN.lastIndex = index + URL_PREFIX.length;
            match = URL_PATTERN.exec(message);
            if (match) {
                let href = match[0];
                index += URL_PREFIX.length + href.length;
                // The grammar decoded the href before setting it.
                href = htmlParser().parseFromString(href, "text/html")
                    .documentElement.textContent;
                URL_SUFFIX.lastIndex = index;
                if (URL_SUFFIX.exec(message)) {
                    index = URL_SUFFIX.lastIndex;
                }
                parts.push(renderLink(href));
                continue;
            }
        }

        // 2. Bare URLs.
        if (startsURL(code)) {
            URL_PATTERN.lastIndex = index;
            match = URL_PATTERN.exec(message);
            if (match) {
                parts.push(renderLink(match[0]));
                index += match[0].length;
                continue;
            }
        }

        // 3. Totoz.
        if (code === 91 /* [ */) {
            TOTOZ.lastIndex = index;
            match = TOTOZ.exec(message);
            if (match) {
                parts.push(renderTotoz(match[1]));
                index += match[0].length;
                continue;
            }
        }

        // 4. Bigorno, only at the start of the message or after a whitespace.
        if (index === 0 || isWhitespace(code)) {
            match = matchBigorno(message, index);
            if (match) {
                parts.push(
                    `${match.spaces}<gc2-bigorno>${match.word}</gc2-bigorno>`,
                );
                index = match.end;
                continue;
            }
        }

        // 5. Clock references.
        if (isDigit(code)) {
            const norloge = matchNorloge(message, index);
            if (norloge) {
                parts.push(renderNorloge(norloge));
                index = norloge.end;
                continue;
            }
        }

        // 6. Formatting tags, with the same stack-based auto closing.
        if (code === 60 /* < */) {
            OPEN_TAG.lastIndex = index;
            match = OPEN_TAG.exec(message);
            if (match) {
                const tag = TAG_NAMES.get(match[1]);
                tagStack.push(tag);
                parts.push(`<${tag}>`);
                index += match[0].length;
                continue;
            }
            CLOSE_TAG.lastIndex = index;
            match = CLOSE_TAG.exec(message);
            if (match) {
                const tag = TAG_NAMES.get(match[1]);
                let closing = "";
                while (tagStack.length > 0) {
                    const popped = tagStack.pop();
                    closing += `</${popped}>`;
                    if (popped === tag) {
                        break;
                    }
                }
                parts.push(closing);
                index += match[0].length;
                continue;
            }
        }

        // 7. Entities are kept as-is.
        if (code === 38 /* & */) {
            ENTITY.lastIndex = index;
            match = ENTITY.exec(message);
            if (match) {
                parts.push(match[0]);
                index += match[0].length;
                continue;
            }
        }

        // 8. Special characters are escaped, everything else is copied.
        if (
            code === 60 ||
            code === 62 ||
            code === 38 ||
            code === 34 ||
            code === 39
        ) {
            parts.push(escapeChar(message[index]));
            index += 1;
            continue;
        }

        PLAIN_RUN.lastIndex = index;
        match = PLAIN_RUN.exec(message);
        if (match) {
            parts.push(match[0]);
            index += match[0].length;
        } else {
            parts.push(message[index]);
            index += 1;
        }
    }

    // Close every tag left open at the end of the message.
    while (tagStack.length > 0) {
        parts.push(`</${tagStack.pop()}>`);
    }

    return parts.join("");
}

const BOUCHOT_URL = /(?:(?:https?|ftp):\/\/)[^< \t\r\n"]+/y;
const BOUCHOT_TOTOZ = /\[:[^\]]+\]/y;
const BOUCHOT_PLAIN_RUN = /[^[hfd0-9]+/y;

/**
 * Rewrite the bouchot suffix of clock references when switching tribunes.
 * @param {string} message
 * @param {string} oldBouchot
 * @param {string} newBouchot
 * @returns {string}
 */
export function rewriteBouchotSuffix(message, oldBouchot, newBouchot) {
    const oldSuffix = oldBouchot ? `@${oldBouchot}` : "";
    const newSuffix = newBouchot ? `@${newBouchot}` : "";
    const suffixBouchot = (bouchot) => {
        if (!bouchot) {
            return oldSuffix;
        }
        return bouchot === newSuffix ? "" : bouchot;
    };

    const parts = [];
    const length = message.length;
    let index = 0;

    while (index < length) {
        const code = message.charCodeAt(index);
        let match;

        if (startsURL(code)) {
            BOUCHOT_URL.lastIndex = index;
            match = BOUCHOT_URL.exec(message);
            if (match) {
                parts.push(match[0]);
                index += match[0].length;
                continue;
            }
        }

        if (code === 91 /* [ */) {
            BOUCHOT_TOTOZ.lastIndex = index;
            match = BOUCHOT_TOTOZ.exec(message);
            if (match) {
                parts.push(match[0]);
                index += match[0].length;
                continue;
            }
        }

        if (isDigit(code)) {
            const norloge = matchNorloge(message, index);
            if (norloge) {
                const suffix = suffixBouchot(norloge.bouchot);
                const raw = message.slice(index, norloge.end);
                const withoutSuffix = norloge.bouchot
                    ? raw.slice(0, raw.length - norloge.bouchot.length)
                    : raw;
                parts.push(withoutSuffix + suffix);
                index = norloge.end;
                continue;
            }
        }

        BOUCHOT_PLAIN_RUN.lastIndex = index;
        match = BOUCHOT_PLAIN_RUN.exec(message);
        if (match) {
            parts.push(match[0]);
            index += match[0].length;
        } else {
            parts.push(message[index]);
            index += 1;
        }
    }

    return parts.join("");
}
