"use strict"

import ActMovement from "./ActMovement.mjs"
import SysRange from "./SysRange.mjs"
import ActLayout from "./ActLayout.mjs"
import wxPage from "./WdxDocument.mjs"

export default class WdxTable {
    #page
    static activeCell = null
    static selectedTable = null

    // 0 = table, 1 = row, 2 = col
    static #cycleMode = 0
    
    static #selectedRow = null
    static #selectedCol = null

    static #SEL_W = 2
    static #SEL_COLOR = "#0AEC0A"

    constructor(page) {
        this.#page = page
        
    }
    get htmlTag() {
        return "table"
    }


    // =========================================================
    // Attach (mouse)
    // =========================================================
    static attach(scope) {
        scope.addEventListener("mousedown", (e) => {
            const t = /** @type {HTMLElement} */ (e.target)

            const cell = t.closest("td, th")
            if (!(cell instanceof HTMLTableCellElement)) {
                WdxTable.#clearAll()
                return
            }

            const table = cell.closest("table")
            if (!(table instanceof HTMLTableElement)) return

            if (e.ctrlKey) {
                // se não era a mesma tabela, apenas seleciona tabela
                if (WdxTable.selectedTable !== table) {
                    WdxTable.#focusTable(table)
                    WdxTable.#clearRowCol()
                    WdxTable.#clearCell()
                    WdxTable.#cycleMode = 0
                    e.preventDefault()
                    return
                }

                // ciclo row -> col -> table
                if (WdxTable.#cycleMode === 0) {
                    WdxTable.#selectRowFromCell(cell)
                    WdxTable.#cycleMode = 1
                } else if (WdxTable.#cycleMode === 1) {
                    WdxTable.#selectColFromCell(cell)
                    WdxTable.#cycleMode = 2
                } else {
                    WdxTable.#clearRowCol()
                    WdxTable.#cycleMode = 0
                }

                // ctrl-click não seleciona célula
                WdxTable.#clearCell()
                e.preventDefault()
                return
            }

            // clique comum: seleciona célula
            WdxTable.#focusTable(table)
            WdxTable.#clearRowCol()
            WdxTable.#cycleMode = 0
            WdxTable.#focusCell(cell)
            WdxTable.#placeCaretInCell(cell)
            SysRange.saveSelection()
        })
    }

    // =========================================================
    // Focus API
    // =========================================================
    static hasFocus() { return !!WdxTable.selectedTable }
    static getFocused() { return WdxTable.selectedTable }

    static hasActiveCell() { return !!WdxTable.activeCell }
    static getActiveCell() { return WdxTable.activeCell }

