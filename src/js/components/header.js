"use strict";

const CONS = require("../constants.js");
const REEFJS = require("reefjs");

export default class Header{
    constructor(element, objStore){
        let {store, component} = REEFJS;
        this.store = store(objStore, "header-store");
        this.component = component(element, () => this.template(), {stores: ["header-store"]});
    }
    template(){
        return `
        <span class="${CONS.classPrefix}-modal-header__close-modal" data-control="modal-state" data-action="close">&times</span>
        <h3>${this.store.modalTitle}</h3>`;
    }
}