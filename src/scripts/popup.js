// linkflow ui manager class - handles all popup interface interactions
class LinkflowUI {
  constructor() {
    this.elements = this.getElements();
    this.setupEventListeners();
    this.setupMessageListener();
    this.activeButton = null;
    this.currentLinks = [];
    this.scanType = null;
  }

  // cache dom elements for better performance
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
      exportCsv: document.getElementById('export-csv'),
    };
  }

  // setup event listeners for all interactive elements
  setupEventListeners() {
    // define scan actions with their corresponding buttons and active states
    const scanActions = [
      {
        button: 'scanAllBtn',
        action: 'scanAllLinks',
        activeClass: 'btn-active-all',
        type: 'all',
      },
      {
        button: 'scanEmptyBtn',
        action: 'scanEmptyLinks',
        activeClass: 'btn-active-empty',
        type: 'empty',
      },
      {
        button: 'scanUniqueBtn',
        action: 'scanUniqueLinks',
        activeClass: 'btn-active-unique',
        type: 'unique',
      },
    ];

    // attach click handlers to scan buttons
    scanActions.forEach(({ button, action, activeClass, type }) => {
      this.elements[button].addEventListener('click', () => {
        this.scanType = type;
        this.setActiveButton(this.elements[button], activeClass);
        this.scan(action);
      });
    });

    // handle results count click to show detailed list
    this.elements.resultCount.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.currentLinks.length > 0) {
        this.showLinksList();
      }
    });

    // handle back button click to return to main view
    this.elements.backButton.addEventListener('click', () => {
      this.showMainView();
    });

    // handle export CSV button
    this.elements.exportCsv.addEventListener('click', () => this.exportToCsv());
  }

  // display the list of found links
  showLinksList() {
    this.elements.mainContainer.classList.add('hidden');
    this.elements.listContainer.classList.remove('hidden');

    // generate and insert link items
    this.elements.linksList.innerHTML = this.currentLinks
      .map(
        (link) => `
        <div class="link-item" data-linkflow-id="${link.id}">
          ${link.href}
        </div>
      `
      )
      .join('');

    // attach click handlers to each link item
    this.elements.linksList.querySelectorAll('.link-item').forEach((item) => {
      item.addEventListener('click', () => this.handleLinkItemClick(item));
    });
  }

  // handle click on a specific link item
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

      // provide visual feedback in the popup
      item.classList.remove('link-item-active');
      void item.offsetWidth; // force reflow for animation
      item.classList.add('link-item-active');
    } catch (error) {
      console.error('Error highlighting link:', error);
    }
  }

  // return to main view from list view
  showMainView() {
    this.elements.listContainer.classList.add('hidden');
    this.elements.mainContainer.classList.remove('hidden');
  }

  // setup message listener for communication with content script
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

  // initiate scan process
  async scan(action) {
    this.showLoading();
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || !tab.id) {
        throw new Error('No active tab found');
      }

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

  // inject content script if not already present
  async injectContentScript(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript(
            { target: { tabId }, files: ['src/scripts/contentScript.js'] },
            resolve
          );
        } else {
          resolve();
        }
      });
    });
  }

  // show loading spinner
  showLoading() {
    this.elements.loadingSpinner.classList.remove('hidden');
    this.elements.resultCount.textContent = '';
  }

  // hide loading spinner
  hideLoading() {
    this.elements.loadingSpinner.classList.add('hidden');
  }

  // update results display with count and type
  updateResults(count, type) {
    // create consistent message format
    const message =
      count === 1 ? `Found 1 matching link` : `Found ${count} matching links`;

    this.elements.resultCount.textContent = message;
    this.elements.resultCount.style.cursor = count > 0 ? 'pointer' : 'default';
    this.elements.resultCount.classList.toggle('clickable', count > 0);

    // add mono font class for consistent styling
    this.elements.resultCount.classList.add('mono-text');
  }

  // handle active button state
  setActiveButton(button, activeClass) {
    // remove active class from previous button
    if (this.activeButton) {
      const previousClass = this.activeButton.className
        .split(' ')
        .find((cls) => cls.startsWith('btn-active-'));
      if (previousClass) {
        this.activeButton.classList.remove(previousClass);
      }
    }

    // set new active button
    button.classList.add(activeClass);
    this.activeButton = button;
  }

  // display error message
  showError(message) {
    this.elements.resultCount.textContent = `Error: ${message}`;
    this.elements.resultCount.style.color = 'hsl(var(--destructive))';
  }

  // export CSV
  async exportToCsv() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const hostname = new URL(tab.url).hostname;
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `links_${this.scanType}_${hostname}_${timestamp}.csv`;

      // Create CSV content
      const csvContent = [
        ['URL'], // CSV header
        ...this.currentLinks.map((link) => [link.href]),
      ]
        .map((row) => row.join(','))
        .join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      this.showError('Failed to export CSV');
    }
  }
}

// initialize ui when dom is ready
document.addEventListener('DOMContentLoaded', () => new LinkflowUI());
