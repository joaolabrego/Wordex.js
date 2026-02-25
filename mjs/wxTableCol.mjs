"use strict"

import wxSection from "./wxSection.mjs"
import wxRange from "./wxRange.mjs"
import wxGrid from "./wxTable.mjs"

/**
 * wxTableCol
 * - mantém “coluna ativa” e “colunas selecionadas”
 * - seleção provisória: Alt+Click numa célula => toggle da coluna daquela célula
 * - aplica operações na coluna iterando linhas e pegando cellIndex
 *
 * Observação: não trata colspan/rowspan (por enquanto).
 */
export default class wxTableCol {
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

            wxTableCol.#setActive(table, idx)

            if (e.altKey) {
                wxTableCol.toggleSelect(table, idx)
                e.preventDefault()
            }
        })
    }

    static hasActive() {
        return !!wxTableCol.#active
    }

    static getActive() {
        return wxTableCol.#active
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
        return Array.from(wxTableCol.#selected.get(table) ?? [])
    }

    static hasSelection(table) {
        return (wxTableCol.#selected.get(table)?.size ?? 0) > 0
    }

    static clearSelection(table) {
        const set = wxTableCol.#selected.get(table)
        if (!set) return
        for (const idx of set) wxTableCol.#applyClassToColumn(table, idx, "col-selected", false)
        set.clear()
    }

    /**
     * Toggle seleção de coluna
     */
    static toggleSelect(table, idx) {
        let set = wxTableCol.#selected.get(table)
        if (!set) {
            set = new Set()
            wxTableCol.#selected.set(table, set)
        }

        if (set.has(idx)) {
            set.delete(idx)
            wxTableCol.#applyClassToColumn(table, idx, "col-selected", false)
            return false
        }

        set.add(idx)
        wxTableCol.#applyClassToColumn(table, idx, "col-selected", true)
        return true
    }

    /**
     * Alinhamento horizontal na coluna inteira (todas as células daquela coluna).
     * cmd: "left" | "center" | "right" | "justify"
     */
    static align(cmd, col = null) {
        col = col ?? wxTableCol.#active
        if (!col) return false

        const val =
            cmd === "left" ? "left" :
                cmd === "center" ? "center" :
                    cmd === "right" ? "right" :
                        "justify"

        for (const cell of wxTableCol.#iterColumnCells(col.table, col.index)) {
            cell.style.textAlign = val
        }
        return true
    }

    /**
     * Aplica border nas células da coluna.
     */
    static applyBorder(widthPx, color, col = null) {
        col = col ?? wxTableCol.#active
        if (!col) return false

        const style = widthPx === "0px" ? "none" : "solid"
        for (const cell of wxTableCol.#iterColumnCells(col.table, col.index)) {
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
        const prev = wxTableCol.#active
        if (prev && prev.table === table && prev.index === idx) return

        if (prev) wxTableCol.#applyClassToColumn(prev.table, prev.index, "col-active", false)

        wxTableCol.#active = { table, index: idx }
        wxTableCol.#applyClassToColumn(table, idx, "col-active", true)

        // Opcional: ao ativar coluna, joga caret na 1ª célula “existente”
        const firstCell = wxTableCol.#findFirstCellInColumn(table, idx)
        if (firstCell) {
            wxSection.getRoot()?.focus({ preventScroll: true })
            const r = document.createRange()
            r.selectNodeContents(firstCell)
            r.collapse(true)
            const sel = window.getSelection()
            sel?.removeAllRanges()
            sel?.addRange(r)
            wxRange.saveSelection()
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
        for (const cell of wxTableCol.#iterColumnCells(table, idx)) return cell
        return null
    }

    static #applyClassToColumn(table, idx, className, on) {
        for (const cell of wxTableCol.#iterColumnCells(table, idx)) {
            if (on) cell.classList.add(className)
            else cell.classList.remove(className)
        }
    }
}
