"use strict"

import wxMovement from "./wxMovement.mjs"
import wxRange from "./wxRange.mjs"
import wxLayout from "./wxLayout.mjs"
import wxAlignment from "./wxAlignment.mjs"

export default class wxImage {
    static #selectedImage = null
    static #SEL_W = 2
    static #SELECTED_COLOR = "#0aec0a"
    
    static attach(scope) {
        scope.addEventListener("mousedown", (e) => {
            const t = e.target
            if (t instanceof HTMLImageElement)
                wxImage.#focus(t)
            else
                wxImage.#clearFocus()
        })
    }

    static hasFocus() {
        return !!wxImage.#selectedImage
    }

    static getFocused() { return wxImage.#selectedImage }

    static applyBorder(borderWidthPx, color) {
        const img = wxImage.#selectedImage
        if (!img) return false
        img.style.borderStyle = borderWidthPx === "0px" ? "none" : "solid"
        img.style.borderWidth = borderWidthPx
        img.style.borderColor = color
        return true
    }

    static applyBorderRadius(radiusPx) {
        const img = wxImage.#selectedImage
        if (!img) return false
        img.style.borderRadius = radiusPx
        return true
    }

    static align(dir) {
        const img = wxImage.#selectedImage
        if (!img) return false
        wxAlignment.wrapAlign(img, dir)
        return true
    }

    static moveUp(img) {
        if (!img) return
        wxMovement.moveParagraphUp(img)
    }

    static moveDown(img) {
        if (!img) return
        wxMovement.moveParagraphDown(img)
    }

    static async createFromFile(file) {
        if (!file) return
        const src = await wxImage.#fileToDataUrl(file)
        wxRange.restoreRange(wxRange.range)
        wxImage.insertAtSelection(src)
    }

    static async createFromUrl(url) {
        if (!url) return
        wxRange.restoreRange(wxRange.range)

        if (url.startsWith("data:")) {
            wxImage.insertAtSelection(url)
            return
        }

        const dataUrl = await wxImage.#urlToDataUrl(url)
        wxImage.insertAtSelection(dataUrl)
    }

    static async insertImageFromFile(file) {
        await wxImage.createFromFile(file)
    }    

    static insertAtSelection(src) {
        const r = wxRange.getSelRange?.() ?? wxRange.range
        if (!r) return

        const img = document.createElement("img")
        img.src = src
        img.style.width = "300px"
        img.style.height = "auto"
        img.style.maxWidth = "100%"
        img.style.verticalAlign = "baseline"
        img.style.margin = "4px 0 6px 0"

        r.deleteContents()
        r.insertNode(img)
        r.setStartAfter(img)
        r.collapse(true)

        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(r)
        wxRange.saveSelection()

        wxImage.#focus(img)
    }

    static #focus(img) {
        wxImage.#clearFocus()
        wxImage.#selectedImage = img
        img.classList.add("img-selected")

        // seleção verde padrão
        img.style.boxShadow = `inset 0 0 0 ${wxImage.#SEL_W}px ${wxImage.#SELECTED_COLOR}`
    }

    static #clearFocus() {
        if (wxImage.#selectedImage) {
            wxImage.#selectedImage.classList.remove("img-selected")
            wxImage.#selectedImage.style.boxShadow = ""
        }
        wxImage.#selectedImage = null
    }

    static #fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader()
            r.onload = () => resolve(String(r.result))
            r.onerror = () => reject(r.error)
            r.readAsDataURL(file)
        })
    }
    
    static async #urlToDataUrl(url) {
        const res = await fetch(url)
        if (!res.ok) throw new Error("Falha ao baixar imagem: " + res.status)
        const blob = await res.blob()

        return await new Promise((resolve, reject) => {
            const r = new FileReader()
            r.onload = () => resolve(String(r.result))
            r.onerror = () => reject(r.error)
            r.readAsDataURL(blob)
        })
    }
    // garante que wxPage.left()/right() não quebra
    static moveLeftWord(instance) { return wxMovement.leftWord(instance) }
    static moveRightWord(instance) { return wxMovement.rightWord(instance) }
    static moveParagraphUp(instance) { return wxMovement.upParagraph(instance) }
    static moveParagraphDown(instance) { return wxMovement.downParagraph(instance) }

    // alinha com wrap (left/right) ou inline (center)

    static alignLeft(instance) { return wxLayout.alignObject(instance, "left") }
    static alignRight(instance) { return wxLayout.alignObject(instance, "right") }
    static alignCenter(instance) { return wxLayout.alignObject(instance, "center") }

    // resize unificado
    static increase(instance) { return wxLayout.increase(instance) }
    static decrease(instance) { return wxLayout.decrease(instance) }
}