(function () {
  function createTooltip(link, message) {
    const tooltip = document.createElement('div');
    tooltip.className = 'shadcn-tooltip';
    tooltip.textContent = message;
    link.appendChild(tooltip);
  }

  function addModernHighlight(link, color, borderColor) {
    link.classList.add('shadcn-highlight');
    link.style.setProperty('--highlight-color', color);
    link.style.setProperty('--border-color', borderColor);
  }

  function categorizeLink(url) {
    if (
      url.includes('facebook.com') ||
      url.includes('twitter.com') ||
      url.includes('instagram.com') ||
      url.includes('linkedin.com')
    ) {
      return 'Social Media';
    } else if (url.startsWith(window.location.origin)) {
      return 'Internal';
    } else if (url.startsWith('mailto:')) {
      return 'Email';
    } else if (
      url.endsWith('.pdf') ||
      url.endsWith('.doc') ||
      url.endsWith('.docx') ||
      url.endsWith('.xls') ||
      url.endsWith('.xlsx')
    ) {
      return 'Document';
    } else {
      return 'External';
    }
  }

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

  function clearHighlights() {
    document.querySelectorAll('.shadcn-highlight').forEach((el) => {
      el.classList.remove('shadcn-highlight');
      el.style.removeProperty('--highlight-color');
      el.style.removeProperty('--border-color');
      el.querySelector('.shadcn-tooltip')?.remove();
    });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    clearHighlights(); // Clear highlights before each action

    if (request.action === 'generateSitemap') {
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
      const element = document.getElementById(request.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlightElement(element);
      }
    }

    sendResponse();
    return true;
  });

  function highlightElement(element) {
    clearHighlights();
    element.classList.add('shadcn-highlight', 'shadcn-pulse');
    element.style.setProperty('--highlight-color', 'rgba(59, 130, 246, 0.3)');
    element.style.setProperty('--pulse-color', 'rgba(59, 130, 246, 0.8)');

    setTimeout(() => {
      element.classList.remove('shadcn-pulse');
    }, 3000);
  }

  const style = document.createElement('style');
  style.textContent = `
    .shadcn-highlight {
      position: relative;
      background-color: var(--highlight-color);
      border-radius: 4px;
      transition: all 0.3s ease;
      box-shadow: 0 0 0 2px var(--border-color, var(--pulse-color));
    }
    .shadcn-highlight:hover {
      filter: brightness(1.1);
    }
    .shadcn-tooltip {
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
    .shadcn-highlight:hover .shadcn-tooltip {
      opacity: 1;
    }
    .shadcn-pulse {
      animation: shadcn-pulse-animation 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes shadcn-pulse-animation {
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
