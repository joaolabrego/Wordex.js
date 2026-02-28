"use strict"

import ActEdit from "./ActEdit.mjs"
import wxPicture from "./WdxImage.mjs"
import WdxParagraph from "./WdxParagraph.mjs"
import wxGrid from "./WdxTable.mjs"
import WdxTableCell from "./WdxTableCell.mjs"
import WdxTableRow from "./WdxTableRow.mjs"
import WdxTableCol from "./WdxTableCol.mjs"
import WdxSection from "./WdxSection.mjs"
import SysRange from "./SysRange.mjs"
import Config from "./Config.mjs"
import SysClass from "./SysClass.mjs"

export default class WdxDocument {
    #WdxTemplate = null
    #wdxDocument = null
    #wxHeader = null
    #SysBody = null
    #wxFooter = null
    #wxFocusedSection = null

    constructor(template) {
        this.#WdxTemplate = template

        /*
        const header = this.wordex.objectNew(this, WdxSection,
              {
                cssStyle: Config.ScriptDocument,
                cssClasses: ["document"],
                eventListeners: [
                  {
                    name: "beforeinput",
                    handler: (e) => {
                      if (this.toolbar.isOverwriteMode)
                        ActEdit.handleOverwriteInput(e)
                    }
                  }
                ]
              })
        */
        
        const header = new SysClass(this, WdxSection)
        


        this.#wxHeader = new WdxSection(this, "header", "Cabeçalho: clique para editar")
        this.#wdxDocument.appendChild(this.#wxHeader.element)
        this.wordex.pushObject(this.#wxHeader)

        this.#SysBody = new WdxSection(this, "body", "Corpo do documento: clique para editar")
        this.wordex.pushObject(this.#SysBody)
        this.#wdxDocument.appendChild(this.#SysBody.element)


        this.#wxFooter = new WdxSection(this, "footer", "Rodapé: clique para editar")
        this.wordex.pushObject(this.#wxFooter)
        this.#wdxDocument.appendChild(this.#wxFooter.element)
        
        WdxSection.setRoot(this.#SysBody.element)

        // Registra handlers de clique para parágrafo, tabela e imagem em cada seção editável
        for (const section of [this.#wxHeader, this.#SysBody, this.#wxFooter]) {
            WdxParagraph.attach(section.element)
            wxGrid.attach(section.element)
            wxPicture.attach(section.element)
        }
    }
    /**
     * Retorna objeto da classe WdxTemplate.
     * @returns {HTMLElement}
     */
    get owner() {
        return this.#WdxTemplate
    }
    /**
     * Retorna objeto HTML da classe WdxDocument.
     * @returns {HTMLElement}
     */
    get element() {
        return this.#wdxDocument
    }

    get wordex() {
        this.#WdxTemplate.wordex
    }

    get htmlTag() {
        return "div"
    }

    get headerElment() {
        return this.#wxHeader.element
    }

    get bodyElement() {
        return this.#SysBody.element
    }

    get footerElement() {
        return this.#wxFooter.element
    }

    get focusedSection() {
        return this.#wxFocusedSection
    }

    setColor(hex) {
        if (!hex)
            return false
        SysRange.restoreRange(SysRange.range)

        const selection = window.getSelection()
        const hasSelection = !!selection && selection.rangeCount && !selection.getRangeAt(0).collapsed
        if (hasSelection) {
            return SysRange.setFontColor(hex)
        }

        const paragraph = WdxDocument.getParagraphTarget()
        if (paragraph) {
            paragraph.style.color = hex
            return true
        }
        const section = WdxSection.focused()
        if (section) {
            section.style.color = hex
            return true
        }

        return false
    }

    static async insertTable(rows = 2, cols = 2) {
        if (!wxGrid || typeof wxGrid.insertAtSelection !== "function")
            return false
        return !!wxGrid.insertAtSelection(rows, cols)
    }    

    // =========================================================
    // Helpers
    // =========================================================

    static #callIfExists(obj, method, ...args) {
        const fn = obj?.[method]
        if (typeof fn !== "function") return undefined
        return fn.apply(obj, args)
    }

    static #getActiveTable() {
        const cell = WdxDocument.#callIfExists(WdxTableCell, "getActive")
        if (cell) return /** @type {HTMLTableElement|null} */ (cell.closest("table"))

        const tr = WdxDocument.#callIfExists(WdxTableRow, "getActive")
        if (tr) return /** @type {HTMLTableElement|null} */ (tr.closest("table"))

        const col = WdxDocument.#callIfExists(WdxTableCol, "getActive")
        if (col?.table) return col.table

        return null
    }

    static getParagraphTarget() {
        const fp = WdxDocument.#callIfExists(WdxParagraph, "getFocused")
        if (fp) return fp
        SysRange.restoreRange(SysRange.range)

        return WdxParagraph.getActive()
    }
    // =========================================================
    // Resolver (Cell -> Row -> Col -> wxPicture -> Text -> WdxParagraph)
    // =========================================================
    static selectedTarget() {
        if (WdxDocument.#callIfExists(WdxTableCell, "hasSelection") || WdxDocument.#callIfExists(WdxTableCell, "hasActive"))
            return { kind: "cell", obj: WdxTableCell }

        if (WdxDocument.#callIfExists(WdxTableRow, "hasSelection") || WdxDocument.#callIfExists(WdxTableRow, "hasActive"))
            return { kind: "row", obj: WdxTableRow }

        const table = WdxDocument.#getActiveTable()
        if ((table && WdxDocument.#callIfExists(WdxTableCol, "hasSelection", table)) || WdxDocument.#callIfExists(WdxTableCol, "hasActive"))
            return { kind: "col", obj: WdxTableCol }

        if (wxPicture.hasFocus()) return { kind: "image", obj: wxPicture }

        if (wxGrid.hasFocus()) return { kind: "table", obj: wxGrid }

        if (SysRange.hasSelection()) return { kind: "text", obj: SysRange }

        return { kind: "paragraph", obj: WdxParagraph }
    }

    // =========================================================
    // WdxToolbar verbs
    // =========================================================

    static border(widthPx, color) {
        SysRange.restoreRange(SysRange.range)

        if (wxGrid.applyBorder(widthPx, color)) return true
        if (wxPicture.applyBorder(widthPx, color)) return true

        const p = WdxDocument.getParagraphTarget()
        if (!p) return false
        p.style.borderStyle = widthPx === "0px" ? "none" : "solid"
        p.style.borderWidth = widthPx
        p.style.borderColor = color
        p.style.padding = "2px 4px"
        return true
    }

    static borderRadius(radiusPx) {
        SysRange.restoreRange(SysRange.range)

        if (wxGrid.applyBorderRadius(radiusPx)) return true
        if (wxPicture.applyBorderRadius(radiusPx)) return true

        const p = WdxDocument.getParagraphTarget()
        if (!p)
            return false
        p.style.borderRadius = radiusPx
        
        return true
    }

    static increase() {
        const t = WdxDocument.selectedTarget()
        if (t.kind === "image") {
            const img = wxPicture.getFocused()
            if (img)
                wxPicture.increase(img)
            return true
        }
        if (t.kind === "cell" || t.kind === "row" || t.kind === "col" || t.kind === "table") {
            const table = wxGrid.getFocused();
            if (table)
                wxGrid.increase(table);
            return true
        }
        return !WdxDocument.#callIfExists(WdxParagraph, "increase")
    }

    static decrease() {
        const t = WdxDocument.selectedTarget()
        if (t.kind === "image") {
            const img = wxPicture.getFocused();
            if (img)
                wxPicture.decrease(img);
            return true
        }
        if (t.kind === "cell" || t.kind === "row" || t.kind === "col" || t.kind === "table") {
            const table = wxGrid.getFocused();
            if (table)
                wxGrid.decrease(table);
            return true
        }
        return !WdxDocument.#callIfExists(WdxParagraph, "decrease")
    }

    static left() {
        const t = WdxDocument.selectedTarget()
        if (t.kind === "image") {
            const img = wxPicture.getFocused();
            if (img)
                wxPicture.moveLeftWord(img);
            return true
        }
        if (t.kind === "cell" || t.kind === "row" || t.kind === "col" || t.kind === "table") {
            const table = wxGrid.getFocused();
            if (table)
                wxGrid.moveLeftWord(table);
            return true
        }
        return !WdxDocument.#callIfExists(WdxParagraph, "left")
    }

    static right() {
        const t = WdxDocument.selectedTarget()
        if (t.kind === "image") { const img = wxPicture.getFocused(); if (img) wxPicture.moveRightWord(img); return true }
        if (t.kind === "cell" || t.kind === "row" || t.kind === "col" || t.kind === "table") { const table = wxGrid.getFocused(); if (table) wxGrid.moveRightWord(table); return true }
        return !WdxDocument.#callIfExists(WdxParagraph, "right")
    }

    static up() {
        const t = WdxDocument.selectedTarget()
        if (t.kind === "image") { const img = wxPicture.getFocused(); if (img) wxPicture.moveUp(img); return true }
        if (t.kind === "cell" || t.kind === "row" || t.kind === "col" || t.kind === "table") { const table = wxGrid.getFocused(); if (table) wxGrid.moveUp(table); return true }
        return !WdxDocument.#callIfExists(WdxParagraph, "up")
    }

    static down() {
        const t = WdxDocument.selectedTarget()
        if (t.kind === "image") { const img = wxPicture.getFocused(); if (img) wxPicture.moveDown(img); return true }
        if (t.kind === "cell" || t.kind === "row" || t.kind === "col" || t.kind === "table") { const table = wxGrid.getFocused(); if (table) wxGrid.moveDown(table); return true }
        return !WdxDocument.#callIfExists(WdxParagraph, "down")
    }
}