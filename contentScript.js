class LinkScanner {
  constructor() {
    this.setupMessageListener();
    this.addStyles();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.clearHighlights();

      switch (request.action) {
        case 'scanAllLinks':
          this.highlightAllLinks();
          break;
        case 'scanEmptyLinks':
          this.highlightEmptyLinks();
          break;
        case 'scanUniqueLinks':
          this.highlightUniqueLinks();
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
    links.forEach((link) => {
      this.highlightElement(
        link,
        'rgba(34, 197, 94, 0.2)', // Light green
        'rgba(34, 197, 94, 0.8)' // Dark green
      );
    });

    chrome.runtime.sendMessage({
      action: 'scanComplete',
      count: links.length,
      type: 'all',
    });
  }

  highlightEmptyLinks() {
    const links = document.querySelectorAll('a');
    const currentUrl = window.location.href.split('#')[0];
    let emptyCount = 0;

    links.forEach((link) => {
      const href = link.getAttribute('href');
      const isEmptyOrInvalid =
        !href ||
        href === '#' ||
        href === '/' ||
        href === currentUrl ||
        href.startsWith('#');

      if (isEmptyOrInvalid) {
        this.highlightElement(
          link,
          'rgba(239, 68, 68, 0.2)', // Light red
          'rgba(239, 68, 68, 0.8)' // Dark red
        );
        emptyCount++;
      }
    });

    chrome.runtime.sendMessage({
      action: 'scanComplete',
      count: emptyCount,
      type: 'empty',
    });
  }

  highlightUniqueLinks() {
    const links = document.querySelectorAll('a');
    const uniqueUrls = new Set();
    let uniqueCount = 0;

    links.forEach((link) => {
      const href = link.href;
      if (!uniqueUrls.has(href)) {
        uniqueUrls.add(href);
        this.highlightElement(
          link,
          'rgba(147, 51, 234, 0.2)', // Light purple
          'rgba(147, 51, 234, 0.8)' // Dark purple
        );
        uniqueCount++;
      }
    });

    chrome.runtime.sendMessage({
      action: 'scanComplete',
      count: uniqueCount,
      type: 'unique',
    });
  }
}

new LinkScanner();
