"use strict"

import Config from "./Config.mjs"
import SysClass from "./SysClass.mjs"
import WdxDocument from "./WdxDocument.mjs"
import SysManager from "./SysManager.mjs"
import WdxToolbar from "./WdxToolbar.mjs"
import SysObject from "./SysObject.mjs"

export default class WdxTemplate {
  #SysManager = null
  #wordex = null
  #objTemplate = null
  #objDocument = null
  #objToolbar = null

  /**
   * Construtor da classe WdxTemplate.
   * @param {HTMLBodyElement} wdxBody
   */
  constructor(wordex) {
    this.#wordex = wordex
    this.#SysManager = new SysManager(this)
    
    this.#objDocument = new SysObject(new SysClass(this, WdxDocument))
    this.#objDocument.appendStyleSheet(Config.ScriptDocument)
    this.#objDocument.appendClassName("document")
    this.#objDocument.appendEventListener("beforeinput", e => {
      if (this.toolbar.isOverwriteMode)
        ActEdit.handleOverwriteInput(e)
    })




    /*
    const doc = this.#wordex.objectNew(this, WdxDocument,
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
    //this.#WdxToolbar = new WdxToolbar(this)
    const toolbar = this.#wordex.objectNew(this, WdxToolbar, "toolbar")
    this.#WdxToolbar = toolbar.object

    this.#wdxTemplate.appendChild(this.#WdxToolbar.element)
    this.#wdxTemplate.appendChild(this.document.element)
    */
    const toolbar = new SysClass(this, WdxToolbar)

  }
  /**
   * @returns {HTMLBodyElement}
   */
  get owner() {
    return this.#wordex
  }
  /**
   * @returns {HTMLDivElement}
   */
  get element() {
    return this.#objTemplate
  }
  get wordex() {
    return this.#wordex
  }
  get manager() {
    return this.#SysManager
  }
  get htmlTag() {
    return "div"
  }
 
  /**
   * @returns {WdxToolbar}
   */
  get toolbar() {
    return this.#objToolbar
  }
  get toolbars() {
    return this.#wordex.objects.filter(obj => obj instanceof WdxToolbar)
  }
  /**
   * @returns {WdxDocument}
   */
  get document() {
    return this.#objDocument
  }
  /**
   * @param {WdxDocument} object
   */
  set document(document) {
    this.#objDocument = document
  }  
  get documents() {
    return this.#wordex.objects.filter(obj => obj instanceof WdxDocument)
  }
}