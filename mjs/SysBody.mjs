import Config from "./Config.mjs";

export default class SysBody {
    /**
     * @returns {HTMLDocument}
     */
    #wdxDocument = null
    #wdxBody = null
    #wdxHead = null
    constructor() {
        this.#wdxDocument = document
        this.#wdxBody = document.body
        this.#wdxHead = document.head
        
        const style = document.createElement("style")
        style.textContent = Config.Script
        this.#wdxHead.appendChild(style);
    }
    get owner() {
        return this.#wdxDocument
    }
    /**
     * @returns {HTMLBodyElement}
     */
    get element() {
        return this.#wdxBody
    }
    /**
     * Adiciona uma div ao body.
     * @param {HTMLDivElement} element 
     */
    append(element) {
        this.element.append(element)
    }
}