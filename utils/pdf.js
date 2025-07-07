const puppeteer = require('puppeteer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

/**
 * Generate PDF from HTML content using Puppeteer
 * @param {string} htmlContent - HTML content to convert
 * @param {string} filename - Output filename
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePDF(htmlContent, filename) {
    let browser;
    try {
        console.log('Launching Chrome for PDF generation...');
        
        // Pre-check: Ensure Puppeteer's bundled Chromium is available
        if (!process.env.CHROME_BIN && process.platform === 'linux') {
            try {
                const { execSync } = require('child_process');
                console.log('Checking Puppeteer bundled Chromium...');
                execSync('npx puppeteer browsers install chrome', { stdio: 'pipe' });
                console.log('Puppeteer bundled Chromium installed successfully');
            } catch (installError) {
                console.log('Could not install Puppeteer bundled Chromium:', installError.message);
            }
        }
        
        // Launch Chrome with environment-aware settings
        const chromeOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-field-trial-config',
                '--disable-ipc-flooding-protection',
                '--memory-pressure-off',
                '--single-process',
                '--disable-images',
                '--disable-javascript',
                '--max_old_space_size=4096',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu-sandbox',
                '--no-sandbox',
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-sync',
                '--metrics-recording-only',
                '--no-default-browser-check',
                '--no-first-run',
                '--safebrowsing-disable-auto-update',
                '--disable-component-extensions-with-background-pages',
                '--disable-background-mode',
                '--disable-client-side-phishing-detection',
                '--disable-hang-monitor',
                '--disable-prompt-on-repost',
                '--disable-domain-reliability',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection'
            ],
            timeout: 30000,
            protocolTimeout: 30000
        };

        // Set executable path based on environment
        if (process.env.CHROME_BIN) {
            chromeOptions.executablePath = process.env.CHROME_BIN;
            console.log('Using Chrome from CHROME_BIN environment variable:', process.env.CHROME_BIN);
        } else if (process.platform === 'linux') {
            // Try multiple possible Chrome paths for Linux environments
            const possiblePaths = [
                '/usr/bin/google-chrome-stable',
                '/usr/bin/google-chrome',
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
                '/snap/bin/chromium',
                '/opt/google/chrome/chrome',
                '/usr/bin/google-chrome-beta',
                '/usr/bin/google-chrome-unstable'
            ];
            
            // Check if any of these paths exist
            for (const chromePath of possiblePaths) {
                if (fs.existsSync(chromePath)) {
                    chromeOptions.executablePath = chromePath;
                    console.log('Found Chrome at:', chromePath);
                    break;
                }
            }
            
            // If no Chrome found, let Puppeteer use its bundled Chromium
            if (!chromeOptions.executablePath) {
                console.log('No system Chrome found, using Puppeteer bundled Chromium');
                // Remove any existing executablePath to use bundled Chromium
                delete chromeOptions.executablePath;
            }
        } else if (process.platform === 'darwin') {
            // macOS paths
            const possiblePaths = [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/Applications/Chromium.app/Contents/MacOS/Chromium'
            ];
            
            for (const chromePath of possiblePaths) {
                if (fs.existsSync(chromePath)) {
                    chromeOptions.executablePath = chromePath;
                    console.log('Found Chrome at:', chromePath);
                    break;
                }
            }
            
            // If no Chrome found, let Puppeteer use its bundled Chromium
            if (!chromeOptions.executablePath) {
                console.log('No system Chrome found, using Puppeteer bundled Chromium');
                delete chromeOptions.executablePath;
            }
        }

        try {
            browser = await puppeteer.launch(chromeOptions);
            console.log('Chrome launched successfully, creating page...');
        } catch (launchError) {
            console.log('Failed to launch with custom options, trying minimal configuration...');
            
            // Try multiple fallback strategies
            const fallbackStrategies = [
                // Strategy 1: Minimal configuration
                {
                    headless: 'new',
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage'
                    ]
                },
                // Strategy 2: Force download bundled Chromium
                {
                    headless: 'new',
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage'
                    ],
                    product: 'chrome'
                },
                // Strategy 3: Use system Chrome without path
                {
                    headless: 'new',
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage'
                    ]
                }
            ];
            
            let browserLaunched = false;
            for (let i = 0; i < fallbackStrategies.length && !browserLaunched; i++) {
                try {
                    console.log(`Trying fallback strategy ${i + 1}...`);
                    browser = await puppeteer.launch(fallbackStrategies[i]);
                    console.log(`Chrome launched with fallback strategy ${i + 1}`);
                    browserLaunched = true;
                } catch (strategyError) {
                    console.log(`Fallback strategy ${i + 1} failed:`, strategyError.message);
                    if (i === fallbackStrategies.length - 1) {
                        throw strategyError;
                    }
                }
            }
        }
        
        const page = await browser.newPage();
        
        // Set content and wait for it to load
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        console.log('Generating PDF...');
        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });
        
        console.log('PDF generated successfully');
        return pdfBuffer;
        
    } catch (error) {
        console.error('PDF generation error:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Convert PDF to HTML using headless browser rendering (best method)
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} filename - Original filename
 * @returns {Promise<string>} HTML content
 */
async function convertPDFToHTML(pdfBuffer, filename) {
    let browser;
    try {
        console.log('Converting PDF to HTML using headless browser:', filename);
        
        // Save PDF to temporary file for browser access
        const tempPdfPath = path.join(__dirname, '..', 'uploads', `temp_${Date.now()}.pdf`);
        fs.writeFileSync(tempPdfPath, pdfBuffer);
        
        // Launch browser
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set viewport for better rendering
        await page.setViewport({ width: 1200, height: 800 });
        
        // Navigate to the PDF file
        const pdfUrl = `file://${tempPdfPath}`;
        await page.goto(pdfUrl, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Wait for PDF to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Extract the rendered content using a more comprehensive approach
        const htmlContent = await page.evaluate(() => {
            // Try to get the PDF viewer content
            let content = '';
            
            // Method 1: Try to get text from the entire document
            function extractTextFromElement(element) {
                let text = '';
                
                function traverse(node) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const trimmed = node.textContent.trim();
                        if (trimmed) {
                            text += trimmed + ' ';
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        // Skip script and style elements
                        if (node.tagName.toLowerCase() === 'script' || node.tagName.toLowerCase() === 'style') {
                            return;
                        }
                        
                        // Process all child nodes
                        for (const child of node.childNodes) {
                            traverse(child);
                        }
                    }
                }
                
                traverse(element);
                return text;
            }
            
            // Try multiple selectors to find PDF content
            const selectors = [
                '#viewer',
                '.pdfViewer',
                '.textLayer',
                'body'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    content = extractTextFromElement(element);
                    if (content.trim().length > 50) {
                        break;
                    }
                }
            }
            
            // If we got content, structure it into HTML
            if (content.trim().length > 0) {
                const lines = content.split('\n').filter(line => line.trim() !== '');
                let html = '';
                let inParagraph = false;
                
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed === '') {
                        if (inParagraph) {
                            html += '</p>';
                            inParagraph = false;
                        }
                        continue;
                    }
                    
                    // Simple header detection
                    if (trimmed.length < 100 && /^[A-Z][A-Z\s]+$/.test(trimmed)) {
                        if (inParagraph) {
                            html += '</p>';
                            inParagraph = false;
                        }
                        html += `<h1>${trimmed}</h1>`;
                    } else if (trimmed.length < 100 && /^\d+\.\s+[A-Z]/.test(trimmed)) {
                        if (inParagraph) {
                            html += '</p>';
                            inParagraph = false;
                        }
                        html += `<h2>${trimmed}</h2>`;
                    } else {
                        if (!inParagraph) {
                            html += '<p>';
                            inParagraph = true;
                        }
                        html += trimmed + ' ';
                    }
                }
                
                if (inParagraph) {
                    html += '</p>';
                }
                
                return html;
            }
            
            return '';
        });
        
        // Clean up temporary file
        try {
            fs.unlinkSync(tempPdfPath);
        } catch (cleanupError) {
            console.log('Could not clean up temporary PDF file:', cleanupError.message);
        }
        
        // If headless browser method didn't work well, fall back to pdf-parse
        if (!htmlContent || htmlContent.trim().length < 100) {
            console.log('Headless browser method produced minimal content, falling back to pdf-parse');
            return await convertPDFToHTMLFallback(pdfBuffer, filename);
        }
        
        console.log('Successfully converted PDF using headless browser');
        
        // Create full HTML document
        const filenameWithoutExt = path.parse(filename).name;
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filenameWithoutExt} - Converted from PDF</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 0 auto;
            max-width: 800px;
            padding: 40px 20px;
            color: #333;
            background: #fff;
        }
        h1, h2, h3, h4, h5, h6 { 
            color: #2c3e50; 
            margin-top: 1.5em; 
            margin-bottom: 0.5em; 
        }
        h1 { font-size: 2.2em; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { font-size: 1.8em; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; }
        h3 { font-size: 1.4em; }
        h4 { font-size: 1.2em; }
        p { margin-bottom: 1em; text-align: justify; }
        .page-break { page-break-before: always; }
        .section { margin-bottom: 2em; }
        .highlight { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 1em 0; }
        .metadata { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
            margin-bottom: 2em; 
            font-size: 0.9em; 
            color: #666;
        }
        .conversion-info {
            background: #e8f5e8;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 2em;
            font-size: 0.9em;
            color: #2d5a2d;
        }
        ul, ol { margin-bottom: 1em; }
        li { margin-bottom: 0.5em; }
        blockquote { 
            border-left: 4px solid #3498db; 
            padding-left: 20px; 
            margin: 1em 0; 
            font-style: italic; 
            color: #555;
        }
        code { 
            background: #f8f9fa; 
            padding: 2px 4px; 
            border-radius: 3px; 
            font-family: 'Courier New', monospace;
        }
        pre { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
            overflow-x: auto; 
            margin: 1em 0;
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 1em 0; 
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
        }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="conversion-info">
        <strong>Document converted from PDF:</strong> ${filename}<br>
        <strong>Conversion method:</strong> Headless browser rendering<br>
        <strong>Conversion date:</strong> ${new Date().toLocaleString()}
    </div>
    
    <div class="content">
        ${htmlContent}
    </div>
</body>
</html>`;
        
        return fullHtml;
        
    } catch (error) {
        console.error('Headless browser PDF conversion error:', error);
        console.log('Falling back to pdf-parse method...');
        return await convertPDFToHTMLFallback(pdfBuffer, filename);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Fallback method using pdf-parse (the working method from git history)
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} filename - Original filename
 * @returns {Promise<string>} HTML content
 */
async function convertPDFToHTMLFallback(pdfBuffer, filename) {
    try {
        console.log('Converting PDF to HTML using pdf-parse fallback:', filename);
        
        // Parse PDF content using pdf-parse (the working method)
        const pdfData = await pdfParse(pdfBuffer);
        const textContent = pdfData.text;
        
        console.log('Successfully converted PDF using pdf-parse');
        
        // Convert text content to structured HTML using the working function
        const htmlContent = convertTextToHTML(textContent);
        
        // Create full HTML document
        const filenameWithoutExt = path.parse(filename).name;
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filenameWithoutExt} - Converted from PDF</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 0 auto;
            max-width: 800px;
            padding: 40px 20px;
            color: #333;
            background: #fff;
        }
        h1, h2, h3, h4, h5, h6 { 
            color: #2c3e50; 
            margin-top: 1.5em; 
            margin-bottom: 0.5em; 
        }
        h1 { font-size: 2.2em; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { font-size: 1.8em; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; }
        h3 { font-size: 1.4em; }
        h4 { font-size: 1.2em; }
        p { margin-bottom: 1em; text-align: justify; }
        .page-break { page-break-before: always; }
        .section { margin-bottom: 2em; }
        .highlight { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 1em 0; }
        .metadata { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
            margin-bottom: 2em; 
            font-size: 0.9em; 
            color: #666;
        }
        .conversion-info {
            background: #e8f5e8;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 2em;
            font-size: 0.9em;
            color: #2d5a2d;
        }
        ul, ol { margin-bottom: 1em; }
        li { margin-bottom: 0.5em; }
        blockquote { 
            border-left: 4px solid #3498db; 
            padding-left: 20px; 
            margin: 1em 0; 
            font-style: italic; 
            color: #555;
        }
        code { 
            background: #f8f9fa; 
            padding: 2px 4px; 
            border-radius: 3px; 
            font-family: 'Courier New', monospace;
        }
        pre { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
            overflow-x: auto; 
            margin: 1em 0;
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 1em 0; 
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
        }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="conversion-info">
        <strong>Document converted from PDF:</strong> ${filename}<br>
        <strong>Conversion method:</strong> Text extraction (fallback)<br>
        <strong>Conversion date:</strong> ${new Date().toLocaleString()}<br>
        <strong>Pages extracted:</strong> ${pdfData.numpages || 'Unknown'}
    </div>
    
    <div class="content">
        ${htmlContent}
    </div>
</body>
</html>`;
        
        return fullHtml;
        
    } catch (error) {
        console.error('PDF to HTML conversion error:', error);
        throw new Error('Failed to convert PDF to HTML: ' + error.message);
    }
}

