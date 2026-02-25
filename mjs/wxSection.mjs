'use strict'

import wxEdit from './wxEdit.mjs'
import wxPage from './wxPage.mjs'
import wxParagraph from './wxParagraph.mjs'

export default class wxSection {
    static #rootSection

    #page
    #section
    #paragraphs = []
    
    constructor(page, sector, textContent = "") {
        this.#page = page

        this.#section = /** @type {wdxSection} */(document.createElement("div"))
        this.#section.id = sector
        this.#section.tabIndex = -1
        this.#section.dataset.wdxKind = "section"
        this.#section.dataset.wdxSector = sector
        this.#section.classList.add("editable", "workspace", sector)
        this.#section.contentEditable = "true"

        this.#section.addEventListener("keydown", (e) => wxEdit.onKeyDown(e))
        this.#section.addEventListener("focus", () => wxSection.#rootSection = this.#section)

        this.addParagraph()
        if (textContent.trim())
            this.#paragraphs[0].element.textContent = textContent
        else
            this.#paragraphs[0].element.appendChild(document.createElement("br"))
        this.#section.append(this.#paragraphs[0].element)
    }

    selectedParagraph() {
        const paragraph = this.#paragraphs.find(p => p.isSelected)?.root
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
        const selected = this.#paragraphs.find(p => p.root.id === id)?.root
        if (selected instanceof HTMLDivElement)
            selected.dataset.wxSelected = "1"
    }
    addParagraph() {
        this.#paragraphs.push(new wxParagraph(this.#section))
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
        return this.#section.dataset.wdxKind ? true : false
    }

    get isHeader() {
        return this.#section.dataset.wdxKind === "section" && this.#section.dataset.wdxSector === "header"
    }

    get isBody() {
        return this.#section.dataset.wdxKind === "section" && this.#section.dataset.wdxSector === "body"
    }

    get isFooter() {
        return this.#section.dataset.wdxKind === "section" && this.#section.dataset.wdxSector === "footer"
    }

    get owner() {
        return this.#page
    }

    get root() {
        return this.#section
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
        return wxSection.#rootSection
    }

    static setRoot(value) {
        wxSection.#rootSection = value
    }
}
