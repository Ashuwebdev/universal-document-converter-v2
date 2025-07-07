const { marked } = require('marked');

/**
 * Convert Markdown to HTML
 * @param {string} markdownContent - Markdown content to convert
 * @returns {string} HTML content
 */
function convertMarkdownToHTML(markdownContent) {
    try {
        // Configure marked options
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false
        });
        
        // Convert markdown to HTML
        const htmlContent = marked(markdownContent);
        
        // Wrap in a styled container
        const styledHTML = `
            <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
                ${htmlContent}
            </div>
        `;
        
        return styledHTML;
    } catch (error) {
        console.error('Markdown to HTML conversion error:', error);
        throw error;
    }
}

/**
 * Convert HTML to Markdown (basic implementation)
 * @param {string} htmlContent - HTML content to convert
 * @returns {string} Markdown content
 */
function convertHTMLToMarkdown(htmlContent) {
    try {
        // Remove HTML tags and convert to basic markdown
        let markdown = htmlContent
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
            .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
            .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
            .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
            .replace(/<ul[^>]*>|<\/ul>/gi, '')
            .replace(/<ol[^>]*>|<\/ol>/gi, '')
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
            .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
            .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .trim();
        
        return markdown;
    } catch (error) {
        console.error('HTML to Markdown conversion error:', error);
        throw error;
    }
}

module.exports = {
    convertMarkdownToHTML,
    convertHTMLToMarkdown
}; 