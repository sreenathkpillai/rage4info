/**
 * Utility function to process HTML content and ensure all links open in new tabs
 * @param html - The HTML string to process
 * @returns The processed HTML string with target="_blank" and rel="noopener noreferrer" added to all links
 */
export const processLinks = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return html;
  }

  // Replace all <a> tags that don't already have target="_blank"
  // This regex looks for <a tags and captures the href attribute and any existing attributes
  return html.replace(/<a\s+([^>]*?)href=/gi, (_, attributes) => {
    // Check if target attribute already exists
    const hasTarget = /target\s*=\s*["'][^"']*["']/i.test(attributes);
    const hasRel = /rel\s*=\s*["'][^"']*["']/i.test(attributes);

    let result = '<a ';

    // Add target="_blank" if not present
    if (!hasTarget) {
      result += 'target="_blank" ';
    }

    // Add rel="noopener noreferrer" if not present (for security)
    if (!hasRel) {
      result += 'rel="noopener noreferrer" ';
    }

    // Add the original attributes
    result += attributes + 'href=';

    return result;
  });
};

/**
 * Alternative implementation that handles edge cases more robustly
 * Uses DOM parsing approach for more reliable HTML manipulation
 */
export const processLinksDOM = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return html;
  }

  try {
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Find all anchor tags
    const links = tempDiv.querySelectorAll('a[href]');

    links.forEach(link => {
      // Set target to _blank
      link.setAttribute('target', '_blank');

      // Set rel for security (prevents window.opener access)
      const existingRel = link.getAttribute('rel');
      const newRel = existingRel ? `${existingRel} noopener noreferrer` : 'noopener noreferrer';
      link.setAttribute('rel', newRel);
    });

    return tempDiv.innerHTML;
  } catch (error) {
    console.warn('Failed to process links with DOM approach, falling back to regex:', error);
    return processLinks(html);
  }
};

/**
 * Convert plain URLs in text to clickable HTML links
 * @param text - Plain text that may contain URLs
 * @returns HTML string with URLs converted to anchor tags
 */
export const convertUrlsToLinks = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // First handle markdown-style links [text](url)
  let processedText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
    // Ensure the URL has a protocol
    const finalUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
    return `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
  });

  // Then convert plain URLs to clickable links
  // This regex matches http/https URLs that are not already in href attributes
  // We allow > (end of HTML tag) but exclude "' and = to avoid matching href="url"
  const urlRegex = /(^|[^"'=])(https?:\/\/[^\s<,;)\]]+)/gi;

  processedText = processedText.replace(urlRegex, (match, prefix, url) => {
    // Don't convert URLs that are already inside href attributes
    // Check if prefix suggests we're in an href (preceded by = or quotes)
    if (prefix === '=' || prefix === '"' || prefix === "'") {
      return match;
    }

    return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" style="cursor:pointer">${url}</a>`;
  });

  return processedText;
};

/**
 * Process both plain text URLs and existing HTML links
 * @param content - Content that may contain plain URLs, markdown links, or HTML
 * @returns Processed HTML with all links properly configured
 */
export const processAllLinks = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return content;
  }

  // First convert plain URLs and markdown links to HTML
  const withConvertedUrls = convertUrlsToLinks(content);

  // Then process any existing HTML links to ensure they have proper attributes
  return processLinksWithFallback(withConvertedUrls);
};

/**
 * Process links in HTML content with fallback support
 * Uses DOM approach when available, falls back to regex for server-side rendering
 */
export const processLinksWithFallback = (html: string): string => {
  // Check if we're in a browser environment
  if (typeof document !== 'undefined') {
    return processLinksDOM(html);
  }

  // Fallback to regex approach for server-side rendering
  return processLinks(html);
};