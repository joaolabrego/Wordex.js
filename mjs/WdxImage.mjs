"use strict"

import ActMovement from "./ActMovement.mjs"
import SysRange from "./SysRange.mjs"
import ActLayout from "./ActLayout.mjs"
import ActAlignment from "./ActAlignment.mjs"

export default class WdxImage {
    static #selectedImage = null
    static #SEL_W = 2
    static #SELECTED_COLOR = "#0aec0a"
    
    static attach(scope) {
        scope.addEventListener("mousedown", (e) => {
            const t = e.target
            if (t instanceof HTMLImageElement)
                WdxImage.#focus(t)
            else
                WdxImage.#clearFocus()
        })
    }

    static hasFocus() {
        return !!WdxImage.#selectedImage
    }

    static getFocused() { return WdxImage.#selectedImage }

    static applyBorder(borderWidthPx, color) {
        const img = WdxImage.#selectedImage
        if (!img) return false
        img.style.borderStyle = borderWidthPx === "0px" ? "none" : "solid"
        img.style.borderWidth = borderWidthPx
        img.style.borderColor = color
        return true
    }

    static applyBorderRadius(radiusPx) {
        const img = WdxImage.#selectedImage
        if (!img) return false
        img.style.borderRadius = radiusPx
        return true
    }

    static align(dir) {
        const img = WdxImage.#selectedImage
        if (!img) return false
        ActAlignment.wrapAlign(img, dir)
        return true
    }

    static moveUp(img) {
        if (!img) return
        ActMovement.moveParagraphUp(img)
    }

    static moveDown(img) {
        if (!img) return
        ActMovement.moveParagraphDown(img)
    }

    static async createFromFile(file) {
        if (!file) return
        const src = await WdxImage.#fileToDataUrl(file)
        SysRange.restoreRange(SysRange.range)
        WdxImage.insertAtSelection(src)
    }

    static async createFromUrl(url) {
        if (!url) return
        SysRange.restoreRange(SysRange.range)

        if (url.startsWith("data:")) {
            WdxImage.insertAtSelection(url)
            return
        }

        const dataUrl = await WdxImage.#urlToDataUrl(url)
        WdxImage.insertAtSelection(dataUrl)
    }

    static async insertImageFromFile(file) {
        await WdxImage.createFromFile(file)
    }    

    static insertAtSelection(src) {
        const r = SysRange.getSelRange?.() ?? SysRange.range
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
        SysRange.saveSelection()

        WdxImage.#focus(img)
    }

    static #focus(img) {
        WdxImage.#clearFocus()
        WdxImage.#selectedImage = img
        img.classList.add("img-selected")

        // seleção verde padrão
        img.style.boxShadow = `inset 0 0 0 ${WdxImage.#SEL_W}px ${WdxImage.#SELECTED_COLOR}`
    }

    static #clearFocus() {
        if (WdxImage.#selectedImage) {
            WdxImage.#selectedImage.classList.remove("img-selected")
            WdxImage.#selectedImage.style.boxShadow = ""
        }
        WdxImage.#selectedImage = null
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
    static moveLeftWord(instance) { return ActMovement.leftWord(instance) }
    static moveRightWord(instance) { return ActMovement.rightWord(instance) }
    static moveParagraphUp(instance) { return ActMovement.upParagraph(instance) }
    static moveParagraphDown(instance) { return ActMovement.downParagraph(instance) }

    // alinha com wrap (left/right) ou inline (center)

    static alignLeft(instance) { return ActLayout.alignObject(instance, "left") }
    static alignRight(instance) { return ActLayout.alignObject(instance, "right") }
    static alignCenter(instance) { return ActLayout.alignObject(instance, "center") }

    // resize unificado
    static increase(instance) { return ActLayout.increase(instance) }
    static decrease(instance) { return ActLayout.decrease(instance) }
}