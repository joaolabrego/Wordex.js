"use strict"

import WdxSection from "./WdxSection.mjs"
import SysRange from "./SysRange.mjs"

/**
 * WdxTableCell
 * - mantém célula ativa
 * - (opcional) seleção múltipla de células (Alt+Click = toggle)
 * - aplica operações diretamente no TD/TH (sem execCommand)
 *
 * Obs: por enquanto não lida com rowspan/colspan como “grade lógica”.
 */
export default class WdxTableCell {
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
                WdxTableCell.#clearActive()
                return
            }

            WdxTableCell.#setActive(cell)

            if (e.altKey) {
                WdxTableCell.toggleSelect(cell)
                e.preventDefault()
            } else {
                // click normal: se tinha seleção múltipla, zera
                if (WdxTableCell.#selectedCells.size) WdxTableCell.clearSelection()
            }
        })
    }

    // -----------------------------
    // estado
    // -----------------------------
    static hasActive() {
        return !!WdxTableCell.#activeCell
    }

    static getActive() {
        return WdxTableCell.#activeCell
    }

    static hasSelection() {
        return WdxTableCell.#selectedCells.size > 0
    }

    static getSelected() {
        return Array.from(WdxTableCell.#selectedCells)
    }

    static clearSelection() {
        for (const c of WdxTableCell.#selectedCells) c.classList.remove("cell-selected")
        WdxTableCell.#selectedCells.clear()
    }

    static toggleSelect(cell) {
        if (WdxTableCell.#selectedCells.has(cell)) {
            WdxTableCell.#selectedCells.delete(cell)
            cell.classList.remove("cell-selected")
            return false
        }
        WdxTableCell.#selectedCells.add(cell)
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
        cell = cell ?? WdxTableCell.#activeCell
        if (!cell) return false

        const val =
            cmd === "left" ? "left" :
                cmd === "center" ? "center" :
                    cmd === "right" ? "right" :
                        "justify"

        // aplica na ativa e/ou nas selecionadas (se existirem)
        if (WdxTableCell.#selectedCells.size) {
            for (const c of WdxTableCell.#selectedCells) c.style.textAlign = val
            return true
        }

        cell.style.textAlign = val
        return true
    }

    static applyBorder(widthPx, color, cell = null) {
        cell = cell ?? WdxTableCell.#activeCell
        if (!cell) return false

        const style = widthPx === "0px" ? "none" : "solid"

        if (WdxTableCell.#selectedCells.size) {
            for (const c of WdxTableCell.#selectedCells) {
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
        cell = cell ?? WdxTableCell.#activeCell
        if (!cell) return false

        if (WdxTableCell.#selectedCells.size) {
            for (const c of WdxTableCell.#selectedCells) c.style.borderRadius = radiusPx
            return true
        }

        cell.style.borderRadius = radiusPx
        return true
    }

    static setTextColor(hex, cell = null) {
        cell = cell ?? WdxTableCell.#activeCell
        if (!cell || !hex) return false

        if (WdxTableCell.#selectedCells.size) {
            for (const c of WdxTableCell.#selectedCells) c.style.color = hex
            return true
        }

        cell.style.color = hex
        return true
    }

    static setFontFamily(name, cell = null) {
        cell = cell ?? WdxTableCell.#activeCell
        if (!cell || !name) return false

        if (WdxTableCell.#selectedCells.size) {
            for (const c of WdxTableCell.#selectedCells) c.style.fontFamily = name
            return true
        }

        cell.style.fontFamily = name
        return true
    }

    static setFontSize(sizeCss, cell = null) {
        cell = cell ?? WdxTableCell.#activeCell
        if (!cell || !sizeCss) return false

        if (WdxTableCell.#selectedCells.size) {
            for (const c of WdxTableCell.#selectedCells) c.style.fontSize = sizeCss
            return true
        }

        cell.style.fontSize = sizeCss
        return true
    }

    // -----------------------------
    // internos (foco/caret)
    // -----------------------------
    static #setActive(cell) {
        if (WdxTableCell.#activeCell === cell) return

        if (WdxTableCell.#activeCell) WdxTableCell.#activeCell.classList.remove("cell-active")
        WdxTableCell.#activeCell = cell
        cell.classList.add("cell-active")

        // garante lugar pro caret
        if (!cell.firstChild) cell.appendChild(document.createElement("br"))

        // joga o caret pra dentro (coerente com seu modelo SysRange.range)
        WdxSection.getRoot()?.focus({ preventScroll: true })
        const r = document.createRange()
        r.selectNodeContents(cell)
        r.collapse(true)

        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(r)

        SysRange.saveSelection()
    }

    static #clearActive() {
        if (WdxTableCell.#activeCell) WdxTableCell.#activeCell.classList.remove("cell-active")
        WdxTableCell.#activeCell = null
    }
}
