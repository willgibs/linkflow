// linkscanner class - handles all webpage link interactions and highlighting
class LinkScanner {
  constructor() {
    this.setupMessageListener();
    this.addStyles();
  }

  // listen for messages from the popup
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

  // inject required styles for link highlighting
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* theme-aware variables for link highlighting */
      :root {
        --linkflow-all-bg: rgba(34, 197, 94, 0.15);
        --linkflow-all-outline: rgba(34, 197, 94, 0.7);
        --linkflow-empty-bg: rgba(239, 68, 68, 0.15);
        --linkflow-empty-outline: rgba(239, 68, 68, 0.7);
        --linkflow-unique-bg: rgba(147, 51, 234, 0.15);
        --linkflow-unique-outline: rgba(147, 51, 234, 0.7);
      }

      /* adjust highlight colors for dark mode */
      @media (prefers-color-scheme: dark) {
        :root {
          --linkflow-all-bg: rgba(34, 197, 94, 0.25);
          --linkflow-all-outline: rgba(34, 197, 94, 0.8);
          --linkflow-empty-bg: rgba(239, 68, 68, 0.25);
          --linkflow-empty-outline: rgba(239, 68, 68, 0.8);
          --linkflow-unique-bg: rgba(147, 51, 234, 0.25);
          --linkflow-unique-outline: rgba(147, 51, 234, 0.8);
        }
      }

      /* base highlight styles */
      .linkflow-highlight {
        background-color: var(--highlight-color) !important;
        outline: 2px solid var(--outline-color) !important;
        border-radius: 4px !important;
        transition: all 0.15s ease !important;
        color: var(--text-color, white) !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
      }
      
      /* ensure all child elements inherit text color */
      .linkflow-highlight * {
        color: white !important;
      }
      
      /* hover effect for highlighted links */
      .linkflow-highlight:hover {
        filter: brightness(1.1);
      }
      
      /* pulse animation for selected links */
      .linkflow-highlight-pulse {
        animation: linkflowPulse 0.3s ease-out;
      }
      
      /* pulse animation keyframes */
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

  // remove all link highlights
  clearHighlights() {
    document.querySelectorAll('.linkflow-highlight').forEach((el) => {
      el.classList.remove('linkflow-highlight');
      el.style.removeProperty('--highlight-color');
      el.style.removeProperty('--outline-color');
    });
  }

  // apply highlight styles to an element
  highlightElement(element, highlightColor, outlineColor) {
    element.classList.add('linkflow-highlight');
    element.style.setProperty('--highlight-color', highlightColor);
    element.style.setProperty('--outline-color', outlineColor);
  }

  // scan and highlight all links on the page
  highlightAllLinks() {
    const links = document.querySelectorAll('a');
    const hrefs = [];

    links.forEach((link, index) => {
      const linkId = `linkflow-${Date.now()}-${index}`;
      link.dataset.linkflowId = linkId;
      this.highlightElement(
        link,
        'var(--linkflow-all-bg)',
        'var(--linkflow-all-outline)'
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

  // scan and highlight empty or invalid links
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
          'var(--linkflow-empty-bg)',
          'var(--linkflow-empty-outline)'
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

  // scan and highlight unique links
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
          'var(--linkflow-unique-bg)',
          'var(--linkflow-unique-outline)'
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

  // highlight and scroll to a specific link
  highlightSpecificLink(linkId) {
    const link = document.querySelector(`[data-linkflow-id="${linkId}"]`);
    if (link) {
      link.scrollIntoView({ behavior: 'smooth', block: 'center' });
      link.classList.remove('linkflow-highlight-pulse');
      void link.offsetWidth; // force reflow for animation
      link.classList.add('linkflow-highlight-pulse');
    }
  }
}

// initialize scanner when script loads
new LinkScanner();
