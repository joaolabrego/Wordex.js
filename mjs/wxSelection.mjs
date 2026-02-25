"use strict"

export default class wxSelection {
    static range = null
    static paragraph = null
    static image = null
    static table = null
    static tableRow = null
    static tableCol = null
    static tableCell = null

    static selectedList = []

    static clear() {
        wxSelection.range = null
        wxSelection.paragraph = null
        wxSelection.image = null
        wxSelection.table = null
        wxSelection.tableRow = null
        wxSelection.tableCol = null
        wxSelection.tableCell = null
        wxSelection.selectedList = []
    }

    static GetTargets() {
        wxSelection.clear()

        // 1) Contexto via Selection/Range
        const selection = window.getSelection()
        if (selection && selection.rangeCount) {
            const range = selection.getRangeAt(0)

            if (!range.collapsed)
                wxSelection.range = range.cloneRange()
        }

        // 2) Seleção estrutural via .selected (múltiplos)
        const selectedElements = Array.from(document.body.querySelectorAll(".selected"))

        for (const element of selectedElements) {
            // paragraph
            if (element instanceof HTMLDivElement && element.classList.contains("paragraph")) {
                wxSelection.paragraph = /** @type {wxParagraphType} */(element)
                wxSelection.selectedList.push({ kind: "paragraph", element })
                continue
            }

            // image
            if (element instanceof HTMLImageElement) {
                wxSelection.image = /** @type {wxImageType} */(element)
                wxSelection.selectedList.push({ kind: "image", element })
                continue
            }

            // table
            if (element instanceof HTMLTableElement) {
                wxSelection.table = /** @type {wxTableType} */(element)
                wxSelection.selectedList.push({ kind: "table", element })
                continue
            }

            // row
            if (element instanceof HTMLTableRowElement) {
                wxSelection.tableRow = /** @type {wxTableRowType|null} */(element)
                wxSelection.table = /** @type {wxTableType|null} */ (element.closest("table"))
                wxSelection.selectedList.push({ kind: "row", element })
                continue
            }

            // cell
            if (element instanceof HTMLTableCellElement) {
                wxSelection.tableCell = element
                wxSelection.tableRow = /** @type {wxTableRowType|null} */(element.parentElement instanceof HTMLTableRowElement ? element.parentElement : null)
                wxSelection.table = /** @type {wxTableType|null} */(element.closest("table"))
                wxSelection.selectedList.push({ kind: "cell", element })
                continue
            }

            // coluna: não existe um "elemento coluna" padrão.
            // Se você marca várias células da coluna com .selected, isso já cairia no case "cell".
            // Se você tiver um elemento/overlay da coluna, trate aqui.
        }

        return wxSelection
    }
}