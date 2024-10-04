function setInitialTheme() {
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  if (prefersDarkScheme.matches) {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    themeToggle.checked = true;
  } else {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    themeToggle.checked = false;
  }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', setInitialTheme);

// Modify the existing theme toggle function
function toggleTheme() {
  if (themeToggle.checked) {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  }
}
