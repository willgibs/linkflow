<img src="icon128.png" alt="Linkflow Icon">

# Linkflow

<p align="left"><a href="https://twitter.com/willgibs"><img src="https://img.shields.io/twitter/url/https/twitter.com/willgibs.svg?style=social&label=Follow%20%40willgibs" alt="Twitter"></a></p>

Linkflow is a Chrome Extension that enhances your web browsing experience by providing instant tools to analyze and optimize your website's links.

With just one click, you can generate a page-specific sitemap, scan for empty links, highlight on-page links, or even export your page's map to a CSV file. Developed with web developers, SEO experts, and general users in mind, Linkflow aims to simplify web navigation and improve website link structures.

## Features

- Generate Page Sitemap: Instantly generate a visual sitemap of any webpage, neatly listing all the hyperlinks in one consolidated view.
- Scan for Empty Links: Identify all empty links (`href="#"`) on the current webpage. These links are highlighted on the page for easy identification.
- Export to CSV: Export the generated sitemap data directly into a CSV file for further analysis or for record keeping.
- Scroll to Link: From the list of empty links, simply click on a link to scroll to its location on the webpage.
- Link Highlighting: Links are highlighted in green when a sitemap is generated, and broken links are highlighted in red for easy identification.
- Ease of Use: All functionalities are available from the extension's popup window, no extra navigation is needed.

## Download

To download Linkflow from the Chrome Web Store, click [here](https://chrome.google.com/webstore/detail/pagemap/kmgkhecojimncfnoiaajcpekejfklejl).

Note: v2.0 has been submitted for review.

## Local Installation Guide

To install Linkflow locally:

1. Download the ZIP file of this repository and extract it to a folder on your computer.
2. Open Google Chrome, and navigate to `chrome://extensions`.
3. Enable "Developer mode" by clicking the toggle switch in the top-right corner.
4. Click "Load unpacked" and select the folder where you extracted the Linkflow extension files.
5. Linkflow should now be installed and visible in your extensions list.

## Usage

1. Visit any webpage in Google Chrome.
2. Click the Linkflow icon in your toolbar.
3. Click the "Generate Pagemap" button in the popup to generate the visual sitemap.
4. Once the sitemap is generated, an "Export to CSV" button will appear. Click it to download the sitemap as a CSV file.

## Customization

To customize the appearance or functionality of Linkflow, you can edit the files within the extension folder:

- `popup.html`: Defines the structure of the popup window.
- `popup.css`: Defines the styles and appearance of the popup window and its elements.
- `popup.js`: Contains the JavaScript code that controls the popup's behavior.
- `contentScript.js`: Executes on the target web page to gather the links and generate the sitemap.

Feel free to modify these files as needed to create your own customized version of Linkflow.
