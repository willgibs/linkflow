<img src="logo.svg" alt="Linkflow Icon" width="64px">

# Linkflow

<p align="left">
  <a href="https://twitter.com/willgibs"><img src="https://img.shields.io/twitter/url/https/twitter.com/willgibs.svg?style=social&label=Follow%20%40willgibs" alt="Twitter"></a>
  &nbsp;&nbsp;
  <a href="mailto:hi@willgibs.com?subject=Linkflow"><img src="https://img.shields.io/badge/Email-Will%20Gibson-blue" alt="Email Will Gibson"></a>
</p>

Linkflow is a modern Chrome Extension that simplifies website link analysis and management. It offers tools to visualize site structure, identify navigation issues, and optimize link architecture — all from your browser. Built with attention to detail and a focus on user experience.

## Features

- **Identify All Links**: Generate a visual sitemap of any webpage with intuitive highlighting
- **Scan for Empty Links**: Find and highlight potential navigation issues and dead ends
- **Identify Unique Links**: List unique links to streamline navigation and reduce redundancy
- **Interactive Link List**: Click any link in the results to highlight it on the page
- **Smart Theme Support**: Automatically adapts to your system theme with manual toggle option
- **Modern UI**: Clean, Apple-inspired interface using Geist and Geist Mono fonts
- **Responsive Design**: Smooth animations and transitions for a polished experience
- **Adaptive Highlighting**: Context-aware link highlighting that works in both light and dark modes

## Download

Get Linkflow from the [Chrome Web Store](https://chrome.google.com/webstore/detail/linkflow/kmgkhecojimncfnoiaajcpekejfklejl).

## Local Installation

1. Clone or download the repository
2. Navigate to `chrome://extensions/` in Chrome
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the Linkflow folder

## Usage

1. Click the Linkflow icon in your Chrome toolbar
2. Choose a scan option:
   - **Scan All Links**: Shows every link on the page
   - **Find Empty Links**: Identifies problematic or empty links
   - **Find Unique Links**: Lists each unique URL once
3. Click the results count to view detailed link list
4. Click any link in the list to highlight it on the page
5. Use the theme toggle to switch between light and dark modes

## Development

The extension is built with modern web technologies:

- **popup.js**: Core UI logic and extension functionality
- **contentScript.js**: Webpage interaction and link highlighting
- **themeManager.js**: Theme management and system preference handling
- **popup.css**: Styling with CSS variables for theming
- **manifest.json**: Extension configuration and permissions

### Key Components

- Custom font implementation using Geist and Geist Mono
- CSS variables for consistent theming
- Smooth animations and transitions
- Responsive and accessible UI elements
- System theme detection and override support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.