    static hasSelectedRow() { return !!WdxTable.#selectedRow }
    static getSelectedRow() { return WdxTable.#selectedRow }

    static hasSelectedCol() { return !!WdxTable.#selectedCol }
    static getSelectedCol() { return WdxTable.#selectedCol }

    // =========================================================
    // Create / Insert
    // =========================================================
    static create(rows = 2, cols = 2) {
        rows = Math.max(1, rows | 0)
        cols = Math.max(1, cols | 0)

        const table = document.createElement("table")
        table.classList.add("wx-table")

        // radius externo funcionar nos cantos
        table.style.borderCollapse = "separate"
        table.style.borderSpacing = "0"

        // default: "objeto inline" (mas sem margem lateral pra não criar gap no meio de palavra)
        table.style.display = "inline-table"
        table.style.verticalAlign = "baseline"
        table.style.margin = "0"
        table.style.width = "auto"

        // borda externa real (persistente)
        table.style.borderStyle = "none"
        table.style.borderWidth = "0px"
        table.style.borderColor = ""
        table.style.borderRadius = ""
        table.style.overflow = ""

        const tbody = document.createElement("tbody")

        for (let r = 0; r < rows; r++) {
            const tr = document.createElement("tr")
            for (let c = 0; c < cols; c++) {
                const td = document.createElement("td")
                td.classList.add("wx-cell")
                td.style.border = "1px solid #777"
                td.style.padding = "4px 8px"
                td.style.minWidth = "110px"
                td.appendChild(document.createElement("br"))
                tr.appendChild(td)
            }
            tbody.appendChild(tr)
        }

        table.appendChild(tbody)
        return table
    }

    static insertAtSelection(rows = 2, cols = 2) {
        SysRange.restoreRange(SysRange.range)

        const selection = window.getSelection()
        if (!selection || !selection.rangeCount)
            return false
        const range = selection.getRangeAt(0)

        const sc = range.startContainer
        const anchor = sc instanceof Element ? sc : sc.parentElement
        if (anchor?.closest("td, th"))
            return false

        if (!range.collapsed)
            range.deleteContents()

        const table = WdxTable.create(rows, cols)

        // se estiver no meio de TextNode, split é automático, mas vamos evitar “surpresas”:
        // insere e garante que não cria nós de espaço.
        range.insertNode(table)

        // nasce selecionada
        WdxTable.#focusTable(table)
        WdxTable.#clearRowCol()
        WdxTable.#clearCell()
        WdxTable.#cycleMode = 0

        const firstCell = table.querySelector("td")
        if (firstCell instanceof HTMLTableCellElement) {
            WdxTable.#focusCell(firstCell)
            WdxTable.#placeCaretInCell(firstCell)
            SysRange.saveSelection()
            return true
        }

        range.setStartAfter(table)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
        SysRange.saveSelection()
        return true
    }

    static align(dir) {
        const t = WdxTable.selectedTable
        if (!t)
            return false
        // limpa estado anterior
        t.style.float = ""
        t.style.clear = ""
        t.style.display = ""
        t.style.marginLeft = ""
        t.style.marginRight = ""
        t.style.marginTop = ""
        t.style.marginBottom = ""

        // evita “espaço” artificial ao inserir no meio: margem lateral default = 0
        // e só adiciona margem quando float (pra dar respiro do texto)
        if (dir === "left") {
            t.style.float = "left"
            t.style.display = "table"
            t.style.margin = "4px 10px 6px 0"
            return
        }
        if (dir === "right") {
            t.style.float = "right"
            t.style.display = "table"
            t.style.margin = "4px 0 6px 10px"
            return
        }
        // center
        t.style.float = "none"
        t.style.display = "table"
        t.style.margin = "6px auto"
        t.style.clear = "both"

        return true
    }

    static #resize(instance, factor) {
        if (!instance)
            return false

        const width = instance.getBoundingClientRect().width
        if (!width)
            return false

        const newWidth = Math.max(20, Math.round(width * factor))
        instance.style.width = newWidth + "px"

        if (instance instanceof HTMLImageElement)
            instance.style.height = "auto"

        SysRange.saveSelection()
        return true
    }

    static increase(table) {
        if (!table)
            return
        WdxTable.#resize(table, 1.1)
    }
    
    static decrease(t) {
        if (!t) return
        ActLayout.decrease(t)
    }

    static moveLeftWord(t) {
        if (!t) return
        ActMovement.moveLeftWord(t)
    }

    static moveRightWord(t) {
        if (!t) return
        ActMovement.moveRightWord(t)
    }

    static moveUp(t) {
        if (!t) return
        ActMovement.moveParagraphUp(t)
    }

    static moveDown(t) {
        if (!t) return
        ActMovement.moveParagraphDown(t)
    }

    // =========================================================
    // Border / Radius (wxPage)
    // prioridade: row/col -> cell -> table
    // =========================================================
    static applyBorder(widthPx, color) {
        const table = WdxTable.selectedTable
        if (!table) return false

        const borderStyle = widthPx === "0px" ? "none" : "solid"

        if (WdxTable.#selectedRow) {
            for (const cell of WdxTable.#selectedRow.cells) {
                cell.style.borderStyle = borderStyle
                cell.style.borderWidth = widthPx
                cell.style.borderColor = color
            }
            return true
        }

        if (WdxTable.#selectedCol) {
            const { table, index } = WdxTable.#selectedCol
            for (const tr of table.rows) {
                const td = tr.cells[index]
                if (!td) continue
                td.style.borderStyle = borderStyle
                td.style.borderWidth = widthPx
                td.style.borderColor = color
            }
            return true
        }

        if (WdxTable.activeCell) {
            const td = WdxTable.activeCell
            td.style.borderStyle = borderStyle
            td.style.borderWidth = widthPx
            td.style.borderColor = color
            return true
        }

        // borda externa real (persistente)
        table.style.borderStyle = borderStyle
        table.style.borderWidth = widthPx
        table.style.borderColor = color

        // mantém seleção verde (outline)
        WdxTable.#renderSelection(table, true)
        return true
    }

    static applyBorderRadius(radiusPx) {
        const table = WdxTable.selectedTable
        if (!table) return false

        /** @param {Iterable<HTMLTableCellElement>} cells */
        const clearCells = (cells) => {
            for (const td of cells) {
                td.style.borderRadius = ""
                td.style.borderTopLeftRadius = ""
                td.style.borderTopRightRadius = ""
                td.style.borderBottomLeftRadius = ""
                td.style.borderBottomRightRadius = ""
            }
        }

        const allCells = /** @type {NodeListOf<HTMLTableCellElement>} */ (
            table.querySelectorAll("td,th")
        )

        if (WdxTable.#selectedRow) {
            clearCells(allCells)
            const cells = WdxTable.#selectedRow.cells
            if (!cells.length) return true
            const first = cells[0]
            const last = cells[cells.length - 1]

            first.style.borderTopLeftRadius = radiusPx
            first.style.borderBottomLeftRadius = radiusPx
            last.style.borderTopRightRadius = radiusPx
            last.style.borderBottomRightRadius = radiusPx
            if (first === last) first.style.borderRadius = radiusPx
            return true
        }

        if (WdxTable.#selectedCol) {
            clearCells(allCells)
            const { index } = WdxTable.#selectedCol
            const top = table.rows[0]?.cells[index] ?? null
            const bottom = table.rows[table.rows.length - 1]?.cells[index] ?? null

            if (top) {
                top.style.borderTopLeftRadius = radiusPx
                top.style.borderTopRightRadius = radiusPx
            }
            if (bottom) {
                bottom.style.borderBottomLeftRadius = radiusPx
                bottom.style.borderBottomRightRadius = radiusPx
            }
            if (top && bottom && top === bottom) top.style.borderRadius = radiusPx
            return true
        }

        if (WdxTable.activeCell) {
            WdxTable.activeCell.style.borderRadius = radiusPx
            return true
        }

        // table
        clearCells(allCells)
        table.style.borderRadius = radiusPx
        table.style.overflow = (radiusPx === "0px" || radiusPx === "" ? "" : "hidden")

        // “cantos perfeitos” com bordas internas
        const rows = table.rows.length
        const cols = table.rows[0]?.cells.length ?? 0
        if (!rows || !cols) return true

        const tl = table.rows[0].cells[0]
        const tr = table.rows[0].cells[cols - 1]
        const bl = table.rows[rows - 1].cells[0]
        const br = table.rows[rows - 1].cells[cols - 1]

        if (tl) tl.style.borderTopLeftRadius = radiusPx
        if (tr) tr.style.borderTopRightRadius = radiusPx
        if (bl) bl.style.borderBottomLeftRadius = radiusPx
        if (br) br.style.borderBottomRightRadius = radiusPx

        WdxTable.#renderSelection(table, true)
        return true
    }

    // =========================================================
    // Internals: selection visuals (outline => não briga com border/radius)
    // =========================================================

    static #renderSelection(table, selected) {
        if (selected) {
            table.style.outline = `${WdxTable.#SEL_W}px solid ${WdxTable.#SEL_COLOR}`
            table.style.outlineOffset = "2px"
        } else {
            table.style.outline = ""
            table.style.outlineOffset = ""
        }
    }

    // =========================================================
    // Internals: focus
    // =========================================================

    static #focusTable(table) {
        WdxTable.#clearTable()
        WdxTable.selectedTable = table
        table.classList.add("table-selected")
        WdxTable.#renderSelection(table, true)

        // ao selecionar table/row/col, célula deve ser explicitamente clicada
        // então limpamos a célula ativa aqui
        // (se você preferir manter célula no clique comum, ok — aqui é chamado em ambos,
        // então o clique comum vai recolocar via #focusCell)
    }

    static #focusCell(cell) {
        WdxTable.#clearCell()
        WdxTable.activeCell = cell
        cell.classList.add("cell-active")
    }

