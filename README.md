# PDF Report Modal
A modal component to display PDF files from a url on your website.

## Instalation
- **npm:**

    <code>npm i pdf-report-modal</code>

- **script tag:**

    <code>&lt;script src="/dist/js/pdf-report-modal.js"&gt;&lt;/script&gt;</code>

## Basic usage
- **HTML**

    <code>&lt;div id="myContainer"&gt;&lt;/div&gt;</code>

- **CSS**

    <code>&lt;link rel="stylesheet"  href="/dist/css/pdf-report-modal.css"/&gt;</code>

- **Assets**

    Copy files from **pdf-report-modal/dist/assets** to **your-project/dist/assets** folder.

- **JavaScript**

<pre>
    const options = { 
        modal: { 
            modalTitle: "Some Title" 
        }, 
        document: { 
            documentUrl: "https://mydomain.com/some-file.pdf", 
            pdfWorkerPath: "/dist/js/pdf.worker.min.js" 
        } 
    };
    const myViewer = new PdfReportModal("myContainer", options);
    myViewer.openModal();
    myViewer.renderDocument();
</pre>
