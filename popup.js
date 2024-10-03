document.addEventListener('DOMContentLoaded', () => {
  // Create and download a CSV file
  function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Convert sitemap data to CSV content and trigger download
  function exportToCSV(sitemap, pageTitle) {
    const csvContent = [
      ['Link Title', 'URL'],
      ...sitemap.map(({ title, url }) => [title, url]),
    ]
      .map((row) => row.map((cell) => JSON.stringify(cell)).join(','))
      .join('\n');
    downloadCSV(csvContent, `LF - ${pageTitle}.csv`);
  }

  // Handle generate button click event
  async function onGenerateButtonClick() {
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const pageTitle = tabs[0].title;
      await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['contentScript.js'],
      });
      chrome.tabs.sendMessage(tabs[0].id, { action: 'generateSitemap' });

      const containerGenerate = document.getElementById('container_generate');
      const containerLinks = document.getElementById('container_links');
      if (containerGenerate) containerGenerate.style.display = 'none';
      if (containerLinks) containerLinks.style.display = 'flex';

      const exportButton = document.getElementById('export');
      if (exportButton) {
        exportButton.style.display = 'inline-flex'; // Changed from 'inline-block' to 'inline-flex'
        exportButton.addEventListener('click', () =>
          exportToCSV(sitemapData, pageTitle)
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Handle scan button click event
  async function onScanButtonClick() {
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const pageTitle = tabs[0].title;
      await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['contentScript.js'],
      });
      chrome.tabs.sendMessage(tabs[0].id, { action: 'scanLinks' });

      const containerGenerate = document.getElementById('container_generate');
      const containerLinks = document.getElementById('container_links');
      if (containerGenerate) containerGenerate.style.display = 'none';
      if (containerLinks) containerLinks.style.display = 'flex';

      const exportButton = document.getElementById('export');
      if (exportButton) {
        exportButton.style.display = 'inline-flex'; // Changed from 'inline-block' to 'inline-flex'
        exportButton.addEventListener('click', () =>
          exportToCSV(sitemapData, pageTitle)
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Event listener for messages from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (
      request.action === 'sitemapGenerated' ||
      request.action === 'scannedLinksGenerated'
    ) {
      const linksContainer = document.getElementById('links');
      if (linksContainer) {
        const sitemapHTML = request.sitemapData.map(generateLinkHTML).join('');
        linksContainer.innerHTML = sitemapHTML;
        sitemapData = request.sitemapData;

        // Add click event listeners to the newly created links
        const links = linksContainer.querySelectorAll('.link');
        for (const link of links) {
          link.addEventListener('click', (event) => {
            event.preventDefault();
            const id = event.currentTarget.dataset.id;
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'scrollIntoView',
                id: id,
              });
            });
          });
        }
      } else {
        console.error('Links container not found');
      }
    }
    sendResponse();
    return true;
  });

  // Register event handlers
  const generateButton = document.getElementById('generate');
  if (generateButton) {
    generateButton.addEventListener('click', onGenerateButtonClick);
  }

  const scanButton = document.getElementById('scan');
  if (scanButton) {
    scanButton.addEventListener('click', onScanButtonClick);
  }

  const backIcon = document.getElementById('back_icon');
  if (backIcon) {
    backIcon.addEventListener('click', () => {
      const containerLinks = document.getElementById('container_links');
      const containerGenerate = document.getElementById('container_generate');
      if (containerLinks) containerLinks.style.display = 'none';
      if (containerGenerate) containerGenerate.style.display = 'flex';
    });
  }

  const closeIcon = document.getElementById('close_icon');
  if (closeIcon) {
    closeIcon.addEventListener('click', () => {
      window.close();
    });
  }

  const helpLinks = document.querySelectorAll('.help');
  helpLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: e.target.href });
    });
  });

  let sitemapData = [];

  function generateLinkHTML(entry) {
    return `
      <a href="${entry.url}" target="_self" data-id="${entry.id}" class="link">
        <div class="link_title">${escapeHtml(entry.title)}</div>
        <div class="link_url">${escapeHtml(entry.url)}</div>
      </a>
    `;
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
