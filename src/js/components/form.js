"use strict";

const CONS = require("../constants.js");
const REEFJS = require("reefjs");
import ToggleFormIcon from "../../assets/toggle-form.svg";

export default class Form{
    constructor(element, objStore){
        let {store, component} = REEFJS;
        this.element = element;
        this.store = store(objStore, "form-store");
        this.component = component(element, () => this.template(), {stores: ["form-store"]});
    }
    template(){
        let toggleButton = this.store.showToggleButton === true ?
        `<input type="image" width="${CONS.btnSize}" height="${CONS.btnSize}" src="${ToggleFormIcon}" data-control="form-toggler" data-action="toggle"/>` : "";
        this.element.style.display = this.store.showForm === true ? "block" : "none";
        let minWidth = this.store.formMinWidth ? `min-width:${this.store.formMinWidth};` : "";
        let maxWidth = this.store.formMaxWidth ? `max-width:${this.store.formMaxWidth};` : "";
        let wrapperStyle = minWidth || maxWidth ? ` style="${minWidth}${maxWidth}"` : "";
        this.setValueButton("submit", this.store.submitButtonText);
        this.setValueButton("reset", this.store.resetButtonText);
        return `
        <div class="${CONS.classPrefix}-form-wrapper">
            ${toggleButton}    
            <form${wrapperStyle}>
                ${this.store.formFields.map(field => {
                    switch(field.tagName){
                        case "input":
                            return this.generateInputTags(field.tags, field.type, field.labelText ? field.labelText : null);
                        case "select":
                            return `
                            <div>
                                <label>${field.labelText}</label>
                                <select ${this.concatAttributtes(field.attributes)}>
                                    ${field.options.map(option => `<option ${this.concatAttributtes(option.attributes)}>${option.text}</option>`).join("")}
                                </select>
                            </div><br>`
                    }
                }).join("")}
                <div class="${CONS.classPrefix}-generic-control-container">
                    <input type="submit"${this.store.submitBtnClass === "" ? "" : ` class="${this.store.submitBtnClass}"`} value="${this.store.submitButtonText}"/>
                    ${this.store.showResetButton === true ? 
                    `<input type="reset"${this.store.resetBtnClass === "" ? "" : ` class="${this.store.resetBtnClass}"`}  value="${this.store.resetButtonText}"/>` : ""}
                </div>
            </form>
        </div>`;
    }
    concatAttributtes(objAttributes){
        let strAttributes = "";
        for(const [key, value] of Object.entries(objAttributes)){
            if(key !== "type"){
                strAttributes = strAttributes + `${key}${!value ? " " : `="${value}"`}`;
            }
        }
        return strAttributes;
    }
    generateInputTags(tags, type, text){
        if(type === "radio" || type === "checkbox"){
            return `
            <div>
                ${text ? `<label>${text}</label>` : ""}
                ${tags.map(tag => `
                <div>
                    <input type="${type}" ${this.concatAttributtes(tag.attributes)}/>
                    <label${tag.attributes.id ? ` for="${tag.attributes.id}"` : ""}>${tag.labelText}</label>
                </div>`).join("")}
            </div><br>`;
        }
        else{
            return `
            <div>
                <label${tags[0].attributes.id ? ` for="${tags[0].attributes.id}"` : ""}>${tags[0].labelText}</label>
                <input type="${type}" ${this.concatAttributtes(tags[0].attributes)}/>
            </div><br>`;
        }
    }
    setValueButton(type, text){
        let button = this.element.querySelector(`form input[type="${type}"]`);
        if(button){
            button.value = text;
        }
    } 
}