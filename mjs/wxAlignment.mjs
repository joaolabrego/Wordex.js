"use strict"

import wxPicture from "./wxImage.mjs"
import wxPage from "./wxPage.mjs"
import wxRange from "./wxRange.mjs"
import wxSection from "./wxSection.mjs"
import wxGrid from "./wxTable.mjs"

export default class wxAlignment {

    /** @param {"left"|"center"|"right"|"justify"} dir */
    static align(dir) {
        const target = wxPage.selectedTarget()

        // 1) imagem: usa alvo focado
        if (target.kind === "image") {
            wxPicture.align(dir)
            return true
        }

        // 2) tabela (célula/linha/col/tabela inteira)
        if (target.kind === "cell" || target.kind === "row" || target.kind === "col" || target.kind === "table") {
            if (dir === "left")
                wxGrid.alignLeft()
            else if (dir === "right")
                wxGrid.alignRight()
            else
                wxGrid.alignCenter()

            return true
        }

        // 3) parágrafo/texto: execCommand
        if (dir === "left")
            wxRange.alignLeft()
        else if (dir === "right")
            wxRange.alignRight()
        else if (dir === "center")
            wxRange.alignCenter()
        else
            wxRange.justify()
        
        return true
    }


    /**
     * Alinha elemento "flutuável": left/right => wrap (float), center => centralizado (block).
     * @param {HTMLElement} el
     * @param {"left"|"center"|"right"|"justify"} dir
     */
    static wrapAlign(el, dir) {
        // limpa estado anterior
        el.style.float = ""
        el.style.clear = ""
        el.style.display = ""
        el.style.marginLeft = ""
        el.style.marginRight = ""
        el.style.marginTop = ""
        el.style.marginBottom = ""

        // evita “espaço” artificial ao inserir no meio: margem lateral default = 0
        // e só adiciona margem quando float (pra dar respiro do texto)
        if (dir === "left") {
            el.style.float = "left"
            el.style.display = "table"
            el.style.margin = "4px 10px 6px 0"
            return
        }

        if (dir === "right") {
            el.style.float = "right"
            el.style.display = "table"
            el.style.margin = "4px 0 6px 10px"
            return
        }

        // center
        el.style.float = "none"
        el.style.display = "table"
        el.style.margin = "6px auto"
        el.style.clear = "both"
    }
    static paragraphBox(p, dir, alignTextAlso = true) {
        // caixa: só faz sentido para left/center/right
        if (dir === "left") {
            p.style.marginLeft = "0"
            p.style.marginRight = "auto"
        } else if (dir === "right") {
            p.style.marginLeft = "auto"
            p.style.marginRight = "0"
        } else if (dir === "center") {
            p.style.marginLeft = "auto"
            p.style.marginRight = "auto"
        }
        // texto
        if (alignTextAlso) {
            p.style.textAlign = (dir === "justify") ? "justify" : dir
        }
    }
}
