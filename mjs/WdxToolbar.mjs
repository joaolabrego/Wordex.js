"use strict"

import Config from "./Config.mjs"
import wxPage from "./WdxDocument.mjs"
import SysRange from "./SysRange.mjs"
import wxPicture from "./WdxImage.mjs"
import WdxSection from "./WdxSection.mjs"
import ActAlignment from "./ActAlignment.mjs"

/** @typedef {import("./wdxTypes.mjs").wdxItem} wdxItem */

export default class WdxToolbar {
    #toolbar
    #selectFontStyles
    #selectAlignments
    #selectFontFamily
    #selectFontSize
    #selectPaperFormats
    #selectOrientations
    #selectBorders
    #selectBorderRadius
    #buttonEditMode
    #inputFile
    #template
    #selectedColor = Config.K_DEFAULT_COLOR

    constructor(template) {
        this.#template = template
        this.#toolbar = document.createElement("div")

        const style = document.createElement("style")
        style.textContent = Config.ScriptToolbar
        this.#toolbar.appendChild(style)

        this.#toolbar.classList.add("toolbar")

        // família da fonte
        this.#toolbar.appendChild(this.#selectFontFamily = this.#createSelect(Config.fontFamilyList,"Selecionar família da fonte", () => this.#setFontFamily()))
        // tamanho -> wxPage decide (seleção ou fallback)
        this.#toolbar.appendChild(this.#selectFontSize = this.#createSelect(Config.fontSizeList, "Selecionar tamanho da fonte", () => this.#setFontSize()))
        // cor -> wxPage decide
        this.#toolbar.appendChild(this.#createInputColor())
        // estilos (b/i/u etc) — por enquanto via execCommand/Config
        this.#toolbar.appendChild(this.#selectFontStyles = this.#createSelect(Config.fontStyleList, "Estilizar texto/parágrafo selecionado", () => this.#setFontStyle()))
        // orientação / formato (mexem na largura da página)
        this.#toolbar.appendChild(this.#selectOrientations = this.#createSelect(Config.pageOrientationList, "Selecionar orientação da página", () => this.#setOrientation()))
        this.#toolbar.appendChild(this.#selectPaperFormats = this.#createSelect(Config.paperFormatList, "Selecionar formato da folha", () => this.#setPaperFormat()))
        // alinhamento -> wxPage decide alvo
        this.#toolbar.appendChild(this.#selectAlignments = this.#createSelect(Config.alignmentList, "Selecionar alinhamento", () => this.#setAlignment()))
        // inserir imagem
        this.#toolbar.appendChild(this.#inputFile = this.#createInputFile())
        this.#toolbar.appendChild(this.#createButton("🖼️⬆", "Inserir imagem", () => this.#inputFile.click()))
        // resize / move genéricos -> wxPage decide alvo
        this.#toolbar.appendChild(this.#createButton("+", "Aumentar", () => wxPage.increase()))
        this.#toolbar.appendChild(this.#createButton("-", "Diminuir", () => wxPage.decrease()))
        this.#toolbar.appendChild(this.#createButton("▦+", "Inserir tabela", async () => this.#createTable()))
        this.#toolbar.appendChild(this.#createButton("⬅", "Mover esquerda", () => wxPage.left()))
        this.#toolbar.appendChild(this.#createButton("➡", "Mover direita", () => wxPage.right()))
        this.#toolbar.appendChild(this.#createButton("⬆", "Mover cima", () => wxPage.up()))
        this.#toolbar.appendChild(this.#createButton("⬇", "Mover baixo", () => wxPage.down()))
        // borda -> wxPage decide alvo (e recebe cor)
        this.#toolbar.appendChild(this.#selectBorders = this.#createSelect(Config.borderList, "Selecionar borda", () => this.#setBorder()))
        // radius -> wxPage decide alvo
        this.#toolbar.appendChild(this.#selectBorderRadius = this.#createSelect(Config.borderRadiusList, "Selecionar raio da borda", () => this.#setBorderRadius()))
        // toggle insert/overwrite mode
        this.#toolbar.appendChild(this.#buttonEditMode = this.#createButton(Config.K_INSERT_MODE, "Modo inserção/sobrescrita", () => this.#toggleEditMode()))
        this.#initializeDefaults()
    }

