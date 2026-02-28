'use strict'

import ActEdit from './ActEdit.mjs'
import wxPage from './WdxDocument.mjs'
import WdxParagraph from './WdxParagraph.mjs'

export default class WdxSection {
    static #rootSection

    #wxPage
    #wdxSection
    #paragraphs = []
    
    constructor(WdxDocument, role, textContent = "") {
        this.#wxPage = WdxDocument

        this.#wdxSection = document.createElement("div")
        this.#wdxSection.tabIndex = -1
        this.#wdxSection.classList.add("editable", "workspace", role)
        this.#wdxSection.contentEditable = "true"
        
        this.#wxPage.owner.pushAttribute(this.#wdxSection, "wrdKind", "section")
        this.#wxPage.owner.pushAttribute(this.#wdxSection, "wrdRole", role)
        this.#wxPage.owner.pushEventListener(this.#wdxSection, "keydown", (e) => ActEdit.onKeyDown(e))
        this.#wxPage.owner.pushEventListener(this.#wdxSection, "focus", () => WdxSection.#rootSection = this.#wdxSection)

        this.addParagraph()
        if (textContent.trim())
            this.#paragraphs[0].element.textContent = textContent
        else
            this.#paragraphs[0].element.appendChild(document.createElement("br"))
        this.#wdxSection.append(this.#paragraphs[0].element)
    }

    get owner() {
        return this.#wxPage
    }

    get element() {
        return this.#wdxSection
    }

    get wordex() {
        return this.ws
    }

    get htmlTag() {
        return "div"
    }

    selectedParagraph() {
        const paragraph = this.#paragraphs.find(p => p.isSelected)?.element
        if (paragraph)
            return paragraph
    }

    unselectParagraph() {
        const selected = this.selectedParagraph()
        if (selected instanceof HTMLDivElement)
            delete selected.dataset.wxSelected
    }

    selectParagraph(id) {
        this.unselectParagraph()
        const selected = this.#paragraphs.find(p => p.element.id === id)?.element
        if (selected instanceof HTMLDivElement)
            selected.dataset.wxSelected = "1"
    }
    addParagraph() {
        this.#paragraphs.push(new WdxParagraph(this.#wdxSection))
    }
    removeParagraph() {
        const selected = this.selectedParagraph()
        if (selected instanceof HTMLDivElement) {
            const idx = this.#paragraphs.findIndex(paragraph => paragraph.root.id === selected.id)
            if (idx >= 0)
                this.#paragraphs.splice(idx, 1)
            selected.remove()
        }
    }

    get isSelected() {
        return this.#wdxSection.dataset.wdxKind ? true : false
    }

    get isHeader() {
        return this.#wdxSection.dataset.wdxKind === "section" && this.#wdxSection.dataset.wdxSector === "header"
    }

    get isBody() {
        return this.#wdxSection.dataset.wdxKind === "section" && this.#wdxSection.dataset.wdxSector === "body"
    }

    get isFooter() {
        return this.#wdxSection.dataset.wdxKind === "section" && this.#wdxSection.dataset.wdxSector === "footer"
    }

    get firstParagraph() {
        if (this.#paragraphs.length)
            return this.#paragraphs[0]
    }

    get lastParagraph() {
        const length = this.#paragraphs.length
        if (length)
            return this.#paragraphs[length - 1]
    }

    static getRoot() {
        return WdxSection.#rootSection
    }

    static setRoot(value) {
        WdxSection.#rootSection = value
    }
}
