"use strict"

import wxLayout from "./wxLayout.mjs"
import wxSection from "./wxSection.mjs"
import wxRange from "./wxRange.mjs"
import wxGrid from "./wxTable.mjs"

export default class wxMovement {
    // =========================================================
    // Public API
    // =========================================================

    static leftWord(el) { return wxMovement.#moveByWord(el, -1) }
    static rightWord(el) { return wxMovement.#moveByWord(el, +1) }
    static upParagraph(el) { return wxMovement.#moveParagraph(el, -1) }
    static downParagraph(el) { return wxMovement.#moveParagraph(el, +1) }

    // =========================================================
    // Core: move by word
    // =========================================================

    static #moveByWord(el, dir) {
        if (!el) return false

        const rootSection = wxSection.getRoot()
        if (!rootSection) return false

        const p = wxMovement.#getParagraph(el, rootSection)
        if (!p) return false

        const segs = wxMovement.#getTextSegments(p)
        const fullText = segs.map(s => s.node.nodeValue ?? "").join("")
        if (!fullText.length) return false

        const pos = wxMovement.#getGlobalOffsetBeforeElement(segs, el)

        const target = dir < 0
            ? wxMovement.#findPrevWordStart(fullText, pos)
            : wxMovement.#findNextWordEnd(fullText, pos)

        if (target === pos) return false

        if (!wxMovement.#insertNodeAtGlobalOffset(p, segs, target, el)) return false

        wxMovement.#placeCaretAfter(el)
        wxRange.saveSelection()
        return true
    }

    // =========================================================
    // Core: move by paragraph
    // =========================================================

    static #moveParagraph(el, dir) {
        if (!el) return false

        const rootSection = wxSection.getRoot()
        if (!rootSection) return false

        const p = wxMovement.#getParagraph(el, rootSection)
        if (!p) return false

        const target = dir < 0 ? p.previousElementSibling : p.nextElementSibling
        if (!(target instanceof HTMLDivElement)) return false

        target.appendChild(el)

        wxMovement.#placeCaretAfter(el)
        wxRange.saveSelection()
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
        while (i >= 0 && !wxMovement.#isWordChar(text[i])) i--
        if (i < 0) return 0
        while (i >= 0 && wxMovement.#isWordChar(text[i])) i--
        return i + 1
    }

    static #findNextWordEnd(text, pos) {
        let i = Math.max(0, pos)
        while (i < text.length && !wxMovement.#isWordChar(text[i])) i++
        if (i >= text.length) return text.length
        while (i < text.length && wxMovement.#isWordChar(text[i])) i++
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

    static moveLeftWord(instance) { return wxMovement.leftWord(instance) }
    static moveRightWord(instance) { return wxMovement.rightWord(instance) }
    static moveParagraphUp(instance) { return wxMovement.upParagraph(instance) }
    static moveParagraphDown(instance) { return wxMovement.downParagraph(instance) }

    // alinhamento com wrap e sem “buraco” por margem
    static alignLeft(instance) { return wxLayout.alignObject(instance, "left") }
    static alignRight(instance) { return wxLayout.alignObject(instance, "right") }
    static alignCenter(instance) { return wxLayout.alignObject(instance, "center") }

    // resize unificado
    static increase(instance) { return wxLayout.increase(instance) }
    static decrease(instance) { return wxLayout.decrease(instance) }
}
