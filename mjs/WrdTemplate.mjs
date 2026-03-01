"use strict"

import WrdDocument from "./WrdDocument.mjs"
import SysManager from "./SysManager.mjs"
import SysObject from "./SysObject.mjs"

export default class WrdTemplate {
  #wxWwordex = null
  #wrManager = null
  #objDocument = null

  /**
   * Construtor da classe WrdTemplate.
   * @param {HTMLBodyElement} wordex
   */
  constructor(wordex) {
    this.#wxWwordex = wordex
    this.#wrManager = new SysManager(this)

    this.#objDocument = new SysObject(this, WrdDocument)
    console.log(this.#objDocument)

    this.#wxWwordex.objTemplate.element.appendElement(this.#objDocument.element)


    /*
    const doc = this.#wordex.objectNew(this, WrdDocument,
      {
        cssStyle: Config.ScriptDocument,
        cssClasses: ["document"],
        eventListeners: [
          {
            name: "beforeinput",
            handler: (e) => {
              if (this.toolbar.isOverwriteMode)
                ActEdit.handleOverwriteInput(e)
            }
          }
        ]
      })
  */

    /*
    //this.#WrdToolbar = new WrdToolbar(this)
    const toolbar = this.#wordex.objectNew(this, WrdToolbar, "toolbar")
    this.#WrdToolbar = toolbar.object

    this.#WrdTemplate.appendChild(this.#WrdToolbar.element)
    this.#WrdTemplate.appendChild(this.document.element)
    */

  }
  /**
   * @returns {HTMLBodyElement}
   */
  get owner() {
    return this.#wxWwordex
  }
  /**
   * @returns {HTMLDivElement}
   */
  get wordex() {
    return this.#wxWwordex
  }
  get manager() {
    return this.#wrManager
  }
  get document() {
    return this.#objDocument
  }
  get htmlTag() {
    return "div"
  }

}