document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    mainView: document.getElementById('main-view'),
    resultsView: document.getElementById('results-view'),
    analyzeAllBtn: document.getElementById('analyze-all'),
    findEmptyBtn: document.getElementById('find-empty'),
    backBtn: document.getElementById('back-button'),
    exportBtn: document.getElementById('export-button'),
    resultsTitle: document.getElementById('results-title'),
    resultsSummary: document.getElementById('results-summary'),
    linksList: document.getElementById('links-list'),
    categoryFilter: document.getElementById('category-filter'),
  };

  let currentAction = '';
  let sitemapData = [];

  const actions = {
    generateSitemap: () => executeAction('generateSitemap'),
    scanLinks: () => executeAction('scanLinks'),
    showMainView,
    exportToCSV,
  };

  elements.analyzeAllBtn.addEventListener('click', actions.generateSitemap);
  elements.findEmptyBtn.addEventListener('click', actions.scanLinks);
  elements.backBtn.addEventListener('click', actions.showMainView);
  elements.exportBtn.addEventListener('click', actions.exportToCSV);
  elements.categoryFilter.addEventListener('change', handleCategoryFilter);

  async function executeAction(action) {
    currentAction = action;
    showLoadingState();
    sitemapData = [];

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      await injectContentScript(tab.id);
      chrome.tabs.sendMessage(tab.id, { action });
    } catch (error) {
      console.error('Error executing action:', error);
      hideLoadingState();
    }
  }

  async function injectContentScript(tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript(
            { target: { tabId }, files: ['contentScript.js'] },
            () => resolve()
          );
        } else {
          resolve();
        }
      });
    });
  }

  function showLoadingState() {
    document.body.classList.add('results-active');
    elements.resultsView.style.opacity = '0';
  }

  function hideLoadingState() {
    elements.resultsView.style.opacity = '1';
  }

  function showMainView() {
    document.body.classList.remove('results-active');
    elements.mainView.style.display = 'flex';
    elements.resultsView.style.display = 'none';
    sitemapData = [];
  }

  function showResultsView() {
    document.body.classList.add('results-active');
    elements.mainView.style.display = 'none';
    elements.resultsView.style.display = 'flex';
    hideLoadingState();
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (
      request.action === 'sitemapGenerated' ||
      request.action === 'scannedLinksGenerated'
    ) {
      sitemapData = request.sitemapData;
      showResultsView();
      updateResultsView();
    }
    sendResponse();
    return true;
  });

  function updateResultsView() {
    const isSitemap = currentAction === 'generateSitemap';
    elements.resultsTitle.textContent = isSitemap ? 'All Links' : 'Empty Links';
    elements.categoryFilter.style.display = isSitemap ? 'block' : 'none';
    if (isSitemap) updateCategoryFilter();
    renderFilteredLinks(isSitemap);
  }

  function updateCategoryFilter() {
    const categories = new Set(sitemapData.map((link) => link.category));
    elements.categoryFilter.innerHTML =
      '<option value="all">All Categories</option>' +
      Array.from(categories)
        .map(
          (category) =>
            `<option value="${category
              .toLowerCase()
              .replace(' ', '-')}">${category}</option>`
        )
        .join('');
  }

  function handleCategoryFilter(e) {
    renderFilteredLinks(currentAction === 'generateSitemap', e.target.value);
  }

  function renderFilteredLinks(withCategory, filter = 'all') {
    const filteredLinks = sitemapData.filter(
      (link) =>
        filter === 'all' ||
        link.category.toLowerCase().replace(' ', '-') === filter
    );

    updateLinkCount(filteredLinks.length);

    const fragment = document.createDocumentFragment();
    const templateWithCategory = document.createElement('template');
    const templateWithoutCategory = document.createElement('template');

    templateWithCategory.innerHTML = `
      <div class="link-item" data-id="">
        <div class="link-title"></div>
        <div class="link-url"></div>
        <div class="link-category"></div>
      </div>
    `;

    templateWithoutCategory.innerHTML = `
      <div class="link-item" data-id="">
        <div class="link-title"></div>
        <div class="link-url"></div>
      </div>
    `;

    const batchSize = 50;
    let currentIndex = 0;

    function renderBatch() {
      const endIndex = Math.min(currentIndex + batchSize, filteredLinks.length);

      for (let i = currentIndex; i < endIndex; i++) {
        const link = filteredLinks[i];
        const template = withCategory
          ? templateWithCategory
          : templateWithoutCategory;
        const linkElement = template.content.cloneNode(true).firstElementChild;

        linkElement.dataset.id = link.id;
        linkElement.querySelector('.link-title').textContent = link.title || '';
        linkElement.querySelector('.link-url').textContent = link.url;

        if (withCategory) {
          const categoryElement = linkElement.querySelector('.link-category');
          categoryElement.textContent = link.category;
          categoryElement.className = `link-category category-${link.category
            .toLowerCase()
            .replace(' ', '-')}`;
        }

        fragment.appendChild(linkElement);
      }

      elements.linksList.appendChild(fragment);
      currentIndex = endIndex;

      if (currentIndex < filteredLinks.length) {
        requestAnimationFrame(renderBatch);
      } else {
        addLinkListeners();
      }
    }

    elements.linksList.innerHTML = '';
    requestAnimationFrame(renderBatch);
  }

  function updateLinkCount(count) {
    const isSitemap = currentAction === 'generateSitemap';
    elements.resultsSummary.innerHTML = `Found <span class="count">${count}</span> ${
      isSitemap ? 'link' : 'empty or potentially broken link'
    }${count !== 1 ? 's' : ''} ${
      elements.categoryFilter.value !== 'all'
        ? 'in this category'
        : 'on the page'
    }.`;
  }

  function addLinkListeners() {
    elements.linksList.querySelectorAll('.link-item').forEach((item) => {
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
      ['Link Title', 'URL', 'Category'],
      ...sitemapData.map(({ title, url, category }) => [title, url, category]),
    ]
      .map((row) =>
        row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `linkflow_export_${new Date().toISOString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
});
