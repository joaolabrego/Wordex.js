"use strict"

import WdxSection from "./WdxSection.mjs"
import SysRange from "./SysRange.mjs"
import wxGrid from "./WdxTable.mjs"

/**
 * WdxTableCol
 * - mantém “coluna ativa” e “colunas selecionadas”
 * - seleção provisória: Alt+Click numa célula => toggle da coluna daquela célula
 * - aplica operações na coluna iterando linhas e pegando cellIndex
 *
 * Observação: não trata colspan/rowspan (por enquanto).
 */
export default class WdxTableCol {
    static #active = null
    static #selected = new WeakMap()

    /**
     * Conecta foco/seleção de coluna ao container do editor.
     */
    static attach(scope) {
        scope.addEventListener("mousedown", (e) => {
            const t =  (e.target)
            const cell = t.closest("td, th")
            if (!(cell instanceof HTMLTableCellElement)) return

            const table = cell.closest("table")
            if (!(table instanceof HTMLTableElement)) return

            const idx = cell.cellIndex
            if (idx < 0) return

            WdxTableCol.#setActive(table, idx)

            if (e.altKey) {
                WdxTableCol.toggleSelect(table, idx)
                e.preventDefault()
            }
        })
    }

    static hasActive() {
        return !!WdxTableCol.#active
    }

    static getActive() {
        return WdxTableCol.#active
    }

    /**
     * Se existir célula ativa (wxGrid), retorna a coluna dela.
     */
    static getFromActiveCell() {
        const cell = wxGrid.getActiveCell?.()
        if (!cell) return null
        const table = cell.closest("table")
        if (!(table instanceof HTMLTableElement)) return null
        const idx = cell.cellIndex
        if (idx < 0) return null
        return { table, index: idx }
    }

    static getSelected(table) {
        return Array.from(WdxTableCol.#selected.get(table) ?? [])
    }

    static hasSelection(table) {
        return (WdxTableCol.#selected.get(table)?.size ?? 0) > 0
    }

    static clearSelection(table) {
        const set = WdxTableCol.#selected.get(table)
        if (!set) return
        for (const idx of set) WdxTableCol.#applyClassToColumn(table, idx, "col-selected", false)
        set.clear()
    }

    /**
     * Toggle seleção de coluna
     */
    static toggleSelect(table, idx) {
        let set = WdxTableCol.#selected.get(table)
        if (!set) {
            set = new Set()
            WdxTableCol.#selected.set(table, set)
        }

        if (set.has(idx)) {
            set.delete(idx)
            WdxTableCol.#applyClassToColumn(table, idx, "col-selected", false)
            return false
        }

        set.add(idx)
        WdxTableCol.#applyClassToColumn(table, idx, "col-selected", true)
        return true
    }

    /**
     * Alinhamento horizontal na coluna inteira (todas as células daquela coluna).
     * cmd: "left" | "center" | "right" | "justify"
     */
    static align(cmd, col = null) {
        col = col ?? WdxTableCol.#active
        if (!col) return false

        const val =
            cmd === "left" ? "left" :
                cmd === "center" ? "center" :
                    cmd === "right" ? "right" :
                        "justify"

        for (const cell of WdxTableCol.#iterColumnCells(col.table, col.index)) {
            cell.style.textAlign = val
        }
        return true
    }

    /**
     * Aplica border nas células da coluna.
     */
    static applyBorder(widthPx, color, col = null) {
        col = col ?? WdxTableCol.#active
        if (!col) return false

        const style = widthPx === "0px" ? "none" : "solid"
        for (const cell of WdxTableCol.#iterColumnCells(col.table, col.index)) {
            cell.style.borderStyle = style
            cell.style.borderWidth = widthPx
            cell.style.borderColor = color
        }
        return true
    }

    // -----------------------------
    // internos
    // -----------------------------

    static #setActive(table, idx) {
        const prev = WdxTableCol.#active
        if (prev && prev.table === table && prev.index === idx) return

        if (prev) WdxTableCol.#applyClassToColumn(prev.table, prev.index, "col-active", false)

        WdxTableCol.#active = { table, index: idx }
        WdxTableCol.#applyClassToColumn(table, idx, "col-active", true)

        // Opcional: ao ativar coluna, joga caret na 1ª célula “existente”
        const firstCell = WdxTableCol.#findFirstCellInColumn(table, idx)
        if (firstCell) {
            WdxSection.getRoot()?.focus({ preventScroll: true })
            const r = document.createRange()
            r.selectNodeContents(firstCell)
            r.collapse(true)
            const sel = window.getSelection()
            sel?.removeAllRanges()
            sel?.addRange(r)
            SysRange.saveSelection()
        }
    }

    static *#iterColumnCells(table, idx) {
        const rows = table.rows
        for (let r = 0; r < rows.length; r++) {
            const row = rows[r]
            const cell = row.cells[idx]
            if (cell) yield cell
        }
    }

    static #findFirstCellInColumn(table, idx) {
        for (const cell of WdxTableCol.#iterColumnCells(table, idx)) return cell
        return null
    }

    static #applyClassToColumn(table, idx, className, on) {
        for (const cell of WdxTableCol.#iterColumnCells(table, idx)) {
            if (on) cell.classList.add(className)
            else cell.classList.remove(className)
        }
    }
}