/**
 * Convert text content to structured HTML (the working method from git history)
 * @param {string} text - Raw text content
 * @returns {string} Structured HTML
 */
function convertTextToHTML(text) {
    if (!text || text.trim() === '') {
        return '<p>No text content found in the PDF.</p>';
    }

    // Split text into lines
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    let html = '';
    let inList = false;
    let inParagraph = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (line === '') {
            if (inParagraph) {
                html += '</p>';
                inParagraph = false;
            }
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            continue;
        }

        // Detect headers (lines that are shorter and end with common patterns)
        if (isHeader(line, lines, i)) {
            if (inParagraph) {
                html += '</p>';
                inParagraph = false;
            }
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            
            const headerLevel = getHeaderLevel(line);
            html += `<h${headerLevel}>${escapeHtml(line)}</h${headerLevel}>`;
            continue;
        }

        // Detect list items
        if (isListItem(line)) {
            if (inParagraph) {
                html += '</p>';
                inParagraph = false;
            }
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            const listItem = line.replace(/^[\s•\-\*]+/, '').trim();
            html += `<li>${escapeHtml(listItem)}</li>`;
            continue;
        }

        // Regular paragraph
        if (!inParagraph) {
            html += '<p>';
            inParagraph = true;
        }
        html += escapeHtml(line) + ' ';
    }

    // Close any open tags
    if (inParagraph) {
        html += '</p>';
    }
    if (inList) {
        html += '</ul>';
    }

    return html || '<p>No content could be extracted from the PDF.</p>';
}

