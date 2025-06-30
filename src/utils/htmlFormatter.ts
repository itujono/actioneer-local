/**
 * HTML Formatter Utility
 *
 * Provides utilities for cleaning up and formatting HTML content,
 * particularly for email content that may have UTF-8 encoding issues.
 */

// Removed 'he' dependency - not needed for UTF-8 byte corruption handling

export interface HtmlFormatterOptions {
  /** Whether to fix common UTF-8 encoding issues */
  fixEncoding?: boolean;
  /** Whether to add responsive styling to images */
  enhanceImages?: boolean;
  /** Whether to make external links open in new tabs */
  secureLinks?: boolean;
  /** Whether to add lazy loading to images */
  lazyLoadImages?: boolean;
  /** Custom CSS classes to add to images */
  imageClasses?: string;
}

const DEFAULT_OPTIONS: HtmlFormatterOptions = {
  fixEncoding: true,
  enhanceImages: true,
  secureLinks: true,
  lazyLoadImages: true,
  imageClasses: "max-w-full h-auto rounded-lg shadow-sm",
};

/**
 * Preserves whitespace and line breaks in plain text content
 */
export function preserveWhitespace(html: string): string {
  // If the content appears to be plain text (no HTML tags), wrap in <pre> with white-space: pre-wrap
  if (!/<[^>]+>/.test(html)) {
    return `<div style="white-space: pre-wrap; word-wrap: break-word;">${html}</div>`;
  }
  return html;
}

/**
 * Fixes common UTF-8 encoding issues found in email content
 * Handles both HTML entities and byte-level UTF-8 corruption
 */
export function fixUtf8Encoding(html: string): string {
  // Step 1: Start with the input HTML (no HTML entity decoding needed)
  let decodedHtml = html;

  // Step 2: Handle specific UTF-8 byte corruption patterns
  // The â¢ sequence is UTF-8 bullet (•) misinterpreted as Latin-1
  decodedHtml = decodedHtml
    // Handle the specific UTF-8 byte sequence [226, 128, 162] we detected
    .replace(new RegExp(String.fromCharCode(226, 128, 162), "g"), "•")
    // Primary bullet corruption patterns (most common first)
    .replace(/â¢/g, "•") // The exact sequence we're seeing
    .replace(/â€¢/g, "•") // Three character corruption
    .replace(/â•/g, "•") // Partially fixed sequence

    // Handle other common UTF-8 corruptions
    .replace(/â€"/g, "—") // em dash
    .replace(/â€"/g, "–") // en dash
    .replace(/â€™/g, "'") // right single quote
    .replace(/â€œ/g, '"') // left double quote
    .replace(/â€/g, '"') // right double quote
    .replace(/â€˜/g, "'") // left single quote
    .replace(/â€¦/g, "…") // ellipsis
    .replace(/â€º/g, "›") // single right-pointing angle quotation mark
    .replace(/âˆ™/g, "•") // bullet operator
    .replace(/Â©/g, "©") // copyright
    .replace(/Â®/g, "®") // registered trademark
    .replace(/â„¢/g, "™") // trademark
    .replace(/Â/g, ""); // stray Â characters

  // Step 3: Normalize whitespace and remove invisible characters
  let result = decodedHtml
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width spaces
    .replace(/\u00A0/g, " ") // Replace non-breaking spaces with regular spaces

    // Handle proper Unicode sequences that might still be there
    .replace(/\u2022/g, "•") // direct Unicode bullet
    .replace(/\u00e2\u0082\u00a2/g, "•") // proper UTF-8 bullet bytes
    .replace(/\u00e2\u00a2/g, "•") // corrupted 2-byte sequence

    // Fix missing spaces around punctuation
    .replace(/([.!?])([A-Z])/g, "$1 $2")
    .replace(/:([A-Z])/g, ": $1")
    .replace(/!([A-Z])/g, "! $1");

  return result;
}

/**
 * Enhances images with responsive styling and loading attributes
 */
export function enhanceImages(html: string, options: HtmlFormatterOptions = {}): string {
  const { imageClasses, lazyLoadImages } = { ...DEFAULT_OPTIONS, ...options };

  const styleAttr = `style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;"`;
  const classAttr = imageClasses ? `class="${imageClasses}"` : "";
  const loadingAttr = lazyLoadImages ? 'loading="lazy"' : "";

  return html.replace(/<img([^>]+)>/gi, `<img$1 ${styleAttr} ${classAttr} ${loadingAttr}>`);
}

/**
 * Makes external links secure by adding target="_blank" and rel attributes
 */
export function secureExternalLinks(html: string): string {
  return html.replace(/<a([^>]+href="http[^"]+")([^>]*)>/gi, '<a$1$2 target="_blank" rel="noopener noreferrer">');
}

/**
 * Comprehensive HTML formatter for email content
 *
 * @param html - Raw HTML content to format
 * @param options - Formatting options
 * @returns Formatted and cleaned HTML string
 */
export function formatEmailHtml(html: string, options: HtmlFormatterOptions = {}): string {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let formattedHtml = html;

  // Always preserve whitespace first
  formattedHtml = preserveWhitespace(formattedHtml);

  if (config.fixEncoding) {
    formattedHtml = fixUtf8Encoding(formattedHtml);
  }

  if (config.enhanceImages) {
    formattedHtml = enhanceImages(formattedHtml, config);
  }

  if (config.secureLinks) {
    formattedHtml = secureExternalLinks(formattedHtml);
  }

  return formattedHtml;
}

/**
 * Tailwind CSS classes for prose styling
 * Designed to work with @tailwindcss/typography plugin
 */
export const EMAIL_PROSE_CLASSES = [
  "prose",
  "prose-sm",
  "max-w-none",
  "prose-headings:text-thunder",
  "prose-strong:text-thunder",
  "prose-em:text-thunder",
  "prose-a:text-heliotrope",
  "prose-a:no-underline",
  "hover:prose-a:underline",
  "prose-ul:text-thunder",
  "prose-ol:text-thunder",
  "prose-li:text-thunder",
  "prose-img:rounded-lg",
  "prose-img:shadow-sm",
  "prose-img:max-w-full",
  "prose-img:h-auto",
  // Handle our whitespace-preserved divs
  "prose-p:whitespace-pre-wrap",
  "[&_div]:whitespace-pre-wrap",
].join(" ");

/**
 * Safe HTML renderer props for React dangerouslySetInnerHTML
 *
 * @param html - HTML content to format
 * @param options - Formatting options
 * @returns Object ready to spread into dangerouslySetInnerHTML prop
 */
export function createSafeHtmlProps(html: string, options?: HtmlFormatterOptions) {
  // Clean HTML formatting without debug logs
  const formattedHtml = formatEmailHtml(html, options);

  return {
    dangerouslySetInnerHTML: {
      __html: formattedHtml,
    },
  };
}
