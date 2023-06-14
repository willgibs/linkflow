chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateSitemap') {
    const links = document.querySelectorAll('a');
    const sitemap = [];

    for (const link of links) {
      // Apply a 2px green border to all links
      link.style.border = '4px solid green';

      const title = link.innerText || link.textContent || 'undefined';
      const url = link.href;
      sitemap.push({
        title,
        url
      });
    }

    const sitemapHTML = sitemap
      .map(
        (entry) =>
        `<a href="${entry.url}" target="_blank" class="link">
            <div class="link_title">${entry.title}</div>
            <div class="link_url">${entry.url}</div>
          </a>`
      )
      .join('');

    chrome.runtime.sendMessage({
      action: 'sitemapGenerated',
      sitemap: sitemapHTML,
      sitemapData: sitemap // Send sitemap data with sitemap HTML
    });

  } else if (request.action === 'scanLinks') {
    const links = document.querySelectorAll('a');
    const brokenLinks = [];
    const homeURL = new URL(window.location.href);

    for (const link of links) {
      const urlObject = new URL(link.href, homeURL); // Create URL object
      const isSameBaseURL = urlObject.origin === homeURL.origin;
      const isHomePageLink = urlObject.pathname === '/' && !urlObject.hash;
      const isEmptyHashLink = urlObject.hash === '#' && urlObject.hash.slice(1).length === 0;

      if (isSameBaseURL && (!link.href || isHomePageLink || isEmptyHashLink)) {
        // Apply a 2px red border to broken links
        link.style.border = '4px solid red';

        const title = link.innerText || link.textContent || 'undefined';
        brokenLinks.push({
          title,
          url: link.href || 'No href attribute',
        });
      }
    }

    const brokenLinksHTML = brokenLinks
      .map(
        (entry) =>
        `<div class="link" data-id="${entry.id}">
             <div class="link_title">${entry.title}</div>
             <div class="link_url">${entry.url}</div>
           </div>`
      )
      .join('');

    chrome.runtime.sendMessage({
      action: 'scannedLinksGenerated',
      sitemap: brokenLinksHTML,
      sitemapData: brokenLinks
    });
  } else if (request.action === 'scrollToLink') {
    const link = Array.from(document.querySelectorAll('a')).find(a => a.href === request.url);
    if (link) {
      link.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
});