/**
 * Helper function to detect if a line is a header
 * @param {string} line - Current line
 * @param {Array} allLines - All lines in the document
 * @param {number} currentIndex - Current line index
 * @returns {boolean} True if line is a header
 */
function isHeader(line, allLines, currentIndex) {
    // Headers are usually shorter than regular text
    if (line.length > 100) return false;
    
    // Check if it's followed by a longer line (indicating content)
    if (currentIndex < allLines.length - 1) {
        const nextLine = allLines[currentIndex + 1].trim();
        if (nextLine.length > line.length * 2) return true;
    }
    
    // Common header patterns
    const headerPatterns = [
        /^[A-Z][A-Z\s]+$/, // ALL CAPS
        /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/, // Title Case
        /^\d+\.\s+[A-Z]/, // Numbered sections
        /^[IVX]+\.\s+[A-Z]/, // Roman numerals
        /^Chapter\s+\d+/i, // Chapter headers
        /^Section\s+\d+/i, // Section headers
    ];
    
    return headerPatterns.some(pattern => pattern.test(line));
}

/**
 * Helper function to determine header level
 * @param {string} line - Header line
 * @returns {number} Header level (1-3)
 */
function getHeaderLevel(line) {
    if (/^[A-Z][A-Z\s]+$/.test(line)) return 1; // ALL CAPS = H1
    if (/^\d+\.\s+[A-Z]/.test(line)) return 2; // Numbered = H2
    if (/^[IVX]+\.\s+[A-Z]/.test(line)) return 2; // Roman = H2
    if (/^Chapter\s+\d+/i.test(line)) return 1; // Chapter = H1
    if (/^Section\s+\d+/i.test(line)) return 2; // Section = H2
    return 3; // Default = H3
}

/**
 * Helper function to detect list items
 * @param {string} line - Line to check
 * @returns {boolean} True if line is a list item
 */
function isListItem(line) {
    const listPatterns = [
        /^[\s]*[•\-\*]\s+/, // Bullet points
        /^[\s]*\d+\.\s+/, // Numbered lists
        /^[\s]*[a-z]\.\s+/, // Lettered lists
    ];
    return listPatterns.some(pattern => pattern.test(line));
}

/**
 * Helper function to escape HTML
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

module.exports = {
    generatePDF,
    convertPDFToHTML
}; 