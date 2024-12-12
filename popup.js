// Create a UI manager class
class LinkflowUI {
  constructor() {
    this.elements = this.getElements();
    this.setupEventListeners();
    this.setupMessageListener();
    this.activeButton = null;
    this.currentLinks = [];
  }

  getElements() {
    return {
      scanAllBtn: document.getElementById('scan-all'),
      scanEmptyBtn: document.getElementById('scan-empty'),
      scanUniqueBtn: document.getElementById('scan-unique'),
      resultCount: document.getElementById('result-count'),
      loadingSpinner: document.getElementById('loading-spinner'),
      mainContainer: document.getElementById('main-container'),
      listContainer: document.getElementById('list-container'),
      linksList: document.getElementById('links-list'),
      backButton: document.getElementById('back-button'),
    };
  }

  setupEventListeners() {
    const scanActions = [
      {
        button: 'scanAllBtn',
        action: 'scanAllLinks',
        activeClass: 'btn-active-all',
      },
      {
        button: 'scanEmptyBtn',
        action: 'scanEmptyLinks',
        activeClass: 'btn-active-empty',
      },
      {
        button: 'scanUniqueBtn',
        action: 'scanUniqueLinks',
        activeClass: 'btn-active-unique',
      },
    ];

    scanActions.forEach(({ button, action, activeClass }) => {
      this.elements[button].addEventListener('click', () => {
        this.setActiveButton(this.elements[button], activeClass);
        this.scan(action);
      });
    });

    // Add click handler for results count
    this.elements.resultCount.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.currentLinks.length > 0) {
        this.showLinksList();
      }
    });

    // Add click handler for back button
    this.elements.backButton.addEventListener('click', () => {
      this.showMainView();
    });
  }

  showLinksList() {
    this.elements.mainContainer.classList.add('hidden');
    this.elements.listContainer.classList.remove('hidden');

    // Clear and populate links list
    this.elements.linksList.innerHTML = this.currentLinks
      .map(
        (link) => `
        <div class="link-item" data-linkflow-id="${link.id}">
          ${link.href}
        </div>
      `
      )
      .join('');

    // Add click handlers to link items
    this.elements.linksList.querySelectorAll('.link-item').forEach((item) => {
      item.addEventListener('click', () => this.handleLinkItemClick(item));
    });
  }

  async handleLinkItemClick(item) {
    const linkId = item.dataset.linkflowId;
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      chrome.tabs.sendMessage(tab.id, {
        action: 'highlightSpecificLink',
        linkId,
      });

      // Add visual feedback in the popup
      item.classList.remove('link-item-active');
      void item.offsetWidth; // Force reflow
      item.classList.add('link-item-active');
    } catch (error) {
      console.error('Error highlighting link:', error);
    }
  }

  showMainView() {
    this.elements.listContainer.classList.add('hidden');
    this.elements.mainContainer.classList.remove('hidden');
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'scanComplete') {
        this.hideLoading();
        this.currentLinks = request.links || [];
        this.updateResults(request.count, request.type);
      }
      return true;
    });
  }

  async scan(action) {
    this.showLoading();
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Check if we have a valid tab
      if (!tab || !tab.id) {
        throw new Error('No active tab found');
      }

      // Check if we can inject into this tab
      if (!tab.url.startsWith('http')) {
        throw new Error('Cannot scan links on this page');
      }

      await this.injectContentScript(tab.id);
      chrome.tabs.sendMessage(tab.id, { action });
    } catch (error) {
      console.error('Scan error:', error);
      this.hideLoading();
      this.showError(error.message);
    }
  }

  async injectContentScript(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript(
            { target: { tabId }, files: ['contentScript.js'] },
            resolve
          );
        } else {
          resolve();
        }
      });
    });
  }

  showLoading() {
    this.elements.loadingSpinner.classList.remove('hidden');
    this.elements.resultCount.textContent = '';
  }

  hideLoading() {
    this.elements.loadingSpinner.classList.add('hidden');
  }

  updateResults(count, type) {
    const messages = {
      all: `Found ${count} total links`,
      empty: `Found ${count} empty links`,
      unique: `Found ${count} unique links`,
    };

    // Create consistent message format
    const message =
      count === 1 ? `Found 1 matching link` : `Found ${count} matching links`;

    this.elements.resultCount.textContent = message;
    this.elements.resultCount.style.cursor = count > 0 ? 'pointer' : 'default';
    this.elements.resultCount.classList.toggle('clickable', count > 0);

    // Add mono font class
    this.elements.resultCount.classList.add('mono-text');
  }

  setActiveButton(button, activeClass) {
    // Remove active class from previous button
    if (this.activeButton) {
      const previousClass = this.activeButton.className
        .split(' ')
        .find((cls) => cls.startsWith('btn-active-'));
      if (previousClass) {
        this.activeButton.classList.remove(previousClass);
      }
    }

    // Set new active button
    button.classList.add(activeClass);
    this.activeButton = button;
  }

  showError(message) {
    this.elements.resultCount.textContent = `Error: ${message}`;
    this.elements.resultCount.style.color = 'hsl(var(--destructive))';
  }
}

document.addEventListener('DOMContentLoaded', () => new LinkflowUI());
