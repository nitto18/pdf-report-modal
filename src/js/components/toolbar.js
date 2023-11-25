"use strict";
const CONS = require("../constants.js");
const REEFJS = require("reefjs");
import DownloadIcon from "../../assets/download.svg";
import PrevPageIcon from "../../assets/prev-page.svg";
import NextPageIcon from "../../assets/next-page.svg";
import PrintIcon from "../../assets/print.svg";
import ZoomInIcon from "../../assets/zoom-in.svg";
import ZoomOutIcon from "../../assets/zoom-out.svg";

export default class Toolbar{
    constructor(element, objStore){
        let {store, component} = REEFJS;
        this.element = element;
        this.store = store(objStore, "toolbar-store");
        this.component = component(element, () => this.template(), {stores: ["toolbar-store"]});
    }
    template(){
        let pdfPager = "";
        let pdfPrinter = "";
        let docDownloader = "";
        const PagerStatus = this.store.renderAllPdf === true ? "disabled" : "";
        if(this.store.showDownloadButton === true){
            docDownloader = `
            <div class="${CONS.classPrefix}-tooltip ${CONS.classPrefix}-tooltip--bottom">
                <a href="${this.store.finalDownloadUrl}" target="_blank"><img width="${CONS.btnSize}" height="${CONS.btnSize}" src="${DownloadIcon}"/></a>
                <span class="${CONS.classPrefix}-tooltip-text">${this.store.downloadToolTip}</span>
            </div>`
        }
        pdfPager = `
        <div class="${CONS.classPrefix}-pdf-pager ${CONS.classPrefix}-generic-control-container">
            <div class="${CONS.classPrefix}-tooltip ${CONS.classPrefix}-tooltip--bottom">
                <input type="image" width="${CONS.btnSize}" height="${CONS.btnSize}" src="${PrevPageIcon}" data-control="pdf-pager" data-action="prev" ${PagerStatus}/>
                <span class="${CONS.classPrefix}-tooltip-text">${this.store.prevPageToolTip}</span>
            </div>
            <div class="${CONS.classPrefix}-tooltip ${CONS.classPrefix}-tooltip--bottom">
                <input type="image" width="${CONS.btnSize}" height="${CONS.btnSize}" src="${NextPageIcon}" data-control="pdf-pager" data-action="next" ${PagerStatus}/>
                <span class="${CONS.classPrefix}-tooltip-text">${this.store.nextPageToolTip}</span>
            </div>
            <div class="${CONS.classPrefix}-generic-control-container">
                <div>
                    <input type="number" value="${this.store.currentPageNumPdf}" min="1" max="${this.store.totalPagesCountPdf}" step="1" data-control="pdf-input-page" data-action="go-page"/>
                </div>
                <div>
                    <span>${this.store.totalPagesCountPdf}</span>
                </div>
            </div>
        </div>`;
        this.setPageNumber();
        if(this.store.showPrintButton === true){
            pdfPrinter = `
            <div>
                <div class="${CONS.classPrefix}-tooltip ${CONS.classPrefix}-tooltip--bottom">
                    <input type="image" width="${CONS.btnSize}" height="${CONS.btnSize}" src="${PrintIcon}" data-control="pdf-printer" data-action="print"/>
                    <span class="${CONS.classPrefix}-tooltip-text">${this.store.printToolTip}</span>
                </div>
            </div>`;
        }
        return `
        <div class="${CONS.classPrefix}-generic-control-container">
            <div class="${CONS.classPrefix}-tooltip ${CONS.classPrefix}-tooltip--bottom">
                <input type="image" width="${CONS.btnSize}" height="${CONS.btnSize}" src="${ZoomInIcon}" data-control="pdf-zoom" data-action="in"/>
                <span class="${CONS.classPrefix}-tooltip-text">${this.store.zoomInToolTip}</span>
            </div>
            <div class="${CONS.classPrefix}-tooltip ${CONS.classPrefix}-tooltip--bottom">
                <input type="image" width="${CONS.btnSize}" height="${CONS.btnSize}" src="${ZoomOutIcon}" data-control="pdf-zoom" data-action="out"/>
                <span class="${CONS.classPrefix}-tooltip-text">${this.store.zoomOutToolTip}</span>
            </div>
            <div>
                <span>${Math.round((this.store.documentScale * 100) * 100) / 100}%</span>
            </div>
        </div>${pdfPager}${pdfPrinter}${docDownloader}`;
    }
    setPageNumber(){
        let pdfInputPage = this.element.querySelector(`input[data-control="pdf-input-page"]`);
        if(pdfInputPage){
            pdfInputPage.value = this.store.currentPageNumPdf;
        }
    }
}