document.addEventListener('DOMContentLoaded', () => {
  const mainView = document.getElementById('main-view');
  const resultsView = document.getElementById('results-view');
  const analyzeAllBtn = document.getElementById('analyze-all');
  const findEmptyBtn = document.getElementById('find-empty');
  const backBtn = document.getElementById('back-button');
  const exportBtn = document.getElementById('export-button');
  const resultsTitle = document.getElementById('results-title');
  const resultsSummary = document.getElementById('results-summary');
  const linksList = document.getElementById('links-list');

  let currentAction = '';
  let sitemapData = [];

  analyzeAllBtn.addEventListener('click', () =>
    executeAction('generateSitemap')
  );
  findEmptyBtn.addEventListener('click', () => executeAction('scanLinks'));
  backBtn.addEventListener('click', showMainView);
  exportBtn.addEventListener('click', exportToCSV);

  async function executeAction(action) {
    currentAction = action;
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['contentScript.js'],
      });
      chrome.tabs.sendMessage(tab.id, { action });
      showResultsView();
    } catch (error) {
      console.error('Error executing action:', error);
    }
  }

  function showMainView() {
    mainView.classList.remove('hidden');
    resultsView.classList.add('hidden');
  }

  function showResultsView() {
    mainView.classList.add('hidden');
    resultsView.classList.remove('hidden');
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (
      request.action === 'sitemapGenerated' ||
      request.action === 'scannedLinksGenerated'
    ) {
      sitemapData = request.sitemapData;
      updateResultsView();
    }
    sendResponse();
    return true;
  });

  function updateResultsView() {
    const count = sitemapData.length;
    if (currentAction === 'generateSitemap') {
      resultsTitle.textContent = 'All Links';
      resultsSummary.innerHTML = `Found <span class="count">${count}</span> link${
        count !== 1 ? 's' : ''
      } on the page.`;
    } else {
      resultsTitle.textContent = 'Empty Links';
      resultsSummary.innerHTML = `Found <span class="count">${count}</span> empty or potentially broken link${
        count !== 1 ? 's' : ''
      }.`;
    }
    linksList.innerHTML = sitemapData.map(createLinkItem).join('');
    addLinkListeners();
  }

  function createLinkItem(link) {
    return `
      <div class="link-item" data-id="${link.id}">
        <div class="link-title">${escapeHtml(link.title)}</div>
        <div class="link-url">${escapeHtml(link.url)}</div>
      </div>
    `;
  }

  function addLinkListeners() {
    linksList.querySelectorAll('.link-item').forEach((item) => {
      item.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'scrollIntoView',
            id: item.dataset.id,
          });
        });
      });
    });
  }

  function exportToCSV() {
    const csvContent = [
      ['Link Title', 'URL'],
      ...sitemapData.map(({ title, url }) => [title, url]),
    ]
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `linkflow_export_${new Date().toISOString()}.csv`;
    link.click();
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
