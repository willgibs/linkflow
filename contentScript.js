(function () {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generateSitemap') {
      const links = Array.from(document.querySelectorAll('a'));
      const sitemap = links.map((link, index) => {
        link.style.border = '4px solid green'; // Highlight all links with a green border
        const title = link.innerText || link.textContent || 'undefined';
        const url = link.href;
        const id = `link-${btoa(url)}-${index}`; // Assign unique ID based on URL and index
        link.id = id;
        return {
          id,
          title,
          url
        };
      });

      const sitemapHTML = sitemap
        .map(
          (entry) =>
            `<a href="${entry.url}" target="_self" data-id="${entry.id}" class="link">
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
      const links = Array.from(document.querySelectorAll('a'));
      const homeURL = new URL(window.location.href);

      const brokenLinks = links.flatMap((link, index) => {
        const urlObject = new URL(link.href, homeURL);  // Create URL object
        const isSameBaseURL = urlObject.origin === homeURL.origin;
        const isHomePageLink = urlObject.pathname === '/' && !urlObject.hash;
        const isEmptyHashLink = urlObject.hash === '#' && urlObject.hash.slice(1).length === 0;

        if (isSameBaseURL && (!link.href || isHomePageLink || isEmptyHashLink)) {
          const title = link.innerText || link.textContent || 'undefined';
          const id = `link-${btoa(link.href || 'No href attribute')}-${index}`; // Assign unique ID based on URL and index
          link.id = id;
          link.style.border = '4px solid red'; // Add red border to the empty links
          return [{
            id,
            title,
            url: link.href || 'No href attribute',
          }];
        } else {
          return [];
        }
      });

      const brokenLinksHTML = brokenLinks
        .map(
          (entry) =>
            `<a href="${entry.url}" target="_self" data-id="${entry.id}" class="link">
              <div class="link_title">${entry.title}</div>
              <div class="link_url">${entry.url}</div>
            </a>`
        )
        .join('');

      chrome.runtime.sendMessage({
        action: 'scannedLinksGenerated',
        sitemap: brokenLinksHTML,
        sitemapData: brokenLinks
      });
    } else if (request.action === 'scrollIntoView') {
      const element = document.getElementById(request.id);
      if (element) {
        element.scrollIntoView({behavior: "smooth"});
      }
    }
  });
}());
