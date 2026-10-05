(function () {
  function savedTheme() { try { return localStorage.getItem('eljirari-theme'); } catch (_) { return null; } }
  var preference = savedTheme();
  var system = window.matchMedia('(prefers-color-scheme: dark)');
  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    var button = document.querySelector('.theme-toggle');
    if (button) button.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' theme');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#20221f' : '#f7f6f2';
  }
  apply(preference || (system.matches ? 'dark' : 'light'));
  document.addEventListener('DOMContentLoaded', function () {
    apply(document.documentElement.dataset.theme);
    document.querySelector('.theme-toggle').addEventListener('click', function () {
      preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(preference);
      try { localStorage.setItem('eljirari-theme', preference); } catch (_) {}
    });
  });
  system.addEventListener('change', function (event) { if (!preference) apply(event.matches ? 'dark' : 'light'); });
})();
