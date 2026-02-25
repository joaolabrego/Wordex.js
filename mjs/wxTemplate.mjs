"use strict"

import wxImage from "./wxImage.mjs"
import wxPage from "./wxPage.mjs"
import wxParagraph from "./wxParagraph.mjs"
import wxSection from "./wxSection.mjs"
import wxTable from "./wxTable.mjs"
import wxToolbar from "./wxToolbar.mjs"

export default class wxTemplate {
  #page
  #toolbar

  #pages = []
  #sections = []
  #paragraphs = []
  #images = []
  #tables = []
  constructor() {
    this.#toolbar = new wxToolbar(this.#page = new wxPage(this))

    document.body.replaceChildren(this.#toolbar.element, this.#page.element)
    
    //this.#page.body.firstParagraph?.selectParagraph()
  }

  get toolbar() {
    return this.#toolbar
  }

  addPage(object) {
    if (this.#pages.findIndex(obj => obj === object) === -1)
      this.#pages.push(object)
  }

  addSection(object) {
    if (this.#sections.findIndex(obj => obj === object) === -1)
      this.#sections.push(object)
  }

  addParagraph(object) {
    if (this.#paragraphs.findIndex(obj => obj === object) === -1)
      this.#paragraphs.push(object)
  }

  addImage(object) {
    if (this.#images.findIndex(obj => obj === object) === -1)
      this.#images.push(object)
  }
 
  addTable(object) {
    if (this.#tables.findIndex(obj => obj === object) === -1)
      this.#tables.push(object)
  }
}