class LinkScanner {
  constructor() {
    this.setupMessageListener();
    this.addStyles();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'scanAllLinks':
          this.clearHighlights();
          this.highlightAllLinks();
          break;
        case 'scanEmptyLinks':
          this.clearHighlights();
          this.highlightEmptyLinks();
          break;
        case 'scanUniqueLinks':
          this.clearHighlights();
          this.highlightUniqueLinks();
          break;
        case 'highlightSpecificLink':
          this.highlightSpecificLink(request.linkId);
          break;
      }
      sendResponse(true);
      return true;
    });
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .linkflow-highlight {
        background-color: var(--highlight-color, rgba(34, 197, 94, 0.2)) !important;
        outline: 2px solid var(--outline-color, rgba(34, 197, 94, 0.8)) !important;
        border-radius: 4px !important;
        transition: all 0.3s ease !important;
        color: white !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
      }
      
      .linkflow-highlight * {
        color: white !important;
      }
      
      .linkflow-highlight:hover {
        filter: brightness(1.1);
      }
      
      .linkflow-highlight-pulse {
        animation: linkflowPulse 1s ease-out;
      }
      
      @keyframes linkflowPulse {
        0% {
          transform: scale(1);
          box-shadow: 0 0 0 0 var(--outline-color);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 0 0 10px transparent;
        }
        100% {
          transform: scale(1);
          box-shadow: 0 0 0 0 transparent;
        }
      }
    `;
    document.head.appendChild(style);
  }

  clearHighlights() {
    document.querySelectorAll('.linkflow-highlight').forEach((el) => {
      el.classList.remove('linkflow-highlight');
      el.style.removeProperty('--highlight-color');
      el.style.removeProperty('--outline-color');
    });
  }

  highlightElement(element, highlightColor, outlineColor) {
    element.classList.add('linkflow-highlight');
    element.style.setProperty('--highlight-color', highlightColor);
    element.style.setProperty('--outline-color', outlineColor);
  }

  highlightAllLinks() {
    const links = document.querySelectorAll('a');
    const hrefs = [];

    links.forEach((link, index) => {
      const linkId = `linkflow-${Date.now()}-${index}`;
      link.dataset.linkflowId = linkId;
      this.highlightElement(
        link,
        'rgba(34, 197, 94, 0.2)',
        'rgba(34, 197, 94, 0.8)'
      );
      hrefs.push({ href: link.href, id: linkId });
    });

    chrome.runtime.sendMessage({
      action: 'scanComplete',
      count: links.length,
      type: 'all',
      links: hrefs,
    });
  }

  highlightEmptyLinks() {
    const links = document.querySelectorAll('a');
    const currentUrl = window.location.href.split('#')[0];
    let emptyCount = 0;
    const emptyHrefs = [];

    links.forEach((link, index) => {
      const href = link.getAttribute('href');
      const isEmptyOrInvalid =
        !href ||
        href === '#' ||
        href === '/' ||
        href === currentUrl ||
        href.startsWith('#');

      if (isEmptyOrInvalid) {
        const linkId = `linkflow-${Date.now()}-${index}`;
        link.dataset.linkflowId = linkId;
        this.highlightElement(
          link,
          'rgba(239, 68, 68, 0.2)',
          'rgba(239, 68, 68, 0.8)'
        );
        emptyCount++;
        emptyHrefs.push({ href: href || '(empty)', id: linkId });
      }
    });

    chrome.runtime.sendMessage({
      action: 'scanComplete',
      count: emptyCount,
      type: 'empty',
      links: emptyHrefs,
    });
  }

  highlightUniqueLinks() {
    const links = document.querySelectorAll('a');
    const uniqueUrls = new Set();
    const uniqueHrefs = [];
    let uniqueCount = 0;

    links.forEach((link, index) => {
      const href = link.href;
      if (!uniqueUrls.has(href)) {
        const linkId = `linkflow-${Date.now()}-${index}`;
        link.dataset.linkflowId = linkId;
        uniqueUrls.add(href);
        this.highlightElement(
          link,
          'rgba(147, 51, 234, 0.2)',
          'rgba(147, 51, 234, 0.8)'
        );
        uniqueCount++;
        uniqueHrefs.push({ href, id: linkId });
      }
    });

    chrome.runtime.sendMessage({
      action: 'scanComplete',
      count: uniqueCount,
      type: 'unique',
      links: uniqueHrefs,
    });
  }

  highlightSpecificLink(linkId) {
    const link = document.querySelector(`[data-linkflow-id="${linkId}"]`);
    if (link) {
      link.scrollIntoView({ behavior: 'smooth', block: 'center' });
      link.classList.remove('linkflow-highlight-pulse');
      void link.offsetWidth;
      link.classList.add('linkflow-highlight-pulse');
    }
  }
}

new LinkScanner();
