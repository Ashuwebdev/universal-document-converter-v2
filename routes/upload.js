const express = require('express');
const router = express.Router();
const { upload, getFileType, readFile, deleteFile } = require('../utils/file');
const { convertPDFToHTML } = require('../utils/pdf');

/**
 * Handle file upload
 * POST /api/upload
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const filePath = req.file.path;
        const originalFilename = req.file.originalname;
        const fileType = getFileType(originalFilename);
        
        // Read file content
        const fileBuffer = await readFile(filePath);
        let content;
        
        // Extract content based on file type
        switch (fileType) {
            case 'html':
                content = fileBuffer.toString('utf8');
                break;
                
            case 'markdown':
                content = fileBuffer.toString('utf8');
                break;
                
            case 'pdf':
                // Convert PDF to HTML for display in the editor
                try {
                    content = await convertPDFToHTML(fileBuffer, originalFilename);
                } catch (pdfError) {
                    console.error('PDF conversion error:', pdfError);
                    // Return a more informative fallback message if PDF conversion fails
                    content = `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
                        <h3 style="color: #d32f2f; margin-top: 0;">PDF Conversion Failed</h3>
                        <p><strong>File:</strong> ${originalFilename}</p>
                        <p><strong>Error:</strong> ${pdfError.message}</p>
                        <hr style="margin: 15px 0;">
                        <p style="color: #666; font-size: 14px;">
                            <strong>Possible reasons:</strong>
                        </p>
                        <ul style="color: #666; font-size: 14px;">
                            <li>The PDF file is corrupted or damaged</li>
                            <li>The PDF is password-protected</li>
                            <li>The PDF contains only images (no text)</li>
                            <li>The PDF is in an unsupported format</li>
                        </ul>
                        <p style="color: #666; font-size: 14px;">
                            <strong>Try:</strong> Opening the PDF in a PDF reader to verify it's not corrupted, 
                            or try a different PDF file.
                        </p>
                    </div>`;
                }
                break;
                
            case 'word':
                // For Word docs, we'll return a placeholder since conversion is handled separately
                content = `Word document: ${originalFilename}`;
                break;
                
            default:
                await deleteFile(filePath);
                return res.status(400).json({ 
                    error: `Unsupported file type: ${fileType}` 
                });
        }
        
        // Clean up uploaded file
        await deleteFile(filePath);
        
        res.json({
            success: true,
            filename: originalFilename,
            fileType: fileType,
            content: content,
            message: 'File uploaded and processed successfully'
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        
        // Clean up uploaded file on error
        if (req.file && req.file.path) {
            try {
                await deleteFile(req.file.path);
            } catch (cleanupError) {
                console.error('Failed to cleanup file:', cleanupError);
            }
        }
        
        res.status(500).json({ 
            error: 'File upload failed', 
            details: error.message 
        });
    }
});

/**
 * Get supported file types
 * GET /api/supported-types
 */
router.get('/supported-types', (req, res) => {
    const supportedTypes = {
        input: ['html', 'markdown', 'pdf', 'word'],
        output: ['html', 'markdown', 'pdf', 'word'],
        extensions: ['.html', '.htm', '.md', '.markdown', '.pdf', '.docx', '.doc'],
        mimeTypes: [
            'text/html',
            'text/markdown',
            'text/x-markdown',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ]
    };
    
    res.json(supportedTypes);
});

module.exports = router; 