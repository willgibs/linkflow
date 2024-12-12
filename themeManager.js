class ThemeManager {
  constructor() {
    this.themeToggle = document.getElementById('theme-toggle');
    this.htmlElement = document.documentElement;
    this.init();
  }

  init() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.setTheme(savedTheme);
    this.setupEventListeners();
  }

  setTheme(theme) {
    this.htmlElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
    this.updateThemeToggleIcon(theme);
  }

  setupEventListeners() {
    this.themeToggle.addEventListener('click', () => {
      const newTheme = this.htmlElement.classList.contains('light')
        ? 'dark'
        : 'light';
      this.setTheme(newTheme);
    });
  }

  updateThemeToggleIcon(theme) {
    this.themeToggle.innerHTML =
      theme === 'light' ? this.getMoonIcon() : this.getSunIcon();
  }

  getMoonIcon() {
    return `<svg>...</svg>`; // Moon icon SVG
  }

  getSunIcon() {
    return `<svg>...</svg>`; // Sun icon SVG
  }
}
