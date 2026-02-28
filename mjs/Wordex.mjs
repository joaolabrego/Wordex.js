"use strict"

import SysObject from "./SysObject.mjs"
import SysBody from "./SysBody.mjs"
import WdxTemplate from "./WdxTemplate.mjs"

/** @typedef {import("./Typedefs.mjs").wxWordex} wxWordex */

/**
 * Hungarian Notation:
 * Identificadores prefixados com wx referem-se a objetos das classes do Wordex.
 * Identificadores prefixados com wdx referem-se a objetos HTML.
 * Identificadores prefixados com wrd referem-se aos demais objetos que não são Wordex e nem HTML.
 */
export default class Wordex {
    #SysBody = null
    #WdxTemplate = null

    /**
     * Construtor da classe Wordex.
     * @param {SysBody} SysBody 
     */
    constructor(SysBody) {
        this.#SysBody = SysBody
        this.#SysBody.element.classList.add("body")
        
        const template = new SysObject(this, WdxTemplate)

        this.#SysBody.owner.pushEventListener(document, "selectionchange", () => SysRange.saveSelection())
    }
    
    get owner() {
        return this.#SysBody
    }

    get template() {
        return this.#WdxTemplate
    }

    /**
     * @param {object} objectOwner
     * @param {new (owner: any) => wxWordex} classType
     * @param {string} kind
     * @param {{
     *   rule?: string,
     *   cssClasses?: string[],
     *   cssStyle?: string,
     *   eventListeners?: { name: string, handler: (e: Event) => void }[]
     * }} [attributes]
     * @returns {{ object: wxWordex, element: HTMLDivElement }}
     */
    objectNew(objectOwner, classType, attributes) {

        const kind = classType.name.replace(/^(wx|wdx)/, "").toLowerCase()
        const object = new classType(objectOwner)

        const element = document.createElement("div")
        element.tabIndex = -1;

        this.pushAttribute(element, "wrdKind", kind);

        attributes?.cssClasses?.forEach(cssClass => element.classList.add(cssClass));

        if (attributes?.cssStyle) {
            const style = document.createElement("style");
            style.textContent = attributes.cssStyle;
            element.appendChild(style);
        }

        if (attributes?.rule)
            this.pushAttribute(element, "wrdRole", attributes.rule)
       
        attributes?.eventListeners?.forEach(listener => this.pushEventListener(element, listener.name, listener.handler))

        return { object, element }
    }
}