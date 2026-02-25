"use strict"

import wxSection from "./wxSection.mjs"
import wxRange from "./wxRange.mjs"
import wxGrid from "./wxTable.mjs"

/**
 * wxTableRow
 * - mantém estado de “linha ativa” e “linhas selecionadas”
 * - não decide política (wxPage decidirá depois)
 * - opera em HTMLTableRowElement (TR)
 */
export default class wxTableRow {
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

            wxTableRow.#setActive(tr)

            if (e.altKey) {
                // toggle seleção de linha
                wxTableRow.toggleSelect(tr)
                e.preventDefault()
            }
        })
    }

    static hasActive() {
        return !!wxTableRow.#activeRow
    }

    static getActive() {
        return wxTableRow.#activeRow
    }

    static getSelected() {
        return Array.from(wxTableRow.#selectedRows)
    }

    static hasSelection() {
        return wxTableRow.#selectedRows.size > 0
    }

    static clearSelection() {
        for (const tr of wxTableRow.#selectedRows) tr.classList.remove("row-selected")
        wxTableRow.#selectedRows.clear()
    }

    /**
     * Seleciona (ou desmarca) uma linha.
     */
    static toggleSelect(tr) {
        if (wxTableRow.#selectedRows.has(tr)) {
            wxTableRow.#selectedRows.delete(tr)
            tr.classList.remove("row-selected")
            return false
        }
        wxTableRow.#selectedRows.add(tr)
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
        tr = tr ?? wxTableRow.#activeRow
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
        tr = tr ?? wxTableRow.#activeRow
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
     * Ativa uma linha e sincroniza caret com wxRange.range (na 1ª célula, se possível).
     */
    static #setActive(tr) {
        if (wxTableRow.#activeRow === tr) return

        if (wxTableRow.#activeRow) wxTableRow.#activeRow.classList.remove("row-active")
        wxTableRow.#activeRow = tr
        tr.classList.add("row-active")

        // Opcional: se você quiser que ativar linha mova caret para 1ª célula
        const cell = tr.cells?.[0]
        if (cell) {
            // garante que o range fique dentro do escopo atual
            wxSection.getRoot()?.focus({ preventScroll: true })

            const r = document.createRange()
            r.selectNodeContents(cell)
            r.collapse(true)

            const sel = window.getSelection()
            sel?.removeAllRanges()
            sel?.addRange(r)
            wxRange.saveSelection()
        }
    }
}
