// Universal Document Converter - Complete Original JavaScript

// Global variables
let currentFile = null;
let currentFileType = null;
let convertedData = null;
let convertedFilename = null;
let convertedType = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupDragAndDrop();
    setupMarkdownPreview();
    setupEditorResize();
});

// Tab switching functionality
function switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

// Rich text editor formatting functions
function formatText(command, value = null) {
    document.execCommand(command, false, value);
    document.getElementById('htmlEditor').focus();
}

// Insert table function
function insertTable() {
    const rows = prompt('Enter number of rows:', '3');
    const cols = prompt('Enter number of columns:', '3');
    
    if (rows && cols) {
        let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%;">';
        
        for (let i = 0; i < rows; i++) {
            tableHTML += '<tr>';
            for (let j = 0; j < cols; j++) {
                if (i === 0) {
                    tableHTML += '<th style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;">Header ' + (j + 1) + '</th>';
                } else {
                    tableHTML += '<td style="padding: 8px; border: 1px solid #ddd;">Cell ' + (i + 1) + '-' + (j + 1) + '</td>';
                }
            }
            tableHTML += '</tr>';
        }
        tableHTML += '</table>';
        
        document.execCommand('insertHTML', false, tableHTML);
        document.getElementById('htmlEditor').focus();
    }
}

// Insert image function
function insertImage() {
    const imageUrl = prompt('Enter image URL:', 'https://via.placeholder.com/300x200');
    if (imageUrl) {
        const imgHTML = '<img src="' + imageUrl + '" style="max-width: 100%; height: auto; margin: 10px 0;">';
        document.execCommand('insertHTML', false, imgHTML);
        document.getElementById('htmlEditor').focus();
    }
}

// Insert markdown sample
function insertMarkdownSample() {
    const sampleMarkdown = `# Sample Markdown Document

## Features

This is a **sample markdown** document that demonstrates various *formatting options*.

### Lists

- Item 1
- Item 2
- Item 3

### Code

\`\`\`javascript
function hello() {
    console.log("Hello, World!");
}
\`\`\`

### Links

[Visit our website](https://example.com)

### Images

![Sample Image](https://via.placeholder.com/300x200)

> This is a blockquote

---

**Bold text** and *italic text* are supported.`;
    
    document.getElementById('markdownEditor').value = sampleMarkdown;
    updateMarkdownPreview();
}

// Markdown preview functionality
function setupMarkdownPreview() {
    const markdownEditor = document.getElementById('markdownEditor');
    if (markdownEditor) {
        markdownEditor.addEventListener('input', updateMarkdownPreview);
    }
}

function updateMarkdownPreview() {
    const markdownContent = document.getElementById('markdownEditor').value;
    const preview = document.getElementById('markdownPreview');
    
    if (preview && markdownContent) {
        // Simple markdown to HTML conversion
        let htmlContent = markdownContent
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">')
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.+)$/gm, '<p>$1</p>');
        
        preview.innerHTML = htmlContent;
    }
}

// Drag and drop functionality
function setupDragAndDrop() {
    const body = document.body;
    
    body.addEventListener('dragover', function(e) {
        e.preventDefault();
        body.classList.add('drag-over');
    });
    
    body.addEventListener('dragleave', function(e) {
        e.preventDefault();
        if (e.target === body) {
            body.classList.remove('drag-over');
        }
    });
    
    body.addEventListener('drop', function(e) {
        e.preventDefault();
        body.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileDrop(files[0]);
        }
    });
}

function handleFileDrop(file) {
    const fileType = getFileType(file.name);
    
    if (fileType === 'image') {
        handleImageUpload({ target: { files: [file] } });
    } else {
        handleUnifiedFileUpload({ target: { files: [file] } });
    }
}

function getFileType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        return 'image';
    } else if (['html', 'htm'].includes(ext)) {
        return 'html';
    } else if (['md', 'markdown'].includes(ext)) {
        return 'markdown';
    } else if (ext === 'pdf') {
        return 'pdf';
    }
    return 'unknown';
}

// Unified file upload handling
function handleUnifiedFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileType = getFileType(file.name);
    currentFile = file;
    currentFileType = fileType;
    
    // Update file display
    updateFileDisplay(file.name, fileType);
    
    // Handle different file types
    if (fileType === 'html') {
        handleHtmlFile(file);
    } else if (fileType === 'markdown') {
        handleMarkdownFile(file);
    } else if (fileType === 'pdf') {
        handlePdfFile(file);
    } else {
        showError('Unsupported file type');
    }
}

function updateFileDisplay(filename, fileType) {
    const display = document.getElementById('currentFileDisplay');
    const fileNameSpan = document.getElementById('currentFileName');
    const fileTypeSpan = document.getElementById('currentFileType');
    
    if (display && fileNameSpan && fileTypeSpan) {
        fileNameSpan.textContent = filename;
        fileTypeSpan.textContent = fileType.toUpperCase();
        fileTypeSpan.className = 'file-type-indicator file-type-' + fileType;
        display.classList.remove('hidden');
    }
}

function handleHtmlFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('htmlEditor').innerHTML = e.target.result;
        switchTab('editor');
        showSuccess('HTML file loaded successfully!');
    };
    reader.readAsText(file);
}

function handleMarkdownFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('markdownEditor').value = e.target.result;
        updateMarkdownPreview();
        switchTab('markdown');
        showSuccess('Markdown file loaded successfully!');
    };
    reader.readAsText(file);
}

function handlePdfFile(file) {
    showLoading('Converting PDF to HTML...');
    
    const formData = new FormData();
    formData.append('file', file);
    
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.error) {
            showError(data.error);
        } else {
            document.getElementById('htmlEditor').innerHTML = data.content;
            switchTab('editor');
            showSuccess('PDF converted to HTML successfully!');
        }
    })
    .catch(error => {
        hideLoading();
        showError('Error converting PDF: ' + error.message);
    });
}

// Image upload and resizing functionality
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showError('Please select an image file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.getElementById('previewImage');
        const info = document.getElementById('imageInfo');
        const preview = document.getElementById('imagePreview');
        const resizeOptions = document.getElementById('resizeOptions');
        
        img.src = e.target.result;
        img.onload = function() {
            info.textContent = `Original size: ${img.naturalWidth} × ${img.naturalHeight} pixels`;
            document.getElementById('newWidth').value = img.naturalWidth;
            document.getElementById('newHeight').value = img.naturalHeight;
        };
        
        preview.style.display = 'block';
        resizeOptions.style.display = 'block';
        
        // Store the file for resizing
        window.currentImageFile = file;
    };
    reader.readAsDataURL(file);
}

function resizeImage() {
    const width = parseInt(document.getElementById('newWidth').value);
    const height = parseInt(document.getElementById('newHeight').value);
    const quality = parseInt(document.getElementById('quality').value);
    const format = document.getElementById('format').value;
    
    if (!width || !height || !quality) {
        showError('Please fill in all fields');
        return;
    }
    
    if (!window.currentImageFile) {
        showError('No image selected');
        return;
    }
    
    showLoading('Resizing image...');
    
    const formData = new FormData();
    formData.append('image', window.currentImageFile);
    formData.append('width', width);
    formData.append('height', height);
    formData.append('quality', quality);
    formData.append('format', format);
    
    fetch('/api/resize-image', {
        method: 'POST',
        body: formData
    })
    .then(response => response.blob())
    .then(blob => {
        hideLoading();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resized-image.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccess('Image resized and downloaded successfully!');
    })
    .catch(error => {
        hideLoading();
        showError('Error resizing image: ' + error.message);
    });
}

// Editor resize functionality
function setupEditorResize() {
    const editorContainer = document.querySelector('.editor-container');
    if (editorContainer) {
        let isResizing = false;
        let startY = 0;
        let startHeight = 0;
        
        editorContainer.addEventListener('mousedown', function(e) {
            const rect = editorContainer.getBoundingClientRect();
            const bottom = rect.bottom;
            
            if (e.clientY >= bottom - 10 && e.clientY <= bottom + 10) {
                isResizing = true;
                startY = e.clientY;
                startHeight = editorContainer.offsetHeight;
                document.body.style.cursor = 'ns-resize';
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            
            const deltaY = e.clientY - startY;
            const newHeight = Math.max(200, startHeight + deltaY);
            
            editorContainer.style.height = newHeight + 'px';
            const htmlEditor = document.getElementById('htmlEditor');
            if (htmlEditor) {
                htmlEditor.style.height = (newHeight - 4) + 'px';
            }
        });
        
        document.addEventListener('mouseup', function() {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
            }
        });
    }
}

// Conversion functions
function convertToPDF() {
    const content = document.getElementById('htmlEditor').innerHTML;
    if (!content.trim()) {
        showError('Please enter some content to convert');
        return;
    }
    
    performConversion('html', 'pdf', content, 'converted-document.pdf');
}

function convertToWord(sourceType) {
    let content;
    if (sourceType === 'html') {
        content = document.getElementById('htmlEditor').innerHTML;
    } else {
        content = document.getElementById('markdownEditor').value;
    }
    
    if (!content.trim()) {
        showError('Please enter some content to convert');
        return;
    }
    
    performConversion(sourceType, 'word', content, 'converted-document.docx');
}

function convertToHtml() {
    const content = document.getElementById('htmlEditor').innerHTML;
    if (!content.trim()) {
        showError('Please enter some content to convert');
        return;
    }
    
    // Create download link for HTML
    const blob = new Blob([content], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-document.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showSuccess('HTML file downloaded successfully!');
}

function convertMarkdown(targetType) {
    const content = document.getElementById('markdownEditor').value;
    if (!content.trim()) {
        showError('Please enter some markdown content');
        return;
    }
    
    if (targetType === 'pdf') {
        performConversion('markdown', 'pdf', content, 'converted-document.pdf');
    } else if (targetType === 'html') {
        performConversion('markdown', 'html', content, 'converted-document.html');
    }
}

function performConversion(sourceType, targetType, content, filename) {
    showLoading('Converting document...');
    lockDimensions();
    
    fetch('/api/convert', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: content,
            sourceType: sourceType,
            targetType: targetType,
            filename: filename
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        hideLoading();
        unlockDimensions();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccess('Document converted and downloaded successfully!');
    })
    .catch(error => {
        hideLoading();
        unlockDimensions();
        showError('Conversion failed: ' + error.message);
    });
}

// Save functions
function saveToHtml() {
    const content = document.getElementById('htmlEditor').innerHTML;
    if (!content.trim()) {
        showError('Please enter some content to save');
        return;
    }
    
    const blob = new Blob([content], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showSuccess('HTML file saved successfully!');
}

function saveToPdf() {
    const content = document.getElementById('htmlEditor').innerHTML;
    if (!content.trim()) {
        showError('Please enter some content to save');
        return;
    }
    
    performConversion('html', 'pdf', content, 'document.pdf');
}

// Progress bar test function
function testProgressBar() {
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Starting...';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        progressFill.style.width = progress + '%';
        progressText.textContent = `Processing... ${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                progressContainer.style.display = 'none';
                showSuccess('Progress bar test completed!');
            }, 500);
        }
    }, 200);
}

// Utility functions
function showLoading(message = 'Processing...') {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.style.display = 'block';
        const text = loading.querySelector('p');
        if (text) text.textContent = message;
    }
}

function hideLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

function showSuccess(message) {
    const alert = document.getElementById('successAlert');
    if (alert) {
        alert.textContent = message;
        alert.style.display = 'block';
        setTimeout(() => alert.style.display = 'none', 5000);
    }
}

function showError(message) {
    const alert = document.getElementById('errorAlert');
    if (alert) {
        alert.textContent = message;
        alert.style.display = 'block';
        setTimeout(() => alert.style.display = 'none', 5000);
    }
}

// PDF Processing Functions (keeping the original fixes)
function lockDimensions() {
    document.body.classList.add('pdf-processing');
    const container = document.querySelector('.container');
    const mainContent = document.querySelector('.main-content');
    const editorContainer = document.querySelector('.editor-container');
    const htmlEditor = document.getElementById('htmlEditor');
    const unifiedUploadArea = document.querySelector('.unified-upload-area');
    const conversionButtons = document.querySelector('.conversion-buttons');
    const editorToolbar = document.querySelector('.editor-toolbar');
    const tabs = document.querySelector('.tabs');
    
    if (container) container.classList.add('pdf-processing');
    if (mainContent) mainContent.classList.add('pdf-processing');
    if (editorContainer) editorContainer.classList.add('pdf-processing');
    if (htmlEditor) htmlEditor.classList.add('pdf-processing');
    if (unifiedUploadArea) unifiedUploadArea.classList.add('pdf-processing');
    if (conversionButtons) conversionButtons.classList.add('pdf-processing');
    if (editorToolbar) editorToolbar.classList.add('pdf-processing');
    if (tabs) tabs.classList.add('pdf-processing');
}

function unlockDimensions() {
    document.body.classList.remove('pdf-processing');
    const container = document.querySelector('.container');
    const mainContent = document.querySelector('.main-content');
    const editorContainer = document.querySelector('.editor-container');
    const htmlEditor = document.getElementById('htmlEditor');
    const unifiedUploadArea = document.querySelector('.unified-upload-area');
    const conversionButtons = document.querySelector('.conversion-buttons');
    const editorToolbar = document.querySelector('.editor-toolbar');
    const tabs = document.querySelector('.tabs');
    
    if (container) container.classList.remove('pdf-processing');
    if (mainContent) mainContent.classList.remove('pdf-processing');
    if (editorContainer) editorContainer.classList.remove('pdf-processing');
    if (htmlEditor) htmlEditor.classList.remove('pdf-processing');
    if (unifiedUploadArea) unifiedUploadArea.classList.remove('pdf-processing');
    if (conversionButtons) conversionButtons.classList.remove('pdf-processing');
    if (editorToolbar) editorToolbar.classList.remove('pdf-processing');
    if (tabs) tabs.classList.remove('pdf-processing');
} 