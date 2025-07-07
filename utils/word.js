const htmlToDocx = require('html-to-docx');

/**
 * Convert HTML to Word document (DOCX)
 * @param {string} htmlContent - HTML content to convert
 * @param {string} filename - Output filename
 * @returns {Promise<Buffer>} DOCX buffer
 */
async function convertHTMLToWord(htmlContent, filename) {
    try {
        console.log('Converting HTML to Word document:', filename);
        
        // Configure html-to-docx options
        const options = {
            margin: {
                top: 1440,    // 1 inch in twips
                right: 1440,
                bottom: 1440,
                left: 1440
            },
            font: {
                family: 'Calibri',
                size: 11
            },
            table: {
                row: {
                    cantSplit: true
                }
            },
            header: false,
            footer: false,
            pageNumber: false
        };
        
        // Convert HTML to DOCX
        const docxBuffer = await htmlToDocx(htmlContent, null, options);
        
        console.log('Word document generated successfully');
        return docxBuffer;
        
    } catch (error) {
        console.error('HTML to Word conversion error:', error);
        throw error;
    }
}

/**
 * Convert Word document to HTML (basic implementation)
 * Note: This is a placeholder as html-to-docx doesn't support reverse conversion
 * @param {Buffer} docxBuffer - DOCX file buffer
 * @param {string} filename - Original filename for logging
 * @returns {Promise<string>} HTML content
 */
async function convertWordToHTML(docxBuffer, filename) {
    try {
        console.log('Converting Word document to HTML:', filename);
        
        // This is a placeholder - html-to-docx doesn't support reverse conversion
        // In a real implementation, you might use a library like mammoth.js
        throw new Error('Word to HTML conversion not implemented. Consider using mammoth.js for this functionality.');
        
    } catch (error) {
        console.error('Word to HTML conversion error:', error);
        throw error;
    }
}

module.exports = {
    convertHTMLToWord,
    convertWordToHTML
}; 