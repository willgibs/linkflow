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
  downloadCSV(csvContent, `PM - ${pageTitle}.csv`);
}

// Scroll to link element
function scrollToLinkElement(id) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}

// Handle generate button click event
async function onGenerateButtonClick() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const pageTitle = tabs[0].title;
    await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ['contentScript.js'],
    });
    chrome.tabs.sendMessage(tabs[0].id, { action: 'generateSitemap' });

    document.getElementById('container_generate').style.display = 'none';
    document.getElementById('container_links').style.display = 'block';

    const exportButton = document.getElementById('export');
    exportButton.style.display = 'inline-block'; // Show export button
    exportButton.addEventListener('click', () => exportToCSV(sitemapData, pageTitle));

  } catch (error) {
    console.error(error);
  }
}

// Handle scan button click event
async function onScanButtonClick() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const pageTitle = tabs[0].title;
    await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ['contentScript.js'],
    });
    chrome.tabs.sendMessage(tabs[0].id, { action: 'scanLinks' });

    document.getElementById('container_generate').style.display = 'none';
    document.getElementById('container_links').style.display = 'block';

    const exportButton = document.getElementById('export');
    exportButton.style.display = 'inline-block'; // Show export button
    exportButton.addEventListener('click', () => exportToCSV(sitemapData, pageTitle));

  } catch (error) {
    console.error(error);
  }
}

// Handle sitemap data messages from content script
function onSitemapGenerated(request, sender, sendResponse) {
  const sitemapContainer = document.getElementById('links');
  sitemapContainer.innerHTML = request.sitemap;
  sitemapData = request.sitemapData;

  // Add click event listener to each link in the sitemap
  const links = sitemapContainer.querySelectorAll('.link');
  for (const link of links) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const id = event.target.closest('.link').dataset.id;
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: scrollToLinkElement,
          args: [id],
        });
      });
    });
  }
}

// Handle scanned links data messages from content script
function onScannedLinksGenerated(request, sender, sendResponse) {
  const sitemapContainer = document.getElementById('links');
  sitemapContainer.innerHTML = request.sitemap;
  sitemapData = request.sitemapData;

  // Add click event listener to each broken link
  const links = sitemapContainer.querySelectorAll('.link');
  for (const link of links) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const id = event.target.closest('.link').dataset.id;
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: scrollToLinkElement,
          args: [id],
        });
      });
    });
  }
}

// Event listener for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sitemapGenerated') {
    onSitemapGenerated(request, sender, sendResponse);
  } else if (request.action === 'scannedLinksGenerated') {
    onScannedLinksGenerated(request, sender, sendResponse);
  }
  sendResponse();
  return true;
});

// on click of a link
document.addEventListener('click', (e) => {
  if (e.target && e.target.classList.contains('link')) {
    e.preventDefault();

    // Send a message to the content script with the id of the link to be scrolled into view
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'scrollIntoView', id: e.target.dataset.id});
    });
  }
});

// Register event handlers
document.getElementById('generate').addEventListener('click', onGenerateButtonClick);
document.getElementById('scan').addEventListener('click', onScanButtonClick);

document.getElementById('back_icon').addEventListener('click', () => {
  document.getElementById('container_links').style.display = 'none';
  document.getElementById('container_generate').style.display = 'flex';
});

document.getElementById('close_icon').addEventListener('click', () => {
  window.close();
});

let sitemapData = [];
