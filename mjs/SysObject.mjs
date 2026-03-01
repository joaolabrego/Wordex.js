"use strict"

import Config from "./Config.mjs"
import SysListener from "./SysListener.mjs"

/** @typedef {import("./Typedefs.mjs").wxWordex} wxWordex */

export default class SysObject {
    #wxOwner = null
    #wxObject = null
    #wdElement = null
    #wxLastFocused = null
    #woEventListeners = []
    #woStyleSheets = []

    /**
     * Construtor da classe SysObject.
     * @param {SysObject} owner 
     * @param {new (owner: TWordexes) => TWordexes} classType
     * @param {string} [rule]
     */
    constructor(owner, classType, rule = "") {
        this.#wxOwner = owner
        this.#wxObject = new classType(owner)
        if (rule)
            this.#wdElement.dataset[Config.K_RULE_INDICATOR] = rule
        this.#wdElement = document.createElement(this.#wxObject.htmlTag)
        this.#wdElement.dataset[Config.K_KIND_INDICATOR] = classType.name.replace(/^(Wdx|Wrd|Sys)/, "").toLowerCase()
    }
    /**
     * @returns {wxWordex}
     */
    get owner() {
        return this.#wxOwner
    }
    /**
     * @returns {wxWordex}
     */
    get wxObject() {
        return this.#wxObject
    }
    /**
     * @returns {HTMLDivElement}
     */
    get element() {
        return this.#wdElement
    }
    /**
     * @param {HTMLDivElement}
     * @returns {void}
     */
    set element(template) {
        this.#wdElement = template
    }
    /**
     * @returns {wxWordex}
     */
    get wxLastFocused() {
        return this.#wxLastFocused
    }
    /**
     * @param {wxWordex} wxObject
     */
    set wxLastFocused(wxObject) {
        this.#wxLastFocused = wxObject
    }
    /**
     * @param {boolean} focable
     */
    set wrFocable(focable) {
        if (focable)
            this.element.tabIndex = 0 // focável pelo TAB
        else
            this.element.removeAttribute("tabindex"); // volta ao padrão (não focável)
    }
    /**
     * @param {string} value
     */
    set textContent(value) {
        this.element.textContent = value
    }
    /**
     * @param {boolean} editable
     */
    set contentEditable(editable) {
        this.element.contentEditable = editable ? "true" : "false"
    }
    /**
    * @param {string} className
    * @returns {void}
    */
    appendClassName(className) {
        this.element.classList.add(className)
    }
    /**
    * @param {string} styleSheet
    * @returns {void}
    */
    appendStyleSheet(styleSheet) {
        const style = document.createElement("style")
        style.textContent = styleSheet
        document.head.appendChild(style)
        this.#woStyleSheets.push(style)
    }
    /**
    * @param {number} styleSheetIndex
    * @returns {void}
    */
    removeStyleSheet(styleSheetIndex) {
        if (styleSheetIndex >= 0 && styleSheetIndex < this.#woStyleSheets.length) {
            this.#woStyleSheets[styleSheetIndex].remove()
            this.#woStyleSheets.slice(styleSheetIndex, 1)
        }
    }
    /**
    * @returns {void}
    */
    clearStyleSheets() {
        this.#woStyleSheets.forEach(styleSheet => styleSheet.remove())
        this.#woStyleSheets.length = 0
    }

    /**
     * Adiciona data-* no objeto HTML.
     * @param {string} name 
     * @param {string} [value] 
     * @returns {void}
     */
    appendDataset(name, value = "1") {
        this.element.dataset[name] = value
    }
    /**
     * Retorna valor salvo em atributo data-* do objeto HTML.
     * @param {string} name
     * @returns {string}
     */
    getDataset(name) {
        return this.element.dataset[name]
    }
    /**
     * Remove atributo data-* do objeto HTML.
     * @param {string} name 
     * @returns {void}
     */
    removeDataset(name) {
        delete this.element.dataset[name]
    }
    /**
     * Adiciona ouvinte de evento ao elemento HTML.
     * @param {string} name
     * @param {(e: Event) => void} handler
     * @returns {void}
     */
    appendEventListener(name, handler) {
        this.#woEventListeners.push(new SysListener(this.wxObject, name, handler))
        this.element.addEventListener(name, handler)
    }
    /**
     * Remove todos os ouvintes de eventos do elemento HTML.
     * @returns {void}
     */
    clearEventListeners() {
        this.#woEventListeners.forEach(listener => this.element.removeEventListener(listener.wrdType, listener.wrdHandler))
        this.#woEventListeners.length = 0
    }
    /**
     * Adiciona elemento HTML ao objeto HTML.
     * @param {HTMLElement} element
     * @returns {void}
     */
    appendElement(element) {
        this.#wdElement.appendChild(element)
    }
}