    get owner() {
        return this.#template
    }

    get element() {
        return this.#toolbar
    }

    /** aplica os defaults marcados no Config (selected:true) */
    #initializeDefaults() {
        const dispatchSelected = (list, select) => {
            const i = list.findIndex((item) => !!item.selected)
            if (i !== -1) {
                select.selectedIndex = i
                select.dispatchEvent(new Event("change", { bubbles: true }))
            }
        }
        dispatchSelected(Config.fontStyleList, this.#selectFontStyles)
        dispatchSelected(Config.alignmentList, this.#selectAlignments)
        dispatchSelected(Config.fontFamilyList, this.#selectFontFamily)
        dispatchSelected(Config.fontSizeList, this.#selectFontSize)
        dispatchSelected(Config.paperFormatList, this.#selectPaperFormats)
        dispatchSelected(Config.pageOrientationList, this.#selectOrientations)
        dispatchSelected(Config.borderList, this.#selectBorders)
        dispatchSelected(Config.borderRadiusList, this.#selectBorderRadius)
        this.editMode = Config.K_INSERT_MODE
    }

    #setFontStyle() {
        const value = this.#getHTMLSelectElementValue(this.#selectFontStyles)
        if (!value)
            return
        if (value === "none") {
            SysRange.clearInlineFormatting()
            return true
        }
        SysRange.restoreRange(SysRange.range)

        // 1) Se há seleção de texto → WordexText manda
        if (SysRange.hasSelection()) {
            SysRange.applyFontStyle(value)
            return
        }
    }

    #setFontFamily() {
        const value = this.#getHTMLSelectElementValue(this.#selectFontFamily)
        if (!value)
            return false
        SysRange.restoreRange(SysRange.range)

        const selection = window.getSelection()
        if (!!selection && selection.rangeCount && !selection.getRangeAt(0).collapsed)
            return SysRange.setFontFamily(value)

        const paragraph = wxPage.getParagraphTarget()
        if (paragraph) {
            paragraph.style.fontFamily = value
            return true
        }

        const section = WdxSection.getRoot()
        if (section) {
            section.style.fontFamily = value
            return true
        }

        return false
    }

    #setFontSize() {
        const value = this.#getHTMLSelectElementValue(this.#selectFontSize)
        if (!value)
            return false
        const size = Config.fontSizeList.find((p) => p.value === value)
        if (!size)
            return false

        SysRange.restoreRange(SysRange.range)

        const selection = window.getSelection()
        const hasSelection = !!selection && selection.rangeCount && !selection.getRangeAt(0).collapsed

        if (hasSelection)
            return !!SysRange.setFontSize(value)

        const paragraph = wxPage.getParagraphTarget()
        if (paragraph) {
            paragraph.style.fontSize = size.value
            return true
        }
        const section = WdxSection.getRoot()
        if (section) {
            section.style.fontSize = size.value
            return true
        }

        return false
    }

    #createInputColor() {
        const inputColor = document.createElement("input")
        inputColor.type = "color"
        inputColor.value = this.#selectedColor
        inputColor.title = "Selecionar cor de texto e bordas"
        inputColor.classList.add("control")
        inputColor.addEventListener("change", () => {
            this.#selectedColor = inputColor.value
            this.#template.setColor(this.#selectedColor)
        })

        return inputColor
    }

    #createInputFile() {
        const inputFile = document.createElement("input")
        inputFile.type = "file"
        inputFile.accept = "image/*"
        inputFile.style.display = "none"
        inputFile.addEventListener("change", async () => {
            const file = this.#inputFile.files?.[0] ?? null
            await wxPicture.insertImageFromFile(file)
            this.#inputFile.value = ""
        })
        
        return inputFile
    }

    #askInteger = (msg, def, min = 1, max = 99) => {
        const s = prompt(msg, String(def))
        if (s === null)
            return null
        const n = parseInt(s.trim(), 10)
        if (!Number.isFinite(n))
            return def
        return Math.min(max, Math.max(min, n))
    }

    async #createTable() {
        const rows = this.#askInteger("Quantidade de linhas:", 3, 1, 50)
        if (rows === null)
            return
        const cols = this.#askInteger("Quantidade de colunas:", 3, 1, 20)
        if (cols === null)
            return
        await wxPage.insertTable(rows, cols)
    }

    #setOrientation() {
        const value = this.#getHTMLSelectElementValue(this.#selectOrientations)
        if (!value)
            return
        const paper = Config.paperFormatList.find((p) => p.selected)
        if (!paper)
            return
        if (value === Config.K_LANDSCAPE)
            this.#template.document.element.style.width = paper.height
        else
            this.#template.document.element.style.width = paper.width

        return true
    }

    #setPaperFormat() {
        const value = this.#getHTMLSelectElementValue(this.#selectPaperFormats)
        if (!value)
            return false

        const orient = Config.pageOrientationList.find(p => p.selected)
        if (!orient)
            return false

        const paper = Config.paperFormatList.find(p => p.value === value)
        if (!paper)
            return false
        this.#template.document.element.style.width = orient.value === Config.K_LANDSCAPE ? paper.height : paper.width
        this.#template.objects.filter(obj => obj instanceof WdxSection)
            .forEach(section => {
                section.style.minHeight = paper.minHeightEdges
                section.style.maxHeight = paper.maxHeightEdges
            })

        return true
    }

    #setAlignment() {
        const value = /** @type {"left"|"center"|"right"|"justify"} */(this.#getHTMLSelectElementValue(this.#selectAlignments))
        if (value)
            ActAlignment.align(value)
    }

    #setBorder() {
        const value = this.#getHTMLSelectElementValue(this.#selectBorders)
        wxPage.border(value, this.#selectedColor)
    }

    #setBorderRadius() {
        const value = this.#getHTMLSelectElementValue(this.#selectBorderRadius)
        wxPage.borderRadius(value)
    }
    
    #toggleEditMode() {
        this.editMode = this.isInsertMode ? Config.K_OVERWRITE_MODE : Config.K_INSERT_MODE
    }
    
    set editMode(mode) {
        this.#buttonEditMode.textContent = mode
        const color = mode === Config.K_OVERWRITE_MODE ? Config.K_OVERWRITE_COLOR : Config.K_INSERT_COLOR
        this.#buttonEditMode.style.background = color
        this.element.style.caretColor = color
    }

     #createSelect(templateList, title, eventChange = undefined) {
        const select = document.createElement("select")
        select.classList.add("control")
        select.title = title
        select.style.fontSize = "10px"
        select.style.fontWeight = "bold"

        this.#mountSelect(select, templateList)

        select.addEventListener("change", () => {
            if (eventChange)
                eventChange()
            this.#toggleSelectOption(select, templateList)
        })

        return select
    }

    #mountSelect(selectElement, selectList, value = "") {
        let bold = true
        selectElement.options.length = 0

        selectList?.forEach((item) => {
            const option = document.createElement("option")
            option.style.fontSize = "10px"
            if (bold) {
                option.style.fontWeight = "bold"
                bold = false
            }
            option.value = item.value
            option.textContent = (item.selected ? Config.K_OK : "") + item.text
            selectElement.appendChild(option)
        })
        return selectElement
    }

     #toggleSelectOption(selectElement, templateList) {
        const value = selectElement.options[selectElement.selectedIndex].value
        if (!value) return

        templateList.forEach((item) => (item.selected = item.value === value))

        this.#mountSelect(selectElement, templateList, value)
    }

    #createButton(textContent, title, functionClick) {
        const button = document.createElement("button")
        button.textContent = textContent
        button.title = title
        button.classList.add("control")
        button.addEventListener("click", functionClick)
        return button
    }

    #getHTMLSelectElementValue(select) {
        if (select.selectedIndex < 0)
            return ""

        return select.options[select.selectedIndex].value
    }
    
    get isInsertMode() {
        return this.#buttonEditMode.textContent === Config.K_INSERT_MODE
    }
    
    get isOverwriteMode() {
        return this.#buttonEditMode.textContent === Config.K_OVERWRITE_MODE
    }

    get editMode() {
        return /** @type {`${typeof Config.K_INSERT_MODE}|${typeof Config.K_OVERWRITE_MODE}`} */ (this.#buttonEditMode.textContent);
    }
}
