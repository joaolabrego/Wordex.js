// @ts-check
"use strict"

import wxImage from "./wxImage.mjs"
import wxPage from "./wxPage.mjs"
import wxParagraph from "./wxParagraph.mjs"
import wxSection from "./wxSection.mjs"
import wxTable from "./wxTable.mjs"
import wxToolbar from "./wxToolbar.mjs"

/** @typedef {import("./wdxTypes.mjs").wdxParagraph} wdxParagraph */

export default class wxTemplate {
  /** @type {wxPage} */ #page
  /** @type {wxToolbar} */ #toolbar

  /** @type {wxPage[]} */ #pages = []
  /** @type {wxSection[]} */ #sections = []
  /** @type {wxParagraph[]} */ #paragraphs = []
  /** @type {wxImage[]} */ #images = []
  /** @type {wxTable[]} */ #tables = []
  constructor() {
    this.#toolbar = new wxToolbar(this.#page = new wxPage(this))

    document.body.replaceChildren(this.#toolbar.element, this.#page.element)
    
    //this.#page.body.firstParagraph?.selectParagraph()
  }

  get toolbar() {
    return this.#toolbar
  }
  /**
   * @param {wxPage} object 
   * @returns {void}
   */
  addPage(object) {
    if (this.#pages.findIndex(obj => obj === object) === -1)
      this.#pages.push(object)
  }
  /**
   * @param {wxSection} object 
   * @returns {void}
   */
  addSection(object) {
    if (this.#sections.findIndex(obj => obj === object) === -1)
      this.#sections.push(object)
  }
  /**
   * @param {wxParagraph} object 
   * @returns {void}
   */
  addParagraph(object) {
    if (this.#paragraphs.findIndex(obj => obj === object) === -1)
      this.#paragraphs.push(object)
  }
  /**
   * @param {wxImage} object 
   * @returns {void}
   */
  addImage(object) {
    if (this.#images.findIndex(obj => obj === object) === -1)
      this.#images.push(object)
  }
  /**
   * @param {wxTable} object 
   * @returns {void}
   */
  addTable(object) {
    if (this.#tables.findIndex(obj => obj === object) === -1)
      this.#tables.push(object)
  }
}