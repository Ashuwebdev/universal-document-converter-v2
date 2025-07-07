const fs = require('fs');
const path = require('path');
const multer = require('multer');

/**
 * Configure multer storage for file uploads
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
});

/**
 * File filter for multer
 * @param {Object} req - Express request object
 * @param {Object} file - Uploaded file object
 * @param {Function} cb - Callback function
 */
function fileFilter(req, file, cb) {
    const allowedTypes = [
        'text/html',
        'text/markdown',
        'text/x-markdown',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];
    
    const allowedExtensions = ['.html', '.htm', '.md', '.markdown', '.pdf', '.docx', '.doc'];
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const isAllowedType = allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension);
    
    if (isAllowedType) {
        cb(null, true);
    } else {
        cb(new Error(`File type not supported. Allowed types: ${allowedExtensions.join(', ')}`), false);
    }
}

/**
 * Configure multer upload
 */
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
    }
});

/**
 * Get file type based on extension
 * @param {string} filename - Filename to check
 * @returns {string} File type (html, markdown, pdf, word)
 */
function getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    
    switch (ext) {
        case '.html':
        case '.htm':
            return 'html';
        case '.md':
        case '.markdown':
            return 'markdown';
        case '.pdf':
            return 'pdf';
        case '.docx':
        case '.doc':
            return 'word';
        default:
            return 'unknown';
    }
}

/**
 * Validate file exists and is readable
 * @param {string} filePath - Path to file
 * @returns {boolean} True if file is valid
 */
function validateFile(filePath) {
    try {
        return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch (error) {
        console.error('File validation error:', error);
        return false;
    }
}

/**
 * Read file content
 * @param {string} filePath - Path to file
 * @returns {Promise<Buffer>} File content as buffer
 */
async function readFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * Write file content
 * @param {string} filePath - Path to file
 * @param {Buffer|string} content - Content to write
 * @returns {Promise<void>}
 */
async function writeFile(filePath, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, content, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Delete file
 * @param {string} filePath - Path to file
 * @returns {Promise<void>}
 */
async function deleteFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Clean up temporary files
 * @param {string[]} filePaths - Array of file paths to delete
 */
async function cleanupFiles(filePaths) {
    const deletePromises = filePaths.map(filePath => {
        return deleteFile(filePath).catch(err => {
            console.warn(`Failed to delete file ${filePath}:`, err.message);
        });
    });
    
    await Promise.all(deletePromises);
}

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @param {string} extension - File extension
 * @returns {string} Unique filename
 */
function generateUniqueFilename(originalName, extension) {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const name = path.basename(originalName, path.extname(originalName));
    return `${name}-${timestamp}-${random}${extension}`;
}

module.exports = {
    upload,
    getFileType,
    validateFile,
    readFile,
    writeFile,
    deleteFile,
    cleanupFiles,
    generateUniqueFilename
}; 