const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Import utility modules
const { generatePDF, convertPDFToHTML } = require('../utils/pdf');
const { convertMarkdownToHTML, convertHTMLToMarkdown } = require('../utils/markdown');
const { convertHTMLToWord, convertWordToHTML } = require('../utils/word');
const { getFileType, readFile, writeFile, deleteFile, cleanupFiles } = require('../utils/file');

/**
 * Convert uploaded file to different formats
 * POST /api/convert
 */
router.post('/convert', async (req, res) => {
    try {
        const { content, sourceType, targetType, filename } = req.body;
        
        if (!content || !sourceType || !targetType) {
            return res.status(400).json({ 
                error: 'Missing required parameters: content, sourceType, targetType' 
            });
        }
        
        let convertedContent;
        let outputFilename = filename || 'converted-document';
        
        // Convert based on source and target types
        switch (`${sourceType}-${targetType}`) {
            case 'html-pdf':
                const pdfBuffer = await generatePDF(content, outputFilename);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}.pdf"`);
                return res.send(pdfBuffer);
                
            case 'markdown-pdf':
                const htmlFromMarkdown = convertMarkdownToHTML(content);
                const pdfFromMarkdown = await generatePDF(htmlFromMarkdown, outputFilename);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}.pdf"`);
                return res.send(pdfFromMarkdown);
                
            case 'html-word':
                const wordBuffer = await convertHTMLToWord(content, outputFilename);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}.docx"`);
                return res.send(wordBuffer);
                
            case 'markdown-word':
                const htmlForWord = convertMarkdownToHTML(content);
                const wordFromMarkdown = await convertHTMLToWord(htmlForWord, outputFilename);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}.docx"`);
                return res.send(wordFromMarkdown);
                
            case 'html-markdown':
                convertedContent = convertHTMLToMarkdown(content);
                res.setHeader('Content-Type', 'text/markdown');
                res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}.md"`);
                return res.send(convertedContent);
                
            case 'markdown-html':
                convertedContent = convertMarkdownToHTML(content);
                res.setHeader('Content-Type', 'text/html');
                res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}.html"`);
                return res.send(convertedContent);
                
            default:
                return res.status(400).json({ 
                    error: `Conversion from ${sourceType} to ${targetType} is not supported` 
                });
        }
        
    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({ 
            error: 'Conversion failed', 
            details: error.message 
        });
    }
});

/**
 * Convert uploaded file to different formats
 * POST /api/convert-upload
 */
router.post('/convert-upload', async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const { targetType } = req.body;
        const filePath = req.file.path;
        const originalFilename = req.file.originalname;
        const fileType = getFileType(originalFilename);
        
        if (!targetType) {
            return res.status(400).json({ error: 'Target type is required' });
        }
        
        // Read uploaded file
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
                content = await convertPDFToHTML(fileBuffer, originalFilename);
                break;
                
            case 'word':
                content = await convertWordToHTML(fileBuffer, originalFilename);
                break;
                
            default:
                await deleteFile(filePath);
                return res.status(400).json({ 
                    error: `Unsupported file type: ${fileType}` 
                });
        }
        
        // Convert to target type
        let convertedContent;
        let outputFilename = path.basename(originalFilename, path.extname(originalFilename));
        
        switch (`${fileType}-${targetType}`) {
            case 'html-pdf':
                const pdfBuffer = await generatePDF(content, outputFilename);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}.pdf"`);
                await deleteFile(filePath);
                return res.send(pdfBuffer);
                
            case 'markdown-pdf':
                const htmlFromMarkdown = convertMarkdownToHTML(content);
                const pdfFromMarkdown = await generatePDF(htmlFromMarkdown, outputFilename);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}.pdf"`);
                await deleteFile(filePath);
                return res.send(pdfFromMarkdown);
                
            case 'html-word':
                const wordBuffer = await convertHTMLToWord(content, outputFilename);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}.docx"`);
                await deleteFile(filePath);
                return res.send(wordBuffer);
                
            case 'markdown-word':
                const htmlForWord = convertMarkdownToHTML(content);
                const wordFromMarkdown = await convertHTMLToWord(htmlForWord, outputFilename);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}.docx"`);
                await deleteFile(filePath);
                return res.send(wordFromMarkdown);
                
            case 'html-markdown':
                convertedContent = convertHTMLToMarkdown(content);
                res.setHeader('Content-Type', 'text/markdown');
                res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}.md"`);
                await deleteFile(filePath);
                return res.send(convertedContent);
                
            case 'markdown-html':
                convertedContent = convertMarkdownToHTML(content);
                res.setHeader('Content-Type', 'text/html');
                res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}.html"`);
                await deleteFile(filePath);
                return res.send(convertedContent);
                
            case 'pdf-html':
                convertedContent = await convertPDFToHTML(fileBuffer, originalFilename);
                res.setHeader('Content-Type', 'text/html');
                res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}.html"`);
                await deleteFile(filePath);
                return res.send(convertedContent);
                
            default:
                await deleteFile(filePath);
                return res.status(400).json({ 
                    error: `Conversion from ${fileType} to ${targetType} is not supported` 
                });
        }
        
    } catch (error) {
        console.error('File conversion error:', error);
        
        // Clean up uploaded file on error
        if (req.file && req.file.path) {
            try {
                await deleteFile(req.file.path);
            } catch (cleanupError) {
                console.error('Failed to cleanup file:', cleanupError);
            }
        }
        
        res.status(500).json({ 
            error: 'File conversion failed', 
            details: error.message 
        });
    }
});

module.exports = router; 