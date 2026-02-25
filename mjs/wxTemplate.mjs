"use strict"

import wxImage from "./wxImage.mjs"
import wxPage from "./wxPage.mjs"
import wxParagraph from "./wxParagraph.mjs"
import wxSection from "./wxSection.mjs"
import wxTable from "./wxTable.mjs"
import wxToolbar from "./wxToolbar.mjs"

export default class wxTemplate {
  #page = null
  #toolbar = null
  #objects = []

  constructor() {
    this.#toolbar = new wxToolbar(this.#page = new wxPage(this))

    document.body.replaceChildren(this.#toolbar.element, this.#page.element)

    //this.#page.body.firstParagraph?.selectParagraph()
  }

  get toolbar() {
    return this.#toolbar
  }

  add(object) {
    if (this.#objects.findIndex(obj => obj === object) === -1)
      this.#objects.push(object)
    console.log(this.#objects)
  }
}