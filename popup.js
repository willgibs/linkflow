document.addEventListener('DOMContentLoaded', () => {
  // Object to store all DOM elements
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
    identifyUniqueBtn: document.getElementById('identify-unique'),
  };

  // Variables to store current action and sitemap data
  let currentAction = '';
  let sitemapData = [];

  // Object to store all action functions
  const actions = {
    generateSitemap: () => executeAction('generateSitemap'),
    scanLinks: () => executeAction('scanLinks'),
    showMainView,
    exportToCSV,
    identifyUniqueLinks: () => executeAction('identifyUniqueLinks'),
  };

  // Use object destructuring for cleaner event listener assignments
  const {
    analyzeAllBtn,
    findEmptyBtn,
    backBtn,
    exportBtn,
    categoryFilter,
    identifyUniqueBtn,
  } = elements;

  // Add event listeners to buttons
  analyzeAllBtn.addEventListener('click', actions.generateSitemap);
  findEmptyBtn.addEventListener('click', actions.scanLinks);
  backBtn.addEventListener('click', actions.showMainView);
  exportBtn.addEventListener('click', actions.exportToCSV);
  categoryFilter.addEventListener('change', handleCategoryFilter);
  identifyUniqueBtn.addEventListener('click', actions.identifyUniqueLinks);

  // Function to execute the selected action
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

  // Function to inject the content script if it's not already present
  async function injectContentScript(tabId) {
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

  // Function to show loading state
  function showLoadingState() {
    document.body.classList.add('results-active');
    elements.resultsView.style.opacity = '0';
  }

  // Function to hide loading state
  function hideLoadingState() {
    elements.resultsView.style.opacity = '1';
  }

  // Function to show main view
  function showMainView() {
    document.body.classList.remove('results-active');
    elements.mainView.style.display = 'flex';
    elements.resultsView.style.display = 'none';
    sitemapData = [];
  }

  // Function to show results view
  function showResultsView() {
    document.body.classList.add('results-active');
    elements.mainView.style.display = 'none';
    elements.resultsView.style.display = 'flex';
    elements.linksList.scrollTop = 0;
    hideLoadingState();
  }

  // Listen for messages from the content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (
      [
        'sitemapGenerated',
        'scannedLinksGenerated',
        'uniqueLinksGenerated',
      ].includes(request.action)
    ) {
      sitemapData = request.sitemapData;
      showResultsView();
      updateResultsView();
    }
    sendResponse();
    return true;
  });

  // Function to update the results view
  function updateResultsView() {
    const isSitemap = currentAction === 'generateSitemap';
    const isUniqueLinks = currentAction === 'identifyUniqueLinks';
    elements.resultsTitle.textContent = isSitemap
      ? 'All Links'
      : isUniqueLinks
      ? 'Unique Links'
      : 'Empty Links';
    elements.categoryFilter.style.display =
      isSitemap || isUniqueLinks ? 'block' : 'none';
    if (isSitemap || isUniqueLinks) updateCategoryFilter();
    renderFilteredLinks(isSitemap || isUniqueLinks);
  }

  // Function to update the category filter dropdown
  function updateCategoryFilter() {
    const categories = [...new Set(sitemapData.map((link) => link.category))];
    elements.categoryFilter.innerHTML =
      '<option value="all">All Categories</option>' +
      categories
        .map(
          (category) =>
            `<option value="${category
              .toLowerCase()
              .replace(' ', '-')}">${category}</option>`
        )
        .join('');
  }

  // Function to handle category filter changes
  function handleCategoryFilter(e) {
    renderFilteredLinks(currentAction === 'generateSitemap', e.target.value);
  }

  // Function to render filtered links
  function renderFilteredLinks(withCategory, filter = 'all') {
    const filteredLinks = sitemapData.filter(
      (link) =>
        filter === 'all' ||
        link.category.toLowerCase().replace(' ', '-') === filter
    );

    updateLinkCount(filteredLinks.length);

    elements.linksList.style.opacity = '0';
    elements.linksList.style.transform = 'translateY(10px)';

    setTimeout(() => {
      const fragment = document.createDocumentFragment();
      const template = document.createElement('template');
      template.innerHTML = `
        <div class="link-item" data-id="">
          <div class="link-title"></div>
          <div class="link-url"></div>
          ${
            withCategory && filter === 'all'
              ? '<div class="link-category"></div>'
              : ''
          }
        </div>
      `;

      const batchSize = 50;
      let currentIndex = 0;

      function renderBatch() {
        const endIndex = Math.min(
          currentIndex + batchSize,
          filteredLinks.length
        );

        for (let i = currentIndex; i < endIndex; i++) {
          const link = filteredLinks[i];
          const linkElement =
            template.content.cloneNode(true).firstElementChild;

          linkElement.dataset.id = link.id;
          const titleElement = linkElement.querySelector('.link-title');
          if (link.title && link.title !== link.url) {
            titleElement.textContent = link.title;
          } else {
            titleElement.style.display = 'none';
          }
          linkElement.querySelector('.link-url').textContent = link.url;

          if (withCategory && filter === 'all') {
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
          requestAnimationFrame(() => {
            elements.linksList.style.opacity = '1';
            elements.linksList.style.transform = 'translateY(0)';
          });
        }
      }

      elements.linksList.innerHTML = '';
      requestAnimationFrame(renderBatch);
    }, 150);
  }

  // Function to update the link count display
  function updateLinkCount(count) {
    const isSitemap = currentAction === 'generateSitemap';
    const isUniqueLinks = currentAction === 'identifyUniqueLinks';
    const linkType = isUniqueLinks
      ? 'unique'
      : isSitemap
      ? ''
      : 'empty or potentially broken';
    const pluralSuffix = count !== 1 ? 's' : '';
    const locationSuffix =
      elements.categoryFilter.value !== 'all'
        ? 'in this category'
        : 'on the page';

    elements.resultsSummary.innerHTML = `Found <span class="count">${count}</span> ${linkType} link${pluralSuffix} ${locationSuffix}.`;
  }

  // Function to add click listeners to link items
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

  // Function to export data to CSV
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
