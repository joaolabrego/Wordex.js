"use strict"

import WrdToolbar from "./WrdToolbar.mjs"
import SysObject from "./SysObject.mjs"
import WrdTemplate from "./WrdTemplate.mjs"
import SysBody from "./SysBody.mjs"

/** @typedef {import("./Typedefs.mjs").TWordex} TWordex */

/**
 * Hungarian Notation:
 * Propriedades/métodos prefixados com wr referem-se a objetos de classes prefixadas com Sys.
 * Propriedades/métodos prefixados com wd referem-se a elementos HTML.
 * Propriedades/métodos prefixados com wx referem-se a objetos de classes prefixadas com Wdx.
 * Propriedades/métodos prefixados com wo referem-se a propriedades e métodos genéricos.
 * Instâncias da classe SysObject receberão prefixo obj.
 */
export default class WrdWordex {
    #wdBody = null
    #objBody = null
    #wxToolbar = null
    #objTemplate = null
    /**
     * Construtor da classe Wordex.
     */
    constructor(body) {
        this.#wdBody = body

        this.#objBody = new SysObject(this, SysBody)

        this.#objTemplate = new SysObject(this, WrdTemplate)
        this.#wxToolbar = new WrdToolbar(this.#objTemplate.element)
        
        this.owner.replaceChildren(this.#wxToolbar, this.#objTemplate.element)

        
        //document.addEventListener("selectionchange", () => SysRange.saveSelection())
    }

    /** @returns {HTMLBodyElement} */
    
    get owner() {
        return this.#wdBody
    }
    get wxToolbar() {
        return this.#wxToolbar
    }

    get objTemplate() {
        return this.#objTemplate
    }
}