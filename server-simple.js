const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { marked } = require('marked');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// HTML to HTML conversion endpoint (simplified)
app.post('/convert', async (req, res) => {
    try {
        const { html, filename = 'converted.html' } = req.body;
        
        if (!html) {
            return res.status(400).json({ error: 'HTML content is required' });
        }

        // Create a complete HTML document
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Converted Document</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 40px; 
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3 { color: #333; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        img { max-width: 100%; height: auto; }
        @media print {
            body { margin: 0; padding: 10px; }
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;

        // Set response headers for HTML download
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(fullHtml, 'utf8'));
        
        res.send(fullHtml);

    } catch (error) {
        console.error('HTML conversion error:', error);
        res.status(500).json({ error: 'Failed to convert HTML: ' + error.message });
    }
});

// File upload endpoint (simplified)
app.post('/upload', upload.single('htmlFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileContent = req.file.buffer.toString('utf-8');
        const filename = req.file.originalname.replace(/\.[^/.]+$/, '.html');
        const fileExt = path.extname(req.file.originalname).toLowerCase();

        // Determine if it's HTML or Markdown
        let htmlContent;
        if (['.html', '.htm'].includes(fileExt)) {
            htmlContent = fileContent;
        } else if (['.md', '.markdown', '.txt'].includes(fileExt)) {
            htmlContent = marked.parse(fileContent);
        } else {
            return res.status(400).json({ error: 'Unsupported file type. Please upload HTML or Markdown files.' });
        }

        // Create a complete HTML document
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Converted Document</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 40px; 
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3 { color: #333; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        img { max-width: 100%; height: auto; }
        @media print {
            body { margin: 0; padding: 10px; }
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

        // Set response headers for HTML download
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(fullHtml, 'utf8'));
        
        res.send(fullHtml);

    } catch (error) {
        console.error('File conversion error:', error);
        res.status(500).json({ error: 'Failed to convert file: ' + error.message });
    }
});

// Markdown to HTML endpoint
app.post('/convert-md', async (req, res) => {
    try {
        const { markdown, type } = req.body;
        if (!markdown || !type) {
            return res.status(400).json({ error: 'Markdown content and type are required' });
        }

        const htmlContent = marked.parse(markdown);
        const title = 'Converted Markdown Document';

        if (type === 'html') {
            // Return HTML file
            const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 40px; 
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3 { color: #333; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        img { max-width: 100%; height: auto; }
        @media print {
            body { margin: 0; padding: 10px; }
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Content-Disposition', 'attachment; filename="converted-markdown.html"');
            res.send(fullHtml);
        } else {
            res.status(400).json({ error: 'Invalid type. Use "html".' });
        }
    } catch (error) {
        console.error('Markdown conversion error:', error);
        res.status(500).json({ error: 'Failed to convert markdown: ' + error.message });
    }
});

// Health check endpoint for Vercel
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Export for Vercel
module.exports = app; 