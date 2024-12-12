// Create a UI manager class
class LinkflowUI {
  constructor() {
    this.elements = this.getElements();
    this.setupEventListeners();
    this.setupMessageListener();
  }

  getElements() {
    return {
      scanAllBtn: document.getElementById('scan-all'),
      scanEmptyBtn: document.getElementById('scan-empty'),
      scanUniqueBtn: document.getElementById('scan-unique'),
      resultCount: document.getElementById('result-count'),
      loadingSpinner: document.getElementById('loading-spinner'),
    };
  }

  setupEventListeners() {
    this.elements.scanAllBtn.addEventListener('click', () =>
      this.scan('scanAllLinks')
    );
    this.elements.scanEmptyBtn.addEventListener('click', () =>
      this.scan('scanEmptyLinks')
    );
    this.elements.scanUniqueBtn.addEventListener('click', () =>
      this.scan('scanUniqueLinks')
    );
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'scanComplete') {
        this.hideLoading();
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
      await this.injectContentScript(tab.id);
      chrome.tabs.sendMessage(tab.id, { action });
    } catch (error) {
      console.error('Scan error:', error);
      this.hideLoading();
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
      empty: `Found ${count} empty or invalid links`,
      unique: `Found ${count} unique links`,
    };
    this.elements.resultCount.textContent = messages[type];
  }
}

document.addEventListener('DOMContentLoaded', () => new LinkflowUI());