    static #clearCell() {
        if (WdxTable.activeCell) WdxTable.activeCell.classList.remove("cell-active")
        WdxTable.activeCell = null
    }

    static #clearTable() {
        if (WdxTable.selectedTable) {
            const t = WdxTable.selectedTable
            t.classList.remove("table-selected")
            WdxTable.#renderSelection(t, false)
        }
        WdxTable.selectedTable = null
    }

    static #clearRowCol() {
        if (WdxTable.#selectedRow) {
            WdxTable.#selectedRow.classList.remove("row-selected")
            WdxTable.#selectedRow = null
        }

        if (WdxTable.#selectedCol) {
            const { table, index } = WdxTable.#selectedCol
            for (const tr of table.rows) {
                const td = tr.cells[index]
                if (td) td.classList.remove("col-selected")
            }
            WdxTable.#selectedCol = null
        }
    }

    static #clearAll() {
        WdxTable.#clearCell()
        WdxTable.#clearRowCol()
        WdxTable.#clearTable()
        WdxTable.#cycleMode = 0
    }

    static #placeCaretInCell(cell) {
        if (!cell.firstChild) cell.appendChild(document.createElement("br"))
        const r = document.createRange()
        r.selectNodeContents(cell)
        r.collapse(true)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(r)
    }

    static #selectRowFromCell(cell) {
        WdxTable.#clearRowCol()
        const tr = cell.parentElement
        if (tr instanceof HTMLTableRowElement) {
            tr.classList.add("row-selected")
            WdxTable.#selectedRow = tr
        }
    }

    static #selectColFromCell(cell) {
        WdxTable.#clearRowCol()
        const table = cell.closest("table")
        if (!(table instanceof HTMLTableElement)) return

        const idx = cell.cellIndex
        for (const r of table.rows) {
            const td = r.cells[idx]
            if (td) td.classList.add("col-selected")
        }
        WdxTable.#selectedCol = { table, index: idx }
    }

  // =========================================================
  // ActAlignment (wrap / center)
  // =========================================================
  static alignLeft(table = null) {
    const t = table ?? WdxTable.selectedTable
    if (!t) return
    ActLayout.alignObject(t, "left")
    WdxTable.#renderSelection(t, true)
  }

  static alignRight(table = null) {
    const t = table ?? WdxTable.selectedTable
    if (!t) return
    ActLayout.alignObject(t, "right")
    WdxTable.#renderSelection(t, true)
  }

  static alignCenter(table = null) {
    const t = table ?? WdxTable.selectedTable
    if (!t) return
    ActLayout.alignObject(t, "center")
    WdxTable.#renderSelection(t, true)
  }

}