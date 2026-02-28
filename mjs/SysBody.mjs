import Config from "./Config.mjs";

export default class SysBody {
    /**
     * @returns {HTMLDocument}
     */
    #wdxDocument = null
    #wdxBody = null
    #wdxHead = null
    constructor() {
        const style = document.createElement("style")
        style.textContent = Config.Script
        document.head.appendChild(style);
    }
    get owner() {
        return document
    }
    /**
     * @returns {HTMLBodyElement}
     */
    get element() {
        return document.body
    }
    /**
     * Adiciona uma div ao body.
     * @param {HTMLDivElement} element 
     */
    append(element) {
        this.element.append(element)
    }
}