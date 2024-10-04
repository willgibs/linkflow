(function () {
  // Function to create a tooltip for a link
  function createTooltip(link, message) {
    const tooltip = document.createElement('div');
    tooltip.className = 'linkflow-tooltip';
    tooltip.textContent = message;
    link.appendChild(tooltip);
  }

  // Function to add a modern highlight style to a link
  function addModernHighlight(link, color, borderColor) {
    link.classList.add('linkflow-highlight');
    link.style.setProperty('--highlight-color', color);
    link.style.setProperty('--border-color', borderColor);
  }

  // Function to categorize a link based on its URL
  function categorizeLink(url) {
    // Convert URL to lowercase for case-insensitive matching
    const lowercaseUrl = url.toLowerCase();
    const currentHostname = window.location.hostname.toLowerCase();

    // Extract hostname from the link URL
    let linkHostname;
    try {
      linkHostname = new URL(lowercaseUrl).hostname;
    } catch (e) {
      // If URL parsing fails, consider it as external
      return 'External';
    }

    // Check if the link is internal
    if (linkHostname === currentHostname) {
      return 'Internal';
    }

    // Check if the link is a contact link (email, phone, social share, etc.)
    if (
      lowercaseUrl.startsWith('mailto:') ||
      lowercaseUrl.startsWith('tel:') ||
      lowercaseUrl.startsWith('sms:') ||
      /^(skype|whatsapp|telegram|viber):/.test(lowercaseUrl) ||
      lowercaseUrl.includes('twitter.com/intent/tweet') ||
      lowercaseUrl.includes('facebook.com/sharer') ||
      lowercaseUrl.includes('linkedin.com/shareArticle') ||
      lowercaseUrl.includes('t.me/')
    ) {
      return 'Contact';
    }

    // Check if the link is to a social media platform
    const socialMediaPlatforms = [
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'linkedin.com',
      'youtube.com',
      'pinterest.com',
      'tiktok.com',
      'snapchat.com',
      'reddit.com',
      'tumblr.com',
      'whatsapp.com',
      'telegram.org',
      'medium.com',
      'quora.com',
      'flickr.com',
      'vimeo.com',
    ];
    if (
      socialMediaPlatforms.some((platform) => linkHostname.includes(platform))
    ) {
      return 'Social Media';
    }

    // Check if the link is to a document
    const documentExtensions = [
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'txt',
      'rtf',
      'odt',
      'ods',
      'odp',
    ];
    if (documentExtensions.some((ext) => lowercaseUrl.endsWith(`.${ext}`))) {
      return 'Document';
    }

    // Check if the link is to a media file
    const mediaExtensions = [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'bmp',
      'svg',
      'webp',
      'mp3',
      'wav',
      'ogg',
      'mp4',
      'webm',
      'avi',
      'mov',
      'wmv',
      'flv',
    ];
    if (
      lowercaseUrl.includes('/media/') ||
      mediaExtensions.some((ext) => lowercaseUrl.endsWith(`.${ext}`)) ||
      lowercaseUrl.includes('youtube.com/watch') ||
      lowercaseUrl.includes('vimeo.com/')
    ) {
      return 'Media';
    }

    // Check if the link is a download link
    const downloadExtensions = [
      'zip',
      'rar',
      'tar',
      'gz',
      '7z',
      'exe',
      'dmg',
      'apk',
      'iso',
    ];
    if (
      lowercaseUrl.includes('/download/') ||
      downloadExtensions.some((ext) => lowercaseUrl.endsWith(`.${ext}`)) ||
      lowercaseUrl.includes('download=') ||
      lowercaseUrl.includes('dl=')
    ) {
      return 'Download';
    }

    // If none of the above conditions are met, consider it as an external link
    return 'External';
  }

  // Function to extract the title of a link
  function extractLinkTitle(link) {
    // Get only the direct text content of the link, excluding child elements
    let title = Array.from(link.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.trim())
      .join(' ')
      .trim();

    // If there's no text content, use the URL
    if (!title) {
      title = link.href;
    }

    // Limit the length of the title
    const maxLength = 100;
    if (title.length > maxLength) {
      title = title.substring(0, maxLength) + '...';
    }

    return title;
  }

  // Function to clear all highlights from the page
  function clearHighlights() {
    document.querySelectorAll('.linkflow-highlight').forEach((el) => {
      el.classList.remove('linkflow-highlight');
      el.style.removeProperty('--highlight-color');
      el.style.removeProperty('--border-color');
      el.querySelector('.linkflow-tooltip')?.remove();
    });
  }

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    clearHighlights(); // Clear highlights before each action

    if (request.action === 'generateSitemap') {
      // Generate sitemap of all links on the page
      const links = Array.from(document.querySelectorAll('a'));
      const sitemap = links.map((link, index) => {
        addModernHighlight(
          link,
          'rgba(34, 197, 94, 0.2)',
          'rgba(34, 197, 94, 0.8)'
        ); // Light green highlight with darker border
        createTooltip(link, 'Sitemap Link');
        const title = extractLinkTitle(link);
        const url = link.href;
        const id = `link-${btoa(url)}-${index}`; // Assign unique ID based on URL and index
        link.id = id;
        const category = categorizeLink(url);
        return { id, title, url, category };
      });

      chrome.runtime.sendMessage({
        action: 'sitemapGenerated',
        sitemapData: sitemap,
      });
    } else if (request.action === 'scanLinks') {
      // Scan for empty or potentially broken links
      const links = Array.from(document.querySelectorAll('a'));
      const homeURL = new URL(window.location.href);

      const brokenLinks = links.flatMap((link, index) => {
        const urlObject = new URL(link.href, homeURL);
        const isSameBaseURL = urlObject.origin === homeURL.origin;
        const isHomePageLink = urlObject.pathname === '/' && !urlObject.hash;
        const isEmptyHashLink =
          urlObject.hash === '#' && urlObject.hash.slice(1).length === 0;

        if (
          isSameBaseURL &&
          (!link.href || isHomePageLink || isEmptyHashLink)
        ) {
          addModernHighlight(
            link,
            'rgba(239, 68, 68, 0.2)',
            'rgba(239, 68, 68, 0.8)'
          ); // Light red highlight with darker border
          createTooltip(link, 'Broken Link');
          const title = extractLinkTitle(link);
          const id = `link-${btoa(link.href || 'No href attribute')}-${index}`;
          link.id = id;
          const category = categorizeLink(link.href || '');
          return [
            { id, title, url: link.href || 'No href attribute', category },
          ];
        } else {
          return [];
        }
      });

      chrome.runtime.sendMessage({
        action: 'scannedLinksGenerated',
        sitemapData: brokenLinks,
      });
    } else if (request.action === 'scrollIntoView') {
      // Scroll to and highlight a specific link
      const element = document.getElementById(request.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlightElement(element);
      }
    } else if (request.action === 'identifyUniqueLinks') {
      // Identify and highlight unique links on the page
      const links = Array.from(document.querySelectorAll('a'));
      const uniqueLinks = new Map();

      links.forEach((link, index) => {
        const url = link.href;
        if (!uniqueLinks.has(url)) {
          const id = `link-${btoa(url)}-${index}`;
          link.id = id;
          const title = extractLinkTitle(link);
          uniqueLinks.set(url, {
            id,
            title,
            url,
            category: categorizeLink(url),
          });
          addModernHighlight(
            link,
            'rgba(147, 51, 234, 0.2)',
            'rgba(147, 51, 234, 0.8)'
          ); // Light purple highlight
          createTooltip(link, 'Unique Link');
        }
      });

      chrome.runtime.sendMessage({
        action: 'uniqueLinksGenerated',
        sitemapData: Array.from(uniqueLinks.values()),
      });
    }

    sendResponse();
    return true;
  });

  // Function to highlight a specific element
  function highlightElement(element) {
    clearHighlights();
    element.classList.add('linkflow-highlight', 'linkflow-pulse');
    element.style.setProperty('--highlight-color', 'rgba(59, 130, 246, 0.3)');
    element.style.setProperty('--pulse-color', 'rgba(59, 130, 246, 0.8)');

    setTimeout(() => {
      element.classList.remove('linkflow-pulse');
    }, 3000);
  }

  // Add styles for highlights and tooltips
  const style = document.createElement('style');
  style.textContent = `
    .linkflow-highlight {
      position: relative;
      background-color: var(--highlight-color);
      border-radius: 4px;
      transition: all 0.3s ease;
      box-shadow: 0 0 0 2px var(--border-color, var(--pulse-color));
    }
    .linkflow-highlight:hover {
      filter: brightness(1.1);
    }
    .linkflow-tooltip {
      position: absolute;
      background-color: #1f2937;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      white-space: nowrap;
    }
    .linkflow-highlight:hover .linkflow-tooltip {
      opacity: 1;
    }
    .linkflow-pulse {
      animation: linkflow-pulse-animation 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes linkflow-pulse-animation {
      0%, 100% {
        box-shadow: 0 0 0 2px var(--pulse-color);
        background-color: var(--highlight-color);
      }
      50% {
        box-shadow: 0 0 0 6px var(--pulse-color);
        background-color: var(--pulse-color);
      }
    }
  `;
  document.head.appendChild(style);
})();
