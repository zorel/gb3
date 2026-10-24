import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Minimal DOM/DOMParser stubs: the formatter renders links through an anchor
// element, exactly like the Peggy grammar it replaces did.
globalThis.DOMParser = class {
    parseFromString(value) {
        return {
            documentElement: {
                textContent: value
                    .replaceAll("&lt;", "<")
                    .replaceAll("&gt;", ">")
                    .replaceAll("&quot;", '"')
                    .replaceAll("&apos;", "'")
                    .replaceAll("&amp;", "&"),
            },
        };
    }
};
globalThis.document = {
    createElement: () => {
        const anchor = { innerText: "", href: "", target: "", rel: "" };
        Object.defineProperty(anchor, "outerHTML", {
            get() {
                const text = (value) =>
                    value
                        .replaceAll("&", "&amp;")
                        .replaceAll("<", "&lt;")
                        .replaceAll(">", "&gt;");
                const attribute = (value) =>
                    text(value).replaceAll('"', "&quot;");
                return `<a href="${attribute(anchor.href)}" target="${anchor.target}" rel="${anchor.rel}">${text(anchor.innerText)}</a>`;
            },
        });
        return anchor;
    },
};

const { backend2html, rewriteBouchotSuffix } =
    await import("../js/gc2-message.js");
const golden = JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), "golden.json")),
);

test("backend2html matches the output of the former Peggy grammar", () => {
    for (const [message, expected] of golden.backend) {
        assert.equal(
            backend2html(message),
            expected,
            `backend2html(${JSON.stringify(message)})`,
        );
    }
});

test("rewriteBouchotSuffix matches the output of the former Peggy grammar", () => {
    for (const [message, oldBouchot, newBouchot, expected] of golden.suffix) {
        assert.equal(
            rewriteBouchotSuffix(message, oldBouchot, newBouchot),
            expected,
            `rewriteBouchotSuffix(${JSON.stringify(message)}, ${oldBouchot} -> ${newBouchot})`,
        );
    }
});

test("backend2html keeps the message text", () => {
    assert.equal(backend2html("hello world"), "hello world");
    assert.equal(
        backend2html("<b>gras</b> et <i>italique</i>"),
        "<b>gras</b> et <i>italique</i>",
    );
    assert.equal(backend2html("<b>ouvert"), "<b>ouvert</b>");
});

test("backend2html escapes unsafe markup", () => {
    assert.equal(
        backend2html("<strong>x</strong>"),
        "&lt;strong&gt;x&lt;/strong&gt;",
    );
    assert.equal(backend2html("a & b"), "a &amp; b");
    assert.equal(backend2html('"quote"'), "&quot;quote&quot;");
});
