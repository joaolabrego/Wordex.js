"use strict"

import wxSection from "./wxSection.mjs"
import wxRange from "./wxRange.mjs"

/**
 * wxTableCell
 * - mantém célula ativa
 * - (opcional) seleção múltipla de células (Alt+Click = toggle)
 * - aplica operações diretamente no TD/TH (sem execCommand)
 *
 * Obs: por enquanto não lida com rowspan/colspan como “grade lógica”.
 */
export default class wxTableCell {
    static #activeCell = null
    static #selectedCells = new Set()

    /**
     * Conecta foco/seleção de célula ao container do editor.
     * Convenção provisória:
     * - Click em célula => ativa (e limpa seleção múltipla)
     * - Alt+Click => toggle seleção múltipla (mantém ativa também)
     *
     */
    static attach(scope) {
        scope.addEventListener("mousedown", (e) => {
            const t = /** @type {HTMLElement} */ (e.target)
            const cell = t.closest("td, th")
            if (!(cell instanceof HTMLTableCellElement)) {
                wxTableCell.#clearActive()
                return
            }

            wxTableCell.#setActive(cell)

            if (e.altKey) {
                wxTableCell.toggleSelect(cell)
                e.preventDefault()
            } else {
                // click normal: se tinha seleção múltipla, zera
                if (wxTableCell.#selectedCells.size) wxTableCell.clearSelection()
            }
        })
    }

    // -----------------------------
    // estado
    // -----------------------------
    static hasActive() {
        return !!wxTableCell.#activeCell
    }

    static getActive() {
        return wxTableCell.#activeCell
    }

    static hasSelection() {
        return wxTableCell.#selectedCells.size > 0
    }

    static getSelected() {
        return Array.from(wxTableCell.#selectedCells)
    }

    static clearSelection() {
        for (const c of wxTableCell.#selectedCells) c.classList.remove("cell-selected")
        wxTableCell.#selectedCells.clear()
    }

    static toggleSelect(cell) {
        if (wxTableCell.#selectedCells.has(cell)) {
            wxTableCell.#selectedCells.delete(cell)
            cell.classList.remove("cell-selected")
            return false
        }
        wxTableCell.#selectedCells.add(cell)
        cell.classList.add("cell-selected")
        return true
    }

    // -----------------------------
    // operações típicas
    // -----------------------------
    /**
     * Alinha conteúdo da célula (horizontal).
     * cmd: "left" | "center" | "right" | "justify"
     */
    static align(cmd, cell = null) {
        cell = cell ?? wxTableCell.#activeCell
        if (!cell) return false

        const val =
            cmd === "left" ? "left" :
                cmd === "center" ? "center" :
                    cmd === "right" ? "right" :
                        "justify"

        // aplica na ativa e/ou nas selecionadas (se existirem)
        if (wxTableCell.#selectedCells.size) {
            for (const c of wxTableCell.#selectedCells) c.style.textAlign = val
            return true
        }

        cell.style.textAlign = val
        return true
    }

    static applyBorder(widthPx, color, cell = null) {
        cell = cell ?? wxTableCell.#activeCell
        if (!cell) return false

        const style = widthPx === "0px" ? "none" : "solid"

        if (wxTableCell.#selectedCells.size) {
            for (const c of wxTableCell.#selectedCells) {
                c.style.borderStyle = style
                c.style.borderWidth = widthPx
                c.style.borderColor = color
            }
            return true
        }

        cell.style.borderStyle = style
        cell.style.borderWidth = widthPx
        cell.style.borderColor = color
        return true
    }

    static applyBorderRadius(radiusPx, cell = null) {
        cell = cell ?? wxTableCell.#activeCell
        if (!cell) return false

        if (wxTableCell.#selectedCells.size) {
            for (const c of wxTableCell.#selectedCells) c.style.borderRadius = radiusPx
            return true
        }

        cell.style.borderRadius = radiusPx
        return true
    }

    static setTextColor(hex, cell = null) {
        cell = cell ?? wxTableCell.#activeCell
        if (!cell || !hex) return false

        if (wxTableCell.#selectedCells.size) {
            for (const c of wxTableCell.#selectedCells) c.style.color = hex
            return true
        }

        cell.style.color = hex
        return true
    }

    static setFontFamily(name, cell = null) {
        cell = cell ?? wxTableCell.#activeCell
        if (!cell || !name) return false

        if (wxTableCell.#selectedCells.size) {
            for (const c of wxTableCell.#selectedCells) c.style.fontFamily = name
            return true
        }

        cell.style.fontFamily = name
        return true
    }

    static setFontSize(sizeCss, cell = null) {
        cell = cell ?? wxTableCell.#activeCell
        if (!cell || !sizeCss) return false

        if (wxTableCell.#selectedCells.size) {
            for (const c of wxTableCell.#selectedCells) c.style.fontSize = sizeCss
            return true
        }

        cell.style.fontSize = sizeCss
        return true
    }

    // -----------------------------
    // internos (foco/caret)
    // -----------------------------
    static #setActive(cell) {
        if (wxTableCell.#activeCell === cell) return

        if (wxTableCell.#activeCell) wxTableCell.#activeCell.classList.remove("cell-active")
        wxTableCell.#activeCell = cell
        cell.classList.add("cell-active")

        // garante lugar pro caret
        if (!cell.firstChild) cell.appendChild(document.createElement("br"))

        // joga o caret pra dentro (coerente com seu modelo wxRange.range)
        wxSection.getRoot()?.focus({ preventScroll: true })
        const r = document.createRange()
        r.selectNodeContents(cell)
        r.collapse(true)

        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(r)

        wxRange.saveSelection()
    }

    static #clearActive() {
        if (wxTableCell.#activeCell) wxTableCell.#activeCell.classList.remove("cell-active")
        wxTableCell.#activeCell = null
    }
}
