import Config from "./Config.mjs";

export default class SysBody {
    constructor() {
        const style = document.createElement("style")
        style.textContent = Config.Script
        document.head.appendChild(style)
    }
    /** @returns {HTMLDocument} */
    get owner() {
        return document
    }
    /** @returns {HTMLBodyElement} */
    get element() {
        return document.body
    }
    /** 
     * @param {HTMLDivElement} element 
     * @returns {void}
     */
    append(element) {
        this.element.appendChild(element)
    }

    get htmlTag(){
        return "div"
    }
}