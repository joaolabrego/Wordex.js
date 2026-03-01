"use strict"

import wxPicture from "./WdxImage.mjs"
import WdxParagraph from "./WdxParagraph.mjs"
import wxGrid from "./WdxTable.mjs"
import WdxTableCell from "./WdxTableCell.mjs"
import WdxTableRow from "./WdxTableRow.mjs"
import WdxTableCol from "./WdxTableCol.mjs"
import WdxSection from "./WdxSection.mjs"
import SysRange from "./SysRange.mjs"
import SysObject from "./SysObject.mjs"

export default class WrdDocument {
    #wxTemplate = null
    #objHeader = null
    #objBody = null
    #objFooter = null
    #wxFocusedSection = null

    constructor(template) {
        this.#wxTemplate = template

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
        const header = new SysObject(this, WdxSection)
        
        this.#objHeader = new SysObject(this, WdxSection)
        this.#objHeader.element.textContent = "Cabeçalho: clique para editar"
        this.#objHeader.appendClassName("editable")
        this.#objHeader.appendClassName("workspace")
        this.#objHeader.appendClassName("header")
        this.#objHeader.contentEditable = true
        this.#objHeader.wrFocable = true
        this.#wxTemplate.document.appendElement(this.#objHeader.element)

        //this.wordex.pushObject(this.#wxHeader)

        this.#objBody = new SysObject(this, WdxSection)
        this.#objBody.element.textContent = "Corpo do documento: clique para editar"
        this.#objBody.appendClassName("editable")
        this.#objBody.appendClassName("workspace")
        this.#objBody.appendClassName("body")
        this.#objBody.contentEditable = true
        this.#wxTemplate.document.appendElement(this.#objBody.element)

        this.#objFooter = new SysObject(this, WdxSection)
        this.#objFooter.element.textContent = "Rodapé: clique para editar"
        this.#objFooter.appendClassName("editable")
        this.#objFooter.appendClassName("workspace")
        this.#objFooter.appendClassName("footer")
        this.#objFooter.contentEditable = true
        this.#wxTemplate.document.appendElement(this.#objFooter.element)
/*
        WdxSection.setRoot(this.#SysBody.element)

        // Registra handlers de clique para parágrafo, tabela e imagem em cada seção editável
        for (const section of [this.#wxHeader, this.#SysBody, this.#wxFooter]) {
            WdxParagraph.attach(section.element)
            wxGrid.attach(section.element)
            wxPicture.attach(section.element)
        }
*/        
    }

    /**
     * Retorna objeto da classe WrdTemplate.
     * @returns {HTMLElement}
     */
    get owner() {
        return this.#wxTemplate
    }
    /**
     * Retorna objeto HTML da classe WrdDocument.
     * @returns {HTMLElement}
     */
    get wordex() {
        this.#wxTemplate.wordex
    }

    get htmlTag() {
        return "div"
    }

    get header() {
        return this.#objHeader
    }

    get body() {
        return this.#objBody
    }

    get footer() {
        return this.#objFooter
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

        const paragraph = WrdDocument.getParagraphTarget()
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
        const cell = WrdDocument.#callIfExists(WdxTableCell, "getActive")
        if (cell) return /** @type {HTMLTableElement|null} */ (cell.closest("table"))

        const tr = WrdDocument.#callIfExists(WdxTableRow, "getActive")
        if (tr) return /** @type {HTMLTableElement|null} */ (tr.closest("table"))

        const col = WrdDocument.#callIfExists(WdxTableCol, "getActive")
        if (col?.table) return col.table

        return null
    }

    static getParagraphTarget() {
        const fp = WrdDocument.#callIfExists(WdxParagraph, "getFocused")
        if (fp) return fp
        SysRange.restoreRange(SysRange.range)

        return WdxParagraph.getActive()
    }
    // =========================================================
    // Resolver (Cell -> Row -> Col -> wxPicture -> Text -> WdxParagraph)
    // =========================================================
    static selectedTarget() {
        if (WrdDocument.#callIfExists(WdxTableCell, "hasSelection") || WrdDocument.#callIfExists(WdxTableCell, "hasActive"))
            return { kind: "cell", obj: WdxTableCell }

        if (WrdDocument.#callIfExists(WdxTableRow, "hasSelection") || WrdDocument.#callIfExists(WdxTableRow, "hasActive"))
            return { kind: "row", obj: WdxTableRow }

        const table = WrdDocument.#getActiveTable()
        if ((table && WrdDocument.#callIfExists(WdxTableCol, "hasSelection", table)) || WrdDocument.#callIfExists(WdxTableCol, "hasActive"))
            return { kind: "col", obj: WdxTableCol }

        if (wxPicture.hasFocus()) return { kind: "image", obj: wxPicture }

        if (wxGrid.hasFocus()) return { kind: "table", obj: wxGrid }

        if (SysRange.hasSelection()) return { kind: "text", obj: SysRange }

        return { kind: "paragraph", obj: WdxParagraph }
    }

    // =========================================================
    // WrdToolbar verbs
    // =========================================================

    static border(widthPx, color) {
        SysRange.restoreRange(SysRange.range)

        if (wxGrid.applyBorder(widthPx, color)) return true
        if (wxPicture.applyBorder(widthPx, color)) return true

        const p = WrdDocument.getParagraphTarget()
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

        const p = WrdDocument.getParagraphTarget()
        if (!p)
            return false
        p.style.borderRadius = radiusPx
        
        return true
    }

    static increase() {
        const t = WrdDocument.selectedTarget()
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
        return !WrdDocument.#callIfExists(WdxParagraph, "increase")
    }

    static decrease() {
        const t = WrdDocument.selectedTarget()
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
        return !WrdDocument.#callIfExists(WdxParagraph, "decrease")
    }

    static left() {
        const t = WrdDocument.selectedTarget()
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
        return !WrdDocument.#callIfExists(WdxParagraph, "left")
    }

    static right() {
        const t = WrdDocument.selectedTarget()
        if (t.kind === "image") { const img = wxPicture.getFocused(); if (img) wxPicture.moveRightWord(img); return true }
        if (t.kind === "cell" || t.kind === "row" || t.kind === "col" || t.kind === "table") { const table = wxGrid.getFocused(); if (table) wxGrid.moveRightWord(table); return true }
        return !WrdDocument.#callIfExists(WdxParagraph, "right")
    }

    static up() {
        const t = WrdDocument.selectedTarget()
        if (t.kind === "image") { const img = wxPicture.getFocused(); if (img) wxPicture.moveUp(img); return true }
        if (t.kind === "cell" || t.kind === "row" || t.kind === "col" || t.kind === "table") { const table = wxGrid.getFocused(); if (table) wxGrid.moveUp(table); return true }
        return !WrdDocument.#callIfExists(WdxParagraph, "up")
    }

    static down() {
        const t = WrdDocument.selectedTarget()
        if (t.kind === "image") { const img = wxPicture.getFocused(); if (img) wxPicture.moveDown(img); return true }
        if (t.kind === "cell" || t.kind === "row" || t.kind === "col" || t.kind === "table") { const table = wxGrid.getFocused(); if (table) wxGrid.moveDown(table); return true }
        return !WrdDocument.#callIfExists(WdxParagraph, "down")
    }
}