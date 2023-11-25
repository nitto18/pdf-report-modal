module.exports = Object.freeze({
    classPrefix: "prmjslib",
    components: ["header", "toolbar", "form"],
    defaultSettings: {
        modal: {
            modalTitle: "Default Title"
        },
        document: {
            documentUrl: "",
            documentCache: true,
            pdfWorkerPath: "",
            renderAllPdf: false,
            renderAllPdfLimit: 0
        },
        toolbar: {
            showDownloadButton: true,
            showPrintButton: true
        },
        form: {
            showForm: false,
            formFields: [],
            submitBtnClass: "",
            resetBtnClass: "",
            showResetButton: true,
            showToggleButton: true,
            formValuesOutput: "query-string",
            formMinWidth: null,
            formMaxWidth: null
        },
        localization: {
            toolbar: {
                zoomInToolTip: "Zoom in",
                zoomOutToolTip: "Zoom out",
                prevPageToolTip: "Prev. Page",
                nextPageToolTip: "Next. Page",
                printToolTip: "Print",
                downloadToolTip: "Download File"
            },
            form: {
                submitButtonText: "Generate",
                resetButtonText: "Reset"
            }
        }
    },
    zoom: {
		pdfMinZoom: 0.5,
		pdfMaxZoom: 2.5,
		pdfZoomFactor: 0.25,
        mediaScales: [
            {
                media: "screen and (max-width: 600px)",
                scale: 1.75
            },
            {
                media: "screen and (min-width: 601px) and (max-width: 768px)",
                scale: 1.5
            },
            {
                media: "screen and (min-width: 768px)",
                scale: 1.25
            }
        ]
    },
    pdfMimeType: "application/pdf",
    btnSize: "32px",
    scrollThreshold: 0.1
});