class ThemeManager {
  constructor() {
    this.themeToggle = document.getElementById('theme-toggle');
    if (!this.themeToggle) {
      console.error('Theme toggle button not found');
      return;
    }
    this.init();
  }

  init() {
    // Check system preference
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    const savedTheme = localStorage.getItem('theme');

    // Set initial theme
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    // Immediately set the icon and theme
    this.updateThemeToggleIcon(initialTheme);
    this.setTheme(initialTheme);

    // Add click listener
    this.themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      this.setTheme(newTheme);
    });
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.updateThemeToggleIcon(theme);
  }

  updateThemeToggleIcon(theme) {
    this.themeToggle.innerHTML =
      theme === 'light' ? this.getMoonIcon() : this.getSunIcon();
  }

  getMoonIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  }

  getSunIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  }
}

// Create instance when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
});
