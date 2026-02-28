"use strict"

import SysListener from "./SysListener.mjs"

/** @typedef {import("./Typedefs.mjs").wxWordex} wxWordex */

export default class SysObject {
    #wxObject = null
    #wxLastFocused = null
    #wrdEventListeners = []

    /**
     * Construtor da classe SysObject.
     * @template T
     * @param {wxWordex} objectOwner 
     * @param {new (owner: wxWordex) => T} objectClassType
     */
    constructor(objectOwner, objectClassType) {
        this.#wxObject = new objectClassType(objectOwner)
    }
    /**
     * @returns {wxWordex}
     */
    get owner() {
        return this.#wxObject
    }
    /**
     * @returns {HTMLDivElement}
     */
    get element() {
        return this.#wxObject.element
    }
    /**
     * @returns {wxWordex}
     */
    get wxObject() {
        return this.#wxObject
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
     * Adiciona className ao objeto.
     */
    appendClassName(className) {
        this.#wxObject.element.classList.add(className)
    }
    /**
    * @returns {void}
    */
    appendStyleSheet(styleSheet) {
        const style = document.createElement("style")
        style.textContent = styleSheet
        element.appendChild(style);
    }
    /**
     * Adiciona data-* no objeto HTML.
     * @param {string} name 
     * @param {string} [value] 
     * @returns {void}
     */
    appendData(wrdName, wrdValue = "1") {
        this.element.dataset[wrdName] = wrdValue
    }
    /**
     * Retorna valor salvo em atributo data-* do objeto HTML.
     * @param {string} name
     * @returns {string}
     */
    getDataset(wrdName) {
        return this.element.dataset[wrdName]
    }
    /**
     * Remove atributo data-* do objeto HTML.
     * @param {string} wrdName 
     * @returns {void}
     */
    removeDataset(wrdName) {
        delete this.element.dataset[wrdName]
    }
    /**
     * Adiciona ouvinte de evento ao elemento HTML.
     * @param {string} wrdType
     * @param {(e: Event) => void} wrdHandler
     * @returns {void}
     */
    appendEventListener(wrdType, wrdHandler) {
        this.#wrdEventListeners.push(new SysListener(this.wxObject, wrdType, wrdHandler))
        this.element.addEventListener(wrdType, wrdHandler)
    }
    /**
     * Remove todos os ouvintes de eventos do elemento HTML.
     * @returns {void}
     */
    clearEventListeners() {
        this.#wrdEventListeners.forEach(listener => this.element.removeEventListener(listener.wrdType, listener.wrdHandler))
        this.#wrdEventListeners.length = 0
    }
}