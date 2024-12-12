// Create a UI manager class
class LinkflowUI {
  constructor() {
    this.elements = this.getElements();
    this.setupEventListeners();
    this.setupMessageListener();
    this.activeButton = null;
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
