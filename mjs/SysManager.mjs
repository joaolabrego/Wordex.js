"use strict"

import WdxTemplate from "./WdxTemplate.mjs"
import SysObject from "./SysObject.mjs"
import Config from "./Config.mjs"


/** @typedef {import("./Typedefs.mjs").wxWordex} wxWordex */

export default class SysManager {
    /** @type {SysObject[]} */
    #wxObjects = []

    /** @type {WdxTemplate} */
    #WdxTemplate = null
 
    /**
     * Construtor da classe SysManager.
     * @param {WdxTemplate} WdxTemplate 
     */
    constructor(WdxTemplate) {
        this.#WdxTemplate = WdxTemplate
    }
    /**
     * @returns {WdxTemplate}
     */
    get owner() {
        return this.#WdxTemplate
    }
    /**
     * Retorna true ou false se existir ou não o objeto.
     * @param {wxWordex} wxObject 
     * @returns 
     */
    existsObject(wxObject) {
        return this.#wxObjects.findIndex(obj => obj.wxObject === wxObject) > -1
    }
    /**
     * Adiciona objeto ao array gerenciador de instâncias de classes do Wordex.
     * @param {wxWordex} wxObject 
     * @returns {void}
     */
    appendObject(wxObject) {
        if (this.existsObject(wxObject))
            return

        this.#wxObjects.push(new SysObject(wxObject))
    }

    /**
     * Remove objeto do array gerenciador de objetos do Wordex.
     * @param {wxWordex} wxObject 
     * @returns {void}
     */
    removeObject(wxObject) {
        const object = this.findObject(wxObject)

        if (!wxObject)
            return
        if (object.wrdAbortController)
            object.
                this.#wxObjects[index].element.remove()
        Config.deleteArrayItem(this.#wxObjects, wxObject)
    }

    /**
     * Retorna o objeto de wxObject se existir em #wxObjects.
     * @param {wxWordex} wxObject 
     * @returns {wxWordex}
     */
    findObject(wxObject) {
        return this.#wxObjects.find(obj => obj.wxObject === wxObject)
    }

    /**
     * Retorna o índice do objeto wxObject se existir em #wxObjects e em #WdxTemplate, senão retorna -1.
     * @param {wxWordex} wxObject 
     * @returns {number}
     */
    findObjectIndex(wxObject) {
        return this.#wxObjects.findIndex(obj => obj.wxObject === wxObject)
    }
    /**
     * Retorna true ou false conforme o wxObject esteja ou não em foco.
     * @param {wxWordex} wxObject 
     * @returns {boolean}
     */
    isFocused(wxObject) {
        return !!wxObject.element.dataset[Config.K_FOCUS_INDICATOR]
    }
    /**
     * Retorna primeiro objeto focado em #wxObjects pertencente ao #WdxTemplate.
     * @returns {SysObject}
     */
    findFocused() {
        return this.#wxObjects.find(obj => this.isFocused(obj.wxObject))
    }
    /**
     * Retorna índice do primeiro objeto focado em #wxObjects, se não existir, -1.
     * @returns {number}
     */
    findFocusedIndex() {
        return this.#wxObjects.findIndex(obj => this.isFocused(obj.wxObject))
    }
    /**
     * Retorna true ou false se existe objeto focado.
     * @returns {boolean}
     */
    existsFocused() {
        return this.#wxObjects.findIndex(obj => this.isFocused(obj.wxObject)) > -1
    }
    /**
    * Remove o foco do único elemento focado.
    * @param {boolean} [updateLastFocus] indica se o foco é restaurado pro último objeto focado.
    * @returns {void}
    */
    unfocus(updateLastFocus = true) {
        const focused = this.findFocused()

        if (!focused)
            return
        delete focused.wxObject.element.dataset[Config.K_FOCUS_INDICATOR]
        if (updateLastFocus && focused.wxLastFocused)
            this.focus(focused.wxLastFocused)
    }
    /**
     * Remove o foco do elemento anterior e foca o atual.
     * @param {wxWordex} wxObject 
     * @returns {void}
     */
    focus(wxObject) {
        const lastFocused = this.findFocused()
        if (lastFocused.wxLastFocused)
            this.unfocus(false)
        wxObject.element.dataset[Config.K_FOCUS_INDICATOR] = "1"

        const focused = this.findFocused()
        if (focused)
            focused.wxLastFocused = lastFocused
    }
}