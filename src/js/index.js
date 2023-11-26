"use strict";

const CONS = require("./constants.js");
import * as PDFJS from "pdfjs-dist";
import Header from "./components/header.js";
import Toolbar from "./components/toolbar.js";
import Form from  "./components/form.js";
import "../scss/index.scss";
import LoaderIcon from "../assets/loader.svg";

export class PdfReportModal{
    constructor(idDiv, settings){
        this.idDiv = idDiv;
        this.pdfInstance = null;
        this.pageRenderingPdf = false;
        this.allPagesRenderingPdf = false;
        this.proxyHandler = {
            get: (obj, prop) => this.getVar(obj, prop),
            set: (obj, prop, newVal) => this.setVar(obj, prop, newVal)
        };
        let proxyObj = {
            settings: CONS.defaultSettings,
            finalDownloadUrl: "javascript:;",
            currentPageNumPdf: 1,
            totalPagesCountPdf: 0,
            documentScale: this.getInitialPdfScale(),
            anchorDownload: ""
        };
        let divModal = document.getElementById(idDiv);
        if(divModal.PdfReportModal){
			throw new Error("PDF Report Modal already initialized on this element");
		}
        divModal.classList.add(`${CONS.classPrefix}-modal`);
        divModal.insertAdjacentHTML("beforeend", this.getModalBaseTemplate());
        this.attachBaseEvents(divModal);
        const headerStore = {
            modalTitle: proxyObj.settings.modal.modalTitle
        };
        this.header = new Header(this.modalHeader, headerStore);
        const toolbarStore = {
            currentPageNumPdf: proxyObj.currentPageNumPdf,
            totalPagesCountPdf: proxyObj.totalPagesCountPdf,
            finalDownloadUrl: proxyObj.finalDownloadUrl,
            documentScale: proxyObj.documentScale,
            anchorDownload: proxyObj.anchorDownload,
            showPrintButton: proxyObj.settings.toolbar.showPrintButton,
            showDownloadButton: proxyObj.settings.toolbar.showDownloadButton,
            renderAllPdf: proxyObj.settings.document.renderAllPdf,
            zoomInToolTip: proxyObj.settings.localization.toolbar.zoomInToolTip,
            zoomOutToolTip: proxyObj.settings.localization.toolbar.zoomOutToolTip,
            prevPageToolTip: proxyObj.settings.localization.toolbar.prevPageToolTip,
            nextPageToolTip: proxyObj.settings.localization.toolbar.nextPageToolTip,
            printToolTip: proxyObj.settings.localization.toolbar.printToolTip,
            downloadToolTip: proxyObj.settings.localization.toolbar.downloadToolTip
        };
        this.toolbar = new Toolbar(this.viewerToolbar, toolbarStore);
        const formStore = {
            showForm: proxyObj.settings.form.showForm,
            formFields: proxyObj.settings.form.formFields,
            submitBtnClass: proxyObj.settings.form.submitBtnClass,
            resetBtnClass: proxyObj.settings.form.resetBtnClass,
            showResetButton: proxyObj.settings.form.showResetButton,
            showToggleButton: proxyObj.settings.form.showToggleButton,
            formMinWidth: proxyObj.settings.form.formMinWidth,
            formMaxWidth: proxyObj.settings.form.formMaxWidth,
            submitButtonText: proxyObj.settings.localization.form.submitButtonText,
            resetButtonText: proxyObj.settings.localization.form.resetButtonText
        };
        this.form = new Form(this.formContainer, formStore);
        this.vars = new Proxy(proxyObj, this.proxyHandler);
        this.updateModal(settings);
        PDFJS.GlobalWorkerOptions.workerSrc = this.vars.settings.document.pdfWorkerPath;
        this.pdfWorker = new PDFJS.PDFWorker();
    }
    // #region public_methods
    updateModal(settings){
        this.updateSettings(settings);
    }
    openModal(){
        let modal = document.getElementById(this.idDiv);
        modal.dispatchEvent(new CustomEvent("prm:openModal", { bubbles: true }));
		modal.style.display = "block";
    }
    closeModal(){
        let modal = document.getElementById(this.idDiv);
        modal.dispatchEvent(new CustomEvent("prm:closeModal", { bubbles: true }));
        modal.style.display = "none";
    }
    async renderDocument(){
        this.resetRenderVars();
        try{
            if(!this.vars.settings.document.documentUrl || this.vars.settings.document.documentUrl === ""){
                throw new Error("Invalid or empty document URL");
            }
            this.documentLoadAnimation("show");
            this.removeAllNodes(this.documentContainer);
            this.removeAllNodes(this.scrollDocumentContainer);
            this.pdfInstance = null;
            let renderContainer = this.createElementWithClass("div", `${CONS.classPrefix}-render-container`);
            this.documentContainer.append(renderContainer);
            const mimeType = CONS.pdfMimeType;
            const docArrayBuffer = await this.fetchDocument();
            this.vars.finalDownloadUrl.startsWith("blob") && URL.revokeObjectURL(this.vars.finalDownloadUrl);
            let pdfLoadingTask = PDFJS.getDocument({
                data: docArrayBuffer, 
                worker: this.pdfWorker
            });
            this.pdfInstance = await pdfLoadingTask.promise;
            this.vars.finalDownloadUrl = this.createDocumentDownloadUrl(docArrayBuffer, mimeType);
            this.vars.currentPageNumPdf = 1;
            this.vars.totalPagesCountPdf = this.pdfInstance.numPages;
            this.vars.settings.document.renderAllPdf = this.vars.settings.document.renderAllPdfLimit > 0 && this.pdfInstance.numPages > this.vars.settings.document.renderAllPdfLimit ? 
            false : this.vars.settings.document.renderAllPdf;
            if(this.vars.settings.document.renderAllPdf === true){
                if(this.allPagesRenderingPdf === false){
                    await this.renderAllPdfPages(this.vars.documentScale);
                }
            }
            else{
                this.documentLoadAnimation("hide");
                let pdfCanvasLayer = this.createElementWithClass("canvas", `${CONS.classPrefix}-pdf-canvas-layer`);
                let pdfTextLayer = this.createElementWithClass("div", `${CONS.classPrefix}-pdf-text-layer`);
                renderContainer.append(pdfTextLayer, pdfCanvasLayer);
                await this.renderPdfPage(this.vars.currentPageNumPdf, this.vars.documentScale);
            }
            this.viewerToolbar.style.visibility = "visible";
        }
        catch(error){
            this.documentLoadAnimation("hide");
            this.resetRenderVars();
            console.error(error.message);
        }
    }
    getFormValues(formElement){
		if(!formElement){
			formElement = this.formContainer.querySelector("form");
		}
		let formData = new FormData(formElement);
		let objValues = {};
		let strValues = "";
		for(const [key, value] of formData.entries()){
			strValues = strValues + `${key}=${value}&`
			if(Object.hasOwn(objValues, key)){
				if(Array.isArray(objValues[key])){
					objValues[key] = [...objValues[key], ...[value]]
				}
				else{
					objValues[key] = new Array(objValues[key], value);
				}
			}
			else{
				objValues[key] = value;
			}
		}
		if(this.vars.settings.form.formValuesOutput === "object"){
			return objValues;
		}
		return strValues.slice(0, -1);
	}
    // #endregion
    // #region internal_methods
    async fetchDocument(){
        let modal = document.getElementById(this.idDiv);
        let response;
        try{
            let beginEvtObj = {
                input: this.vars.settings.document.documentUrl,
                init: {}
            };
            modal.dispatchEvent(new CustomEvent("prm:fetchPdfBegin", { 
                detail: beginEvtObj,
                bubbles: true
            }));
            response = await fetch(beginEvtObj.input, beginEvtObj.init);
            if(!response.ok){
                throw new Error(`Request failed. Server response with code ${response.status}`);
            }
            let successEvtObj = {response: response};
            modal.dispatchEvent(new CustomEvent("prm:fetchPdfSuccess", { 
                detail: successEvtObj,
                bubbles: true
            }));
            this.vars.anchorDownload = this.generateAnchorDownload(response.headers.get("Content-Disposition"));
            const arrayBuffer = await response.arrayBuffer();
            return arrayBuffer;
        }
        catch(error){
            let errorEvtObj = {
                response: response, 
                error: error 
            };
            modal.dispatchEvent(new CustomEvent("prm:fetchPdfError", { 
                detail: errorEvtObj,
                bubbles: true
            }));
            console.error(error.message);
        }
    }
    async renderPdfPage(pageNum, scale, canvas, text){
        try{
            this.pageRenderingPdf = true;
            let pdfCanvasLayer = canvas ? canvas : this.documentContainer.querySelector(`canvas.${CONS.classPrefix}-pdf-canvas-layer`);
            let pdfTextLayer = text ? text : this.documentContainer.querySelector(`div.${CONS.classPrefix}-pdf-text-layer`);
            const canvasContext = pdfCanvasLayer.getContext("2d"); // Se usó getContext("2d", {alpha: false}) para resolver problemas en el renderizado
            const page = await this.pdfInstance.getPage(pageNum);
            let pdfViewport = page.getViewport({scale: scale});
            pdfCanvasLayer.height = pdfViewport.height;
            pdfCanvasLayer.width = pdfViewport.width;
            let renderContext = {
                canvasContext: canvasContext,
                viewport: pdfViewport
            };
            await page.render(renderContext).promise;
            const textContent = await page.getTextContent();
            pdfTextLayer.innerHTML = "";
            const canvasRect = pdfCanvasLayer.getBoundingClientRect();
            pdfTextLayer.style.height = canvasRect.height + "px";
            pdfTextLayer.style.width = canvasRect.width + "px";
            PDFJS.renderTextLayer({
                textContent: textContent, // textContent será deprecated en nuevas versiones, usar textContentSource
                container: pdfTextLayer,
                viewport: pdfViewport,
                textDivs: []
            });
            this.pageRenderingPdf = false;
            return true;
        }
        catch(error){
            this.pageRenderingPdf = false;
            throw new Error(error.message);
        }
	}
    async renderAllPdfPages(calculatedScale){
        try{
            this.allPagesRenderingPdf = true;
            this.documentLoadAnimation("show");
            const renderContainer = this.documentContainer.querySelector(`div.${CONS.classPrefix}-render-container`);
            if(!renderContainer.hasChildNodes()){
                const fragmentPages = document.createDocumentFragment();
                const scrollFragmentPages = document.createDocumentFragment();
                for(let i = 1; i <= this.vars.totalPagesCountPdf; i++){
                    let pdfCanvasLayer = this.createElementWithClass("canvas", `${CONS.classPrefix}-pdf-canvas-layer`);
                    let pdfTextLayer = this.createElementWithClass("div", `${CONS.classPrefix}-pdf-text-layer`);
                    let scrollPage = document.createElement("div");
                    pdfCanvasLayer.setAttribute("data-num-page", i.toString());
                    pdfTextLayer.setAttribute("data-num-page", i.toString());
                    scrollPage.setAttribute("data-num-page", i.toString());
                    scrollPage.innerHTML = i.toString();
                    fragmentPages.append(pdfTextLayer, pdfCanvasLayer);
                    scrollFragmentPages.append(scrollPage);
                }
                renderContainer.appendChild(fragmentPages);
                this.scrollDocumentContainer.appendChild(scrollFragmentPages);
            }
            const allCanvas = renderContainer.querySelectorAll(`canvas.${CONS.classPrefix}-pdf-canvas-layer`);
            const allText = renderContainer.querySelectorAll(`div.${CONS.classPrefix}-pdf-text-layer`);
            const page = await this.pdfInstance.getPage(1);
            let pdfViewport = page.getViewport({scale: calculatedScale});
            this.scrollDocumentContainer.querySelectorAll("div").forEach(scrollPage => {
                this.pdfPagesObserver.unobserve(scrollPage); // Dejo de observar las páginas hasta que no se vuelvan a renderizar todas
                scrollPage.style.height = Math.round(pdfViewport.height)  + "px";
            });
            this.scrollDocumentContainer.style.height = Math.round((pdfViewport.height * (CONS.scrollThreshold * 200)) / 100) + "px";
            for(let i = 0; i < allCanvas.length; i++){
                await this.renderPdfPage(Number(allCanvas[i].getAttribute("data-num-page")), calculatedScale, allCanvas[i], allText[i]);
            }
            this.scrollDocumentContainer.querySelectorAll("div").forEach(scrollPage => this.pdfPagesObserver.observe(scrollPage)); // Todas renderizadas, vuevlo a observar
            this.allPagesRenderingPdf = false;
            this.documentLoadAnimation("hide");
            return true;
        }
        catch(error){
            this.allPagesRenderingPdf = false;
            this.documentLoadAnimation("hide");
            throw new Error(error.message);
        }
    }
    getModalBaseTemplate(){
        return `
        <div class="${CONS.classPrefix}-modal-content">
            <div class="${CONS.classPrefix}-modal-header"></div>
            <div class="${CONS.classPrefix}-modal-body">
                <div class="${CONS.classPrefix}-viewer-container">
                    <div class="${CONS.classPrefix}-viewer-toolbar"></div>
                    <img class="${CONS.classPrefix}-document-loader" src="${LoaderIcon}">
                    <div class="${CONS.classPrefix}-scroll-document-container"></div>
                    <div class="${CONS.classPrefix}-document-container"></div>
                </div>
                <div class="${CONS.classPrefix}-form-container"></div>
            </div>
        </div>`
    }
    getVar(obj, prop){
        if (typeof obj[prop] === "object" && obj[prop] !== null){
            return new Proxy(obj[prop], this.proxyHandler);
        }
        else{
            return obj[prop];
        }
    }
    setVar(obj, prop, newVal){
        obj[prop] = newVal;
        CONS.components.forEach(comp => {
            if(Object.hasOwn(this[comp].store, prop) === true){
                this[comp].store[prop] = newVal;
            }
        });
        return true;
    }
    resetRenderVars(){
        this.pageRenderingPdf = false;
        this.allPagesRenderingPdf = false;
    }
    updateSettings(settings, objKey){
        if(Object.keys(settings).length > 0){
			for(const [key, value] of Object.entries(settings)){
				if(typeof value === "object" && !Array.isArray(value) && value !== null){
					this.updateSettings(value, key);
				}
				else{
					if(objKey){
						this.vars.settings[objKey][key] = value;
					}
					else{
						this.vars.settings[key] = value;
					}
				}
			}
		}
    }   
    goToPdfPage(numPage){
        const renderContainer = this.documentContainer.querySelector(`div.${CONS.classPrefix}-render-container`);
        const targetCanvas = renderContainer.querySelector(`canvas[data-num-page="${numPage}"]`);
        this.documentContainer.scrollTop = targetCanvas.offsetTop;
    }
    getScaleForPdfZoom(zoomControl){
        let theScale = 0.00;
        if(zoomControl.getAttribute("data-action") === "in"){
            theScale = Math.round((this.vars.documentScale + CONS.zoom.pdfZoomFactor) * 100) / 100;
            theScale = theScale > CONS.zoom.pdfMaxZoom ? CONS.zoom.pdfMaxZoom : theScale;
        }
        else if(zoomControl.getAttribute("data-action") === "out"){
            theScale = Math.round((this.vars.documentScale - CONS.zoom.pdfZoomFactor) * 100) / 100;
            theScale = theScale < CONS.zoom.pdfMinZoom ? CONS.zoom.pdfMinZoom : theScale;
        }
        return theScale;
    }
    // #endregion
    // #region internal_events_methods
    attachBaseEvents(divModal){
        this.modalHeader = divModal.querySelector(`.${CONS.classPrefix}-modal-header`);
        this.modalHeader.addEventListener("click", this.onClickModalHeader.bind(this));
        this.viewerToolbar = divModal.querySelector(`.${CONS.classPrefix}-viewer-toolbar`);
        this.viewerToolbar.style.visibility = "hidden";
        this.viewerToolbar.addEventListener("click", this.onClickViewerToolbar.bind(this));
		this.viewerToolbar.addEventListener("keydown", this.onKeyDownViewerToolbar.bind(this));
        this.documentContainer = divModal.querySelector(`.${CONS.classPrefix}-document-container`);
        this.documentContainer.addEventListener("scroll", this.onScrollDocumentContainer.bind(this));
        this.scrollDocumentContainer = divModal.querySelector(`.${CONS.classPrefix}-scroll-document-container`);
        this.pdfPagesObserver = new IntersectionObserver(this.onScrollReachPdfPage.bind(this), {
            root: this.scrollDocumentContainer, 
            threshold: CONS.scrollThreshold
        });
        this.formContainer = divModal.querySelector(`.${CONS.classPrefix}-form-container`);
        this.formContainer.addEventListener("click", this.onClickFormContainer.bind(this));
    }  
    onClickModalHeader(event){
        const control = event.target.getAttribute("data-control");
        const action = event.target.getAttribute("data-action");
		switch(control){
            case "modal-state":
                if(action === "close"){
                    this.closeModal();
                }
            break;
        }
	}
    async onClickViewerToolbar(event){
        let renderComplete;
        const control = event.target.getAttribute("data-control");
		switch(control){
			case "pdf-pager":
                let tempCurrentPageNumPdf = this.vars.currentPageNumPdf;
				if(event.target.getAttribute("data-action") === "prev"){
					if(tempCurrentPageNumPdf <= 1){
						return;
					}
                    if(this.vars.settings.document.renderAllPdf === false){
                        if(this.pageRenderingPdf === false){
                            tempCurrentPageNumPdf-=1;
                            renderComplete = await this.renderPdfPage(tempCurrentPageNumPdf, this.vars.documentScale);
                        }
                    }
				}
				else if(event.target.getAttribute("data-action") === "next"){
					if(tempCurrentPageNumPdf >= this.vars.totalPagesCountPdf){
						return;
					}
                    if(this.vars.settings.document.renderAllPdf === false){
                        if(this.pageRenderingPdf === false){
                            tempCurrentPageNumPdf+=1;
                            renderComplete = await this.renderPdfPage(tempCurrentPageNumPdf, this.vars.documentScale);
                        }
                    }
				}
                if(renderComplete === true){
                    this.vars.currentPageNumPdf = tempCurrentPageNumPdf;
                }
				break;
			case "pdf-zoom":
                let calculatedScale = this.getScaleForPdfZoom(event.target);
                if(this.vars.settings.document.renderAllPdf){
                    if(this.allPagesRenderingPdf === false){
                        renderComplete = await this.renderAllPdfPages(calculatedScale);
                    }
                }
                else{
                    if(this.pageRenderingPdf === false){
                        renderComplete = await this.renderPdfPage(this.vars.currentPageNumPdf, calculatedScale);
                    }
                }
                if(renderComplete === true){
                    this.vars.documentScale = calculatedScale;
                }
				break;
			case "pdf-printer":
				let docWindow = window.open(this.vars.finalDownloadUrl);
				docWindow.print();
				break;
		}
    }
    async onKeyDownViewerToolbar(event){
        if(event.target.getAttribute("data-control") === "pdf-input-page" && event.target.getAttribute("data-action") === "go-page"){
			if(event.keyCode === 13){
				let nPage = Number(event.target.value);
				if(nPage > 0 && nPage <= this.vars.totalPagesCountPdf && /^[1-9]\d*$/.test(nPage.toString()) === true){
                    if(this.vars.settings.document.renderAllPdf === true){
                        this.vars.currentPageNumPdf = nPage;
                        this.goToPdfPage(nPage);
                    }
                    else{
                        if(this.pageRenderingPdf === false){
                            this.vars.currentPageNumPdf = nPage;
                            await this.renderPdfPage(Number(event.target.value), this.vars.documentScale);
                        }
                    }
				}
			}
		}
    }
    onScrollDocumentContainer(event){
        this.scrollDocumentContainer.scrollTop = event.target.scrollTop + this.scrollDocumentContainer.offsetHeight;
    }
    onScrollReachPdfPage(entries){
        entries.forEach(entry => {
            if(entry.isIntersecting === true && this.documentContainer.scrollTop > 0){
                this.vars.currentPageNumPdf = entry.target.getAttribute("data-num-page");
            }
        });
    }
    onClickFormContainer(event){
        const control = event.target.getAttribute("data-control");
		switch(control){
            case "form-toggler":
                if(event.target.getAttribute("data-action") === "toggle"){
                    let form = event.target.nextElementSibling;
                    if(form.style.display === "block" || form.style.display === ""){
                        form.style.display = "none";
                    }
                    else{
                        form.style.display = "block";
                    }
                }
                break;
        }
    }
    // #endregion
    // #region helper_methods
    documentLoadAnimation(mode){
        let renderDiv = this.documentContainer.querySelector(`div.${CONS.classPrefix}-render-container`);
        if(mode === "show"){
            this.formContainer.querySelector(`input[type="submit"]`).disabled = true;
            document.querySelector(`img.${CONS.classPrefix}-document-loader`).style.display = "block";
            if(renderDiv){
                renderDiv.style.visibility = "hidden";
            }
        }
        else if(mode === "hide"){
            this.formContainer.querySelector(`input[type="submit"]`).disabled = false;
            document.querySelector(`img.${CONS.classPrefix}-document-loader`).style.display = "none";
            if(renderDiv){
                renderDiv.style.visibility = "visible";
            }
        }
    }
    createElementWithClass(tagName, className){
		let element = document.createElement(tagName);
		element.classList.add(className);
		return element;
	}
    createDocumentDownloadUrl(pdfArrayBuffer, mimeType){
        let finalDownloadUrl = this.vars.settings.document.documentUrl;
		if(this.vars.settings.document.documentCache === true){
			finalDownloadUrl = URL.createObjectURL(new Blob([pdfArrayBuffer], {type: mimeType}));
		}
        return finalDownloadUrl;
    }
    removeAllNodes(parent){
        if(parent){
            while(parent.hasChildNodes()){
                parent.removeChild(parent.firstChild);
            }
        }
	}
    getInitialPdfScale(){
        let scale = 1.0;
        for(let i = 0; i < CONS.zoom.mediaScales.length; i++){
            if(window.matchMedia(CONS.zoom.mediaScales[i].media).matches === true){
                scale = CONS.zoom.mediaScales[i].scale;
                break;
            }
        }
        return scale;
    }
    generateAnchorDownload(cdHeader){
        let anchorDownload = "";
        if(this.vars.settings.document.documentCache === true && cdHeader){
            let cdParts = cdHeader.split(";");
            if(cdParts.length > 0){
                let nameParts = cdParts[1].split("=");
                anchorDownload = nameParts.length > 0 ? `download="${nameParts[1].replaceAll("\"", "")}"` : "";
            }
        }
        return anchorDownload;
    }
    // #endregion
}