/* ============================================================
   Auto EDA Insight — theme.js
   Theme Toggle: Dark (default) ↔ Light
   Persists selection to localStorage.
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'eda-theme';
  const DEFAULT     = 'dark';

  /* ── Apply theme to <html> element ────────────────────────── */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  /* ── Save preference ───────────────────────────────────────── */
  function saveTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
  }

  /* ── Read saved preference ─────────────────────────────────── */
  function getSavedTheme() {
    try { return localStorage.getItem(STORAGE_KEY) || DEFAULT; } catch (_) { return DEFAULT; }
  }

  /* ── Toggle current theme ──────────────────────────────────── */
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || DEFAULT;
    const next    = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);

    /* Re-render Plotly charts if present, so axis/font colors update */
    if (typeof Plotly !== 'undefined') {
      const fontColor = next === 'light' ? '#0F172A' : '#F2FFF6';
      const gridColor = next === 'light' ? 'rgba(15,23,42,0.12)' : 'rgba(37,197,233,0.10)';
      document.querySelectorAll('.js-plotly-plot').forEach(function (el) {
        try {
          Plotly.relayout(el, {
            'font.color':              fontColor,
            'legend.font.color':       fontColor,
            'legend.bgcolor':          'rgba(0,0,0,0)',
            'xaxis.gridcolor':         gridColor,
            'yaxis.gridcolor':         gridColor,
            'xaxis.zerolinecolor':     gridColor,
            'yaxis.zerolinecolor':     gridColor,
            'xaxis.tickfont.color':    fontColor,
            'yaxis.tickfont.color':    fontColor,
            'xaxis.titlefont.color':   fontColor,
            'yaxis.titlefont.color':   fontColor,
          });
        } catch (_) {}
      });
    }

    return next;
  }

  /* ── Init on page load ─────────────────────────────────────── */
  function init() {
    const saved = getSavedTheme();
    applyTheme(saved);

    /* Bind any .theme-toggle buttons already in DOM */
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', toggleTheme);
    });

    /* Also bind buttons added dynamically later (event delegation) */
    document.addEventListener('click', function (e) {
      if (e.target.closest('.theme-toggle')) {
        /* Already handled by direct listener if present; this is a fallback */
      }
    });
  }

  /* Run init immediately if DOM ready, else wait */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Expose for manual use in page scripts */
  window.EDATheme = {
    toggle: toggleTheme,
    apply:  applyTheme,
    get:    function () {
      return document.documentElement.getAttribute('data-theme') || DEFAULT;
    },
    getChartColors: function () {
      var t = window.EDATheme.get();
      return {
        font:     t === 'light' ? '#0F172A'                    : '#F2FFF6',
        grid:     t === 'light' ? 'rgba(15,23,42,0.12)'        : 'rgba(37,197,233,0.10)',
        bg:       'rgba(0,0,0,0)',
        primary:  t === 'light' ? '#0369A1'                    : '#25C5E9',
        success:  t === 'light' ? '#166534'                    : '#22c55e',
        danger:   t === 'light' ? '#991b1b'                    : '#ef4444',
        warning:  t === 'light' ? '#92400e'                    : '#eab308',
      };
    },
  };
}());
