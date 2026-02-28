"use strict"

import Config from "./Config.mjs"

/** @typedef {import("./Typedefs.mjs").wxWordex} wxWordex */

export default class SysClass {
  #object = null
  #kind = ""
  #rule = ""
  #styleSheets = []
  #classNames = []
  #eventListeners = []
    /*
        const header = this.wordex.objectNew(this, WdxSection,
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
  /**
   * Construtor da classe SysClass
   * @param {wxWordex} objectClassType 
   */
  constructor(objectOwner, objectClassType) {
    this.#object = new objectClassType(objectOwner)
    this.element.dataset[Config.K_KIND_INDICATOR] = classType.name.replace(/^(wx)/, "").toLowerCase()
  }

  get element() {
    return this.#object.element
  }
  /**
   * Atribui uma regra ao objeto da classe SysClass.
   * @param {string} sheet
   */
  set rule(value) {
    this.element.dataset[Config.K_RULE_INDICATOR] = rule
  }
  /**
   * Adiciona uma folha de estilos CSS ao objeto da classe SysClass.
   * @param {string} sheet
   */
  appendStyleSheet(styleSheet) {
    const style = document.createElement("style")
    style.textContent = styleSheet
    this.element.appendChild(style)
  }
  /**
   * Adiciona nomes de classes CSS ao objeto da classe SysClass.
   * @param {string} cssClassName 
   */
  addClassName(className) {
    this.#classNames.push(className)
  }
  /**
   * Adicionar escutadores de eventos ao objeto da classe SysClass.
   * @param {string} eventName 
   * @param {(e: Event) => void} listenerHandler 
   */
  addEventListener(eventName, listenerHandler) {
    this.#eventListeners.push({ eventName, listenerHandler })
  }

  get element() {
    const div = document.createElement("div")

    div.tabIndex = -1
    div.dataset.wrdKind = this.#kind
    if (this.#rule)
      div.dataset.wrdRule = this.#rule
    if (this.#classNames.length)
      div.classList.add(...this.#classNames)
    this.#eventListeners.forEach(listener => this.element.addEventListener(listener.name, listener.listenerHandler))


  }
}
