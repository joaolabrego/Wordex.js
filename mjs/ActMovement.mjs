"use strict"

import ActLayout from "./ActLayout.mjs"
import WdxSection from "./WdxSection.mjs"
import SysRange from "./SysRange.mjs"
import wxGrid from "./WdxTable.mjs"

export default class ActMovement {
    // =========================================================
    // Public API
    // =========================================================

    static leftWord(el) { return ActMovement.#moveByWord(el, -1) }
    static rightWord(el) { return ActMovement.#moveByWord(el, +1) }
    static upParagraph(el) { return ActMovement.#moveParagraph(el, -1) }
    static downParagraph(el) { return ActMovement.#moveParagraph(el, +1) }

    // =========================================================
    // Core: move by word
    // =========================================================

    static #moveByWord(el, dir) {
        if (!el) return false

        const rootSection = WdxSection.getRoot()
        if (!rootSection) return false

        const p = ActMovement.#getParagraph(el, rootSection)
        if (!p) return false

        const segs = ActMovement.#getTextSegments(p)
        const fullText = segs.map(s => s.node.nodeValue ?? "").join("")
        if (!fullText.length) return false

        const pos = ActMovement.#getGlobalOffsetBeforeElement(segs, el)

        const target = dir < 0
            ? ActMovement.#findPrevWordStart(fullText, pos)
            : ActMovement.#findNextWordEnd(fullText, pos)

        if (target === pos) return false

        if (!ActMovement.#insertNodeAtGlobalOffset(p, segs, target, el)) return false

        ActMovement.#placeCaretAfter(el)
        SysRange.saveSelection()
        return true
    }

    // =========================================================
    // Core: move by paragraph
    // =========================================================

    static #moveParagraph(el, dir) {
        if (!el) return false

        const rootSection = WdxSection.getRoot()
        if (!rootSection) return false

        const p = ActMovement.#getParagraph(el, rootSection)
        if (!p) return false

        const target = dir < 0 ? p.previousElementSibling : p.nextElementSibling
        if (!(target instanceof HTMLDivElement)) return false

        target.appendChild(el)

        ActMovement.#placeCaretAfter(el)
        SysRange.saveSelection()
        return true
    }

    // =========================================================
    // Helpers
    // =========================================================

    static #getParagraph(el, rootSection) {
        /** @type {HTMLElement|null} */
        let cur = /** @type {HTMLElement} */ (el)
        while (cur && cur !== rootSection) {
            const parent = /** @type {HTMLElement} */ (cur.parentElement)
            if (parent === rootSection) return /** @type {HTMLDivElement} */ (cur)
            cur = parent
        }
        return null
    }

    static #getTextSegments(p) {
        /** @type {{node: Text, start: number, end: number}[]} */
        const segs = []
        let acc = 0

        const w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT)
        /** @type {Node|null} */
        let n
        while ((n = w.nextNode())) {
            const t = /** @type {Text} */ (n)
            const len = (t.nodeValue ?? "").length
            segs.push({ node: t, start: acc, end: acc + len })
            acc += len
        }
        return segs
    }

    static #getGlobalOffsetBeforeElement(segs, el) {
        let acc = 0
        for (const s of segs) {
            const rel = s.node.compareDocumentPosition(el)
            const isBefore = (rel & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
            if (isBefore) acc += (s.end - s.start)
        }
        return acc
    }

    static #findPrevWordStart(text, pos) {
        let i = Math.min(pos - 1, text.length - 1)
        while (i >= 0 && !ActMovement.#isWordChar(text[i])) i--
        if (i < 0) return 0
        while (i >= 0 && ActMovement.#isWordChar(text[i])) i--
        return i + 1
    }

    static #findNextWordEnd(text, pos) {
        let i = Math.max(0, pos)
        while (i < text.length && !ActMovement.#isWordChar(text[i])) i++
        if (i >= text.length) return text.length
        while (i < text.length && ActMovement.#isWordChar(text[i])) i++
        return i
    }

    static #isWordChar(ch) {
        return /[0-9A-Za-zÀ-ÿ_]/.test(ch)
    }

    static #insertNodeAtGlobalOffset(p, segs, target, el) {
        const total = segs.length ? segs[segs.length - 1].end : 0
        if (target >= total) {
            p.appendChild(el)
            return true
        }

        const seg = segs.find(s => target >= s.start && target <= s.end)
        if (!seg) return false

        const tn = seg.node
        const off = target - seg.start
        const len = (tn.nodeValue ?? "").length

        if (off > 0 && off < len) {
            const right = tn.splitText(off)
            right.parentNode?.insertBefore(el, right)
            return true
        }

        if (off === 0) {
            tn.parentNode?.insertBefore(el, tn)
            return true
        }

        if (off === len) {
            const ref = tn.nextSibling
            if (ref) tn.parentNode?.insertBefore(el, ref)
            else tn.parentNode?.appendChild(el)
            return true
        }

        return false
    }

    static #placeCaretAfter(el) {
        const r = document.createRange()
        r.setStartAfter(el)
        r.collapse(true)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(r)
    }

    static moveLeftWord(instance) { return ActMovement.leftWord(instance) }
    static moveRightWord(instance) { return ActMovement.rightWord(instance) }
    static moveParagraphUp(instance) { return ActMovement.upParagraph(instance) }
    static moveParagraphDown(instance) { return ActMovement.downParagraph(instance) }

    // alinhamento com wrap e sem “buraco” por margem
    static alignLeft(instance) { return ActLayout.alignObject(instance, "left") }
    static alignRight(instance) { return ActLayout.alignObject(instance, "right") }
    static alignCenter(instance) { return ActLayout.alignObject(instance, "center") }

    // resize unificado
    static increase(instance) { return ActLayout.increase(instance) }
    static decrease(instance) { return ActLayout.decrease(instance) }
}
