(function () {
  function createTooltip(link, message) {
    const tooltip = document.createElement('div');
    tooltip.className = 'shadcn-tooltip';
    tooltip.textContent = message;
    link.appendChild(tooltip);
  }

  function addModernHighlight(link, color) {
    link.classList.add('shadcn-highlight');
    link.style.setProperty('--highlight-color', color);
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generateSitemap') {
      const links = Array.from(document.querySelectorAll('a'));
      const sitemap = links.map((link, index) => {
        addModernHighlight(link, 'rgba(34, 197, 94, 0.2)'); // Light green highlight
        createTooltip(link, 'Sitemap Link');
        const title = link.innerText || link.textContent || 'undefined';
        const url = link.href;
        const id = `link-${btoa(url)}-${index}`; // Assign unique ID based on URL and index
        link.id = id;
        return { id, title, url };
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
          addModernHighlight(link, 'rgba(239, 68, 68, 0.2)'); // Light red highlight
          createTooltip(link, 'Broken Link');
          const title = (link.innerText || link.textContent || 'undefined')
            .replace(/Broken Link/g, '')
            .trim();
          const id = `link-${btoa(link.href || 'No href attribute')}-${index}`;
          link.id = id;
          return [{ id, title, url: link.href || 'No href attribute' }];
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
        element.scrollIntoView({ behavior: 'smooth' });
        element.classList.add('shadcn-pulse');
        setTimeout(() => element.classList.remove('shadcn-pulse'), 2000);
      }
    }
  });

  // Inject styles for modern UI elements
  const style = document.createElement('style');
  style.textContent = `
    .shadcn-highlight {
      position: relative;
      background-color: var(--highlight-color);
      border-radius: 4px;
      transition: all 0.3s ease;
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
      animation: shadcn-pulse-animation 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes shadcn-pulse-animation {
      0%, 100% { opacity: 1; }
      50% { opacity: .5; }
    }
  `;
  document.head.appendChild(style);
})();
