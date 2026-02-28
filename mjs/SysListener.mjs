"use strict"

import WdxTemplate from "./WdxTemplate.mjs"
import SysObject from "./SysObject.mjs"
import Config from "./Config.mjs"


/** @typedef {import("./Typedefs.mjs").wxWordex} wxWordex */

export default class SysListener {
    #SysObject = null
    #wrdType = ""
    #wrdHandler = null

    /**
     * Construtor da classe SysListener
     * @param {SysObject} object 
     * @param {string} wrdType 
     * @param {e: Event => void} wrdHandler 
     */
    constructor(SysObject, wrdType, wrdHandler) {
        this.#SysObject = SysObject
        this.#wrdType = wrdType
        this.#wrdHandler = wrdHandler
    }
    /**
     * @returns {wxWordex}
     */
    get SysObject() {
        return this.#SysObject
    }
    /**
     * @returns {string}
     */
    get wrdType() {
        return this.#wrdType
    }
    /**
     * @returns {e: Event => void}}
     */    
    get wrdHandler() {
        return this.#wrdHandler
    }
}