"use strict"

import WdxSection from "./WdxSection.mjs"
import SysRange from "./SysRange.mjs"
import wxGrid from "./WdxTable.mjs"

/**
 * WdxTableRow
 * - mantém estado de “linha ativa” e “linhas selecionadas”
 * - não decide política (wxPage decidirá depois)
 * - opera em HTMLTableRowElement (TR)
 */
export default class WdxTableRow {
    static #activeRow = null
    static #selectedRows = new Set()

    /**
     * Conecta foco/seleção de linha ao container do editor.
     * Convenção provisória (simples):
     * - Alt+Click numa célula => seleciona a linha inteira (toggle)
     * - Click normal numa célula => apenas ativa a linha (sem seleção)
     */
    static attach(scope) {
        scope.addEventListener("mousedown", (e) => {
            const t = /** @type {HTMLElement} */ (e.target)
            const cell = t.closest("td, th")
            if (!(cell instanceof HTMLTableCellElement)) return

            const tr = cell.closest("tr")
            if (!(tr instanceof HTMLTableRowElement)) return

            // mantém o foco de célula do wxGrid (se você já estiver usando)
            // (não é obrigatório, mas ajuda a coerência)
            // wxGrid já faz isso no attach dele, mas não atrapalha:
            // (deixe comentado se preferir)
            // if (wxGrid.getActiveCell?.()) {}

            WdxTableRow.#setActive(tr)

            if (e.altKey) {
                // toggle seleção de linha
                WdxTableRow.toggleSelect(tr)
                e.preventDefault()
            }
        })
    }

    static hasActive() {
        return !!WdxTableRow.#activeRow
    }

    static getActive() {
        return WdxTableRow.#activeRow
    }

    static getSelected() {
        return Array.from(WdxTableRow.#selectedRows)
    }

    static hasSelection() {
        return WdxTableRow.#selectedRows.size > 0
    }

    static clearSelection() {
        for (const tr of WdxTableRow.#selectedRows) tr.classList.remove("row-selected")
        WdxTableRow.#selectedRows.clear()
    }

    /**
     * Seleciona (ou desmarca) uma linha.
     */
    static toggleSelect(tr) {
        if (WdxTableRow.#selectedRows.has(tr)) {
            WdxTableRow.#selectedRows.delete(tr)
            tr.classList.remove("row-selected")
            return false
        }
        WdxTableRow.#selectedRows.add(tr)
        tr.classList.add("row-selected")
        return true
    }

    /**
     * Se existir célula ativa (wxGrid), retorna a linha dela.
     */
    static getFromActiveCell() {
        const cell = wxGrid.getActiveCell?.()
        if (!cell) return null
        const tr = cell.closest("tr")
        return tr instanceof HTMLTableRowElement ? tr : null
    }

    /**
     * Aplica alinhamento horizontal à linha inteira (todas as células).
     * cmd: "left" | "center" | "right" | "justify"
     */
    static align(cmd, tr = null) {
        tr = tr ?? WdxTableRow.#activeRow
        if (!tr) return false

        const val =
            cmd === "left" ? "left" :
                cmd === "center" ? "center" :
                    cmd === "right" ? "right" :
                        "justify"

        for (const cell of tr.cells) {
            cell.style.textAlign = val
        }
        return true
    }

    /**
     * Aplica border nas células da linha.
     */
    static applyBorder(widthPx, color, tr = null) {
        tr = tr ?? WdxTableRow.#activeRow
        if (!tr) return false

        const style = widthPx === "0px" ? "none" : "solid"
        for (const cell of tr.cells) {
            cell.style.borderStyle = style
            cell.style.borderWidth = widthPx
            cell.style.borderColor = color
        }
        return true
    }

    /**
     * Ativa uma linha e sincroniza caret com SysRange.range (na 1ª célula, se possível).
     */
    static #setActive(tr) {
        if (WdxTableRow.#activeRow === tr) return

        if (WdxTableRow.#activeRow) WdxTableRow.#activeRow.classList.remove("row-active")
        WdxTableRow.#activeRow = tr
        tr.classList.add("row-active")

        // Opcional: se você quiser que ativar linha mova caret para 1ª célula
        const cell = tr.cells?.[0]
        if (cell) {
            // garante que o range fique dentro do escopo atual
            WdxSection.getRoot()?.focus({ preventScroll: true })

            const r = document.createRange()
            r.selectNodeContents(cell)
            r.collapse(true)

            const sel = window.getSelection()
            sel?.removeAllRanges()
            sel?.addRange(r)
            SysRange.saveSelection()
        }
    }
}
