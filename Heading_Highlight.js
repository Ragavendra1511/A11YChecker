 (function () {
  // Toggle: if already running, cleanup and return
  if (window.__a11yHeadingOverlay) {
    window.__a11yHeadingOverlay.cleanup();
    return;
  }

  const state = { obs: null, badges: [], panel: null, styleEl: null, headings: [], activeIndex: -1 };
  const ID = 'a11y-headings-overlay';
  const lastFocusedBeforeOpen = document.activeElement;

  const CSS = `
  .a11y-heading-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: static;
    z-index: auto;
    background: #1a56db;
    color: #fff;
    font-weight: 700;
    font-size: 10px;
    line-height: 1.4;
    padding: 1px 5px;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    cursor: pointer;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    border: 1.5px solid rgba(255,255,255,0.7);
    vertical-align: middle;
    margin-inline-end: 6px;
    user-select: none;
  }
  .a11y-heading-badge:hover { background: #123f9e; }
  .a11y-heading-badge.a11y-badge-warn { background: #b91c1c; }
  .a11y-heading-badge.a11y-badge-warn:hover { background: #8f1414; }

  .a11y-heading-highlight {
    outline: 0;
    box-shadow:
      inset 4px 0 0 0 #ff8c00,
      0 0 0 3px rgba(255,165,0,0.15);
    background: rgba(255,245,230,0.35);
    transition: box-shadow 0.18s ease, background 0.18s ease;
  }

  .a11y-heading-panel {
    position: fixed;
    right: 14px;
    top: 14px;
    width: 380px;
    max-height: 82vh;
    display: flex;
    flex-direction: column;
    z-index: 2147483647;
    background: #ffffff;
    color: #1a1a1a;
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.06);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    font-size: 13px;
    overflow: hidden;
  }

  .a11y-heading-panel * { box-sizing: border-box; }

  .a11y-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 14px;
    background: linear-gradient(135deg, #1a56db, #123f9e);
    color: #fff;
    cursor: grab;
    user-select: none;
  }
  .a11y-panel-header:active { cursor: grabbing; }

  .a11y-panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
  }

  .a11y-count-badge {
    font-weight: 700;
    background: rgba(255,255,255,0.22);
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 12px;
  }

  .a11y-close-btn {
    background: rgba(255,255,255,0.15);
    border: none;
    color: #fff;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 15px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .a11y-close-btn:hover { background: rgba(255,255,255,0.3); }
  .a11y-close-btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

  .a11y-panel-toolbar {
    display: flex;
    gap: 6px;
    padding: 8px 10px;
    border-bottom: 1px solid #eceef1;
    background: #f8f9fb;
    flex-wrap: wrap;
  }

  .a11y-btn {
    border: 1px solid #d7dbe0;
    padding: 5px 9px;
    border-radius: 6px;
    background: #fff;
    color: #1a1a1a;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .a11y-btn:hover { background: #f0f2f5; border-color: #c2c8d0; }
  .a11y-btn:active { transform: translateY(1px); }
  .a11y-btn:focus-visible { outline: 2px solid #1a56db; outline-offset: 1px; }
  .a11y-btn[aria-pressed="true"] { background: #dbe6fd; border-color: #1a56db; color: #123f9e; }

  .a11y-panel-summary {
    padding: 8px 12px;
    font-size: 12px;
    border-bottom: 1px solid #eceef1;
  }
  .a11y-summary-row {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 2px 0;
  }
  .a11y-summary-row.ok { color: #166534; }
  .a11y-summary-row.warn { color: #b91c1c; }
  .a11y-summary-icon { flex: 0 0 auto; font-weight: 800; }

  .a11y-heading-list {
    overflow: auto;
    padding: 6px;
    flex: 1;
  }

  .a11y-heading-item {
    padding: 7px 8px;
    border-radius: 7px;
    cursor: pointer;
    display: flex;
    gap: 8px;
    align-items: center;
    border: 1px solid transparent;
  }
  .a11y-heading-item:hover { background: #f0f4ff; }
  .a11y-heading-item.a11y-item-active {
    background: #dbe6fd;
    border-color: #1a56db;
  }
  .a11y-heading-item.a11y-item-warn { background: #fef2f2; }
  .a11y-heading-item.a11y-item-warn:hover { background: #fde4e4; }

  .a11y-item-level-tag {
    flex: 0 0 auto;
    font-weight: 700;
    font-size: 11px;
    background: #1a56db;
    color: #fff;
    padding: 2px 6px;
    border-radius: 4px;
    min-width: 26px;
    text-align: center;
  }
  .a11y-item-warn .a11y-item-level-tag { background: #b91c1c; }

  .a11y-item-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .a11y-item-empty { color: #b91c1c; font-style: italic; }

  .a11y-item-index {
    color: #8a8f98;
    font-size: 11px;
    flex: 0 0 auto;
  }

  .a11y-muted { color: #666; font-size: 12px; padding: 10px 12px; }

  .a11y-panel-footer {
    padding: 6px 12px;
    border-top: 1px solid #eceef1;
    background: #f8f9fb;
    font-size: 11px;
    color: #666;
  }

  .a11y-sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border: 0;
  }
  `;

  // ---------- Utilities ----------
  function isHiddenFromAT(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.closest && el.closest('template, slot')) return true;
    const ariaHidden = el.getAttribute && el.getAttribute('aria-hidden');
    if (ariaHidden && ariaHidden.toLowerCase() === 'true') return true;
    if (el.hasAttribute && el.hasAttribute('hidden')) return true;
    const style = window.getComputedStyle(el);
    if (!style) return true;
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return true;
    let p = el.parentElement;
    while (p) {
      const ah = p.getAttribute && p.getAttribute('aria-hidden');
      if (ah && ah.toLowerCase() === 'true') return true;
      if (p.tagName && (p.tagName.toLowerCase() === 'template' || p.tagName.toLowerCase() === 'slot')) return true;
      p = p.parentElement;
    }
    return false;
  }

  function getHeadingLevel(el) {
    if (!el) return null;
    const t = el.tagName && el.tagName.toLowerCase();
    if (t && /^h[1-6]$/.test(t)) return parseInt(t[1], 10);
    if (el.getAttribute && (el.getAttribute('role') || '').toLowerCase() === 'heading') {
      const al = el.getAttribute('aria-level');
      if (al) {
        const v = parseInt(al, 10);
        if (!Number.isNaN(v) && v >= 1 && v <= 6) return v;
      }
      return null;
    }
    return null;
  }

  function textFor(el) {
    if (!el) return '';
    return (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
  }

  function createEl(tag, attrs) {
    const e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(k => e.setAttribute(k, attrs[k]));
    return e;
  }

  function pulse(el) {
    el.classList.add('a11y-heading-highlight');
    setTimeout(() => el.classList.remove('a11y-heading-highlight'), 1600);
  }

  function focusHeading(el) {
    if (!el) return;
    const hadTabindex = el.hasAttribute('tabindex');
    if (!hadTabindex) el.setAttribute('tabindex', '-1');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.focus({ preventScroll: true });
    pulse(el);
    if (!hadTabindex) {
      el.addEventListener('blur', function onBlur() {
        el.removeAttribute('tabindex');
        el.removeEventListener('blur', onBlur);
      }, { once: true });
    }
  }

  // ---------- Analysis ----------
  function analyze(headings) {
    const issues = [];
    const perHeadingIssues = new Map();

    const flag = (el, msg) => {
      if (!perHeadingIssues.has(el)) perHeadingIssues.set(el, []);
      perHeadingIssues.get(el).push(msg);
    };

    const withLevels = headings.map(el => ({ el, level: getHeadingLevel(el) }));
    const h1s = withLevels.filter(h => h.level === 1);

    if (h1s.length === 0) {
      issues.push({ type: 'warn', text: 'No H1 found on the page.' });
    } else if (h1s.length > 1) {
      issues.push({ type: 'warn', text: `Multiple H1s found (${h1s.length}).` });
      h1s.forEach(h => flag(h.el, 'Multiple H1 on page'));
    }

    let prevLevel = null;
    withLevels.forEach(({ el, level }) => {
      const text = textFor(el);
      if (!text) flag(el, 'Empty heading text');
      if (level == null) flag(el, 'role="heading" missing a valid aria-level');
      if (level != null) {
        if (prevLevel != null && level - prevLevel > 1) {
          flag(el, `Skips from H${prevLevel} to H${level}`);
        }
        prevLevel = level;
      }
    });

    const skipped = [...perHeadingIssues.values()].some(list => list.some(m => m.startsWith('Skips')));
    if (skipped) issues.push({ type: 'warn', text: 'One or more heading levels are skipped.' });
    const emptyCount = [...perHeadingIssues.values()].filter(list => list.includes('Empty heading text')).length;
    if (emptyCount) issues.push({ type: 'warn', text: `${emptyCount} heading(s) have no accessible text.` });

    if (issues.length === 0) {
      issues.push({ type: 'ok', text: 'No structural issues detected.' });
    }

    return { issues, perHeadingIssues };
  }

  // Safety: remove any previous leftover element with this ID
  if (document.getElementById(ID)) document.getElementById(ID).remove();

  // Inject styles
  const style = createEl('style');
  style.id = ID;
  style.textContent = CSS;
  document.head.appendChild(style);
  state.styleEl = style;

  // ---------- Build panel ----------
  const panel = createEl('div');
  panel.className = 'a11y-heading-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Heading structure inspector');
  panel.setAttribute('aria-modal', 'false');

  const header = createEl('div');
  header.className = 'a11y-panel-header';
  const title = createEl('div');
  title.className = 'a11y-panel-title';
  title.innerHTML = `<span aria-hidden="true">🧭</span> Headings <span class="a11y-count-badge" id="a11y-count-badge">0</span>`;
  const closeBtn = createEl('button', { type: 'button', 'aria-label': 'Close headings inspector' });
  closeBtn.className = 'a11y-close-btn';
  closeBtn.innerHTML = '&times;';
  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  const toolbar = createEl('div');
  toolbar.className = 'a11y-panel-toolbar';
  const refreshBtn = createEl('button', { type: 'button' }); refreshBtn.className = 'a11y-btn'; refreshBtn.textContent = '↻ Refresh';
  const toggleObs = createEl('button', { type: 'button', 'aria-pressed': 'false' }); toggleObs.className = 'a11y-btn'; 
  const prevBtn = createEl('button', { type: 'button', 'aria-label': 'Jump to previous heading' }); prevBtn.className = 'a11y-btn'; prevBtn.textContent = '↑ Prev';
  const nextBtn = createEl('button', { type: 'button', 'aria-label': 'Jump to next heading' }); nextBtn.className = 'a11y-btn'; nextBtn.textContent = '↓ Next';
  const exportBtn = createEl('button', { type: 'button' }); exportBtn.className = 'a11y-btn'; exportBtn.textContent = '⧉ Copy outline';
  toolbar.appendChild(refreshBtn);
  toolbar.appendChild(toggleObs);
  toolbar.appendChild(prevBtn);
  toolbar.appendChild(nextBtn);
  toolbar.appendChild(exportBtn);
  panel.appendChild(toolbar);

  const summary = createEl('div');
  summary.className = 'a11y-panel-summary';
  panel.appendChild(summary);

  const list = createEl('div');
  list.className = 'a11y-heading-list';
  list.setAttribute('role', 'list');
  panel.appendChild(list);

  const footer = createEl('div');
  footer.className = 'a11y-panel-footer';
  footer.textContent = 'Click a badge or list item to jump • Esc to close • Alt+↑/↓ to navigate';
  panel.appendChild(footer);

  const liveRegion = createEl('div');
  liveRegion.className = 'a11y-sr-only';
  liveRegion.setAttribute('aria-live', 'polite');
  panel.appendChild(liveRegion);

  document.body.appendChild(panel);
  state.panel = panel;

  const countBadge = panel.querySelector('#a11y-count-badge');

  // ---------- Drag to move panel ----------
  (function makeDraggable() {
    let dragging = false, offX = 0, offY = 0;
    header.addEventListener('mousedown', (e) => {
      if (e.target === closeBtn) return;
      dragging = true;
      const r = panel.getBoundingClientRect();
      offX = e.clientX - r.left;
      offY = e.clientY - r.top;
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      panel.style.left = Math.max(4, e.clientX - offX) + 'px';
      panel.style.top = Math.max(4, e.clientY - offY) + 'px';
      panel.style.right = 'auto';
    });
    window.addEventListener('mouseup', () => { dragging = false; });
  })();

  // ---------- Core render ----------
  function gatherHeadings() {
    const all = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]'));
    return all.filter(el => !isHiddenFromAT(el) && !(el.closest && el.closest('template, slot')));
  }

  function render() {
    for (const b of state.badges) if (b && b.parentNode) b.parentNode.removeChild(b);
    state.badges = [];
    list.innerHTML = '';
    summary.innerHTML = '';

    const headings = gatherHeadings();
    state.headings = headings;
    if (countBadge) countBadge.textContent = String(headings.length);

    if (headings.length === 0) {
      const none = createEl('div'); none.className = 'a11y-muted'; none.textContent = 'No visible headings found.';
      list.appendChild(none);
      return;
    }

    const { issues, perHeadingIssues } = analyze(headings);

    issues.forEach(issue => {
      const row = createEl('div');
      row.className = 'a11y-summary-row ' + issue.type;
      const icon = createEl('span'); icon.className = 'a11y-summary-icon'; icon.setAttribute('aria-hidden', 'true');
      icon.textContent = issue.type === 'warn' ? '⚠' : '✓';
      const text = createEl('span'); text.textContent = issue.text;
      row.appendChild(icon); row.appendChild(text);
      summary.appendChild(row);
    });

    headings.forEach((el, idx) => {
      const level = getHeadingLevel(el);
      const lvlText = level ? 'H' + level : 'H?';
      const itemIssues = perHeadingIssues.get(el) || [];
      const hasWarn = itemIssues.length > 0;
      const text = textFor(el);

      const badge = createEl('span');
      badge.className = 'a11y-heading-badge' + (hasWarn ? ' a11y-badge-warn' : '');
      badge.textContent = lvlText;
      badge.setAttribute('aria-hidden', 'true');
      badge.title = (hasWarn ? '⚠ ' : '') + 'Heading ' + lvlText + (hasWarn ? ' — ' + itemIssues.join('; ') : '') + ' — click to focus';
      badge.addEventListener('click', (ev) => {
        ev.stopPropagation(); ev.preventDefault();
        state.activeIndex = idx;
        focusHeading(el);
        setActiveListItem(idx);
      });
      // Insert inline as the heading's first child instead of floating it
      // over the page, so it moves with normal layout/scroll for free.
      el.insertBefore(badge, el.firstChild);
      state.badges.push(badge);

      const item = createEl('div', { role: 'listitem', tabindex: '0' });
      item.className = 'a11y-heading-item' + (hasWarn ? ' a11y-item-warn' : '');
      item.dataset.index = String(idx);

      const levelTag = createEl('span'); levelTag.className = 'a11y-item-level-tag'; levelTag.textContent = lvlText;
      const label = createEl('div');
      label.className = 'a11y-item-label' + (text ? '' : ' a11y-item-empty');
      label.textContent = text || 'No accessible text' + (hasWarn ? '' : '');
      if (hasWarn) label.title = itemIssues.join('; ');
      const indexTag = createEl('span'); indexTag.className = 'a11y-item-index'; indexTag.textContent = '#' + (idx + 1);

      item.appendChild(levelTag);
      item.appendChild(label);
      item.appendChild(indexTag);

      const jump = () => { state.activeIndex = idx; focusHeading(el); setActiveListItem(idx); };
      item.addEventListener('click', jump);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(); }
      });

      list.appendChild(item);
    });
  }

  function setActiveListItem(idx) {
    list.querySelectorAll('.a11y-heading-item').forEach(el => el.classList.remove('a11y-item-active'));
    const el = list.querySelector(`.a11y-heading-item[data-index="${idx}"]`);
    if (el) {
      el.classList.add('a11y-item-active');
      el.scrollIntoView({ block: 'nearest' });
    }
    const heading = state.headings[idx];
    if (heading) liveRegion.textContent = `Heading ${idx + 1} of ${state.headings.length}: ${textFor(heading) || 'empty heading'}`;
  }

  function goTo(delta) {
    if (state.headings.length === 0) return;
    let next = state.activeIndex + delta;
    if (next < 0) next = 0;
    if (next >= state.headings.length) next = state.headings.length - 1;
    state.activeIndex = next;
    focusHeading(state.headings[next]);
    setActiveListItem(next);
  }

  render();

  // ---------- Controls ----------
  refreshBtn.addEventListener('click', () => { render(); });

  // Badges now live inside the page's own headings, so the observer would
  // otherwise see our own inserted/removed badge nodes as page changes and
  // re-trigger itself. Disconnect while we render, then reconnect.
  let obsOn = false;
  function startObserving() {
    state.obs = new MutationObserver(() => {
      state.obs.disconnect();
      render();
      state.obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'aria-hidden', 'hidden'] });
    });
    state.obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'aria-hidden', 'hidden'] });
  }
  toggleObs.addEventListener('click', () => {
    if (!obsOn) {
      startObserving();
      obsOn = true;
      toggleObs.textContent = '⟳ Auto-update: on';
      toggleObs.setAttribute('aria-pressed', 'true');
    } else {
      if (state.obs) { state.obs.disconnect(); state.obs = null; }
      obsOn = false;
      toggleObs.textContent = '⟳ Auto-update: off';
      toggleObs.setAttribute('aria-pressed', 'false');
    }
  });

  prevBtn.addEventListener('click', () => goTo(-1));
  nextBtn.addEventListener('click', () => goTo(1));

  exportBtn.addEventListener('click', async () => {
    const lines = state.headings.map(el => {
      const level = getHeadingLevel(el);
      const indent = '  '.repeat(Math.max(0, (level || 1) - 1));
      return `${indent}H${level || '?'}: ${textFor(el) || '(empty)'}`;
    });
    const outline = lines.join('\n');
    try {
      await navigator.clipboard.writeText(outline);
      liveRegion.textContent = 'Heading outline copied to clipboard.';
      const original = exportBtn.textContent;
      exportBtn.textContent = '✓ Copied';
      setTimeout(() => { exportBtn.textContent = original; }, 1400);
    } catch (err) {
      console.log(outline);
      liveRegion.textContent = 'Could not copy automatically; outline logged to console.';
    }
  });

  // Close/cleanup
  function cleanup() {
    document.removeEventListener('keydown', keyHandler);
    if (state.obs) { state.obs.disconnect(); state.obs = null; }
    for (const b of state.badges) if (b.parentNode) b.parentNode.removeChild(b);
    if (state.panel && state.panel.parentNode) state.panel.parentNode.removeChild(state.panel);
    if (state.styleEl && state.styleEl.parentNode) state.styleEl.parentNode.removeChild(state.styleEl);
    if (lastFocusedBeforeOpen && lastFocusedBeforeOpen.focus) {
      try { lastFocusedBeforeOpen.focus(); } catch (e) {}
    }
    delete window.__a11yHeadingOverlay;
  }
  closeBtn.addEventListener('click', cleanup);

  function keyHandler(e) {
    if (e.key === 'Escape') { cleanup(); return; }
    if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); goTo(1); }
    if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); goTo(-1); }
  }
  document.addEventListener('keydown', keyHandler);

  window.__a11yHeadingOverlay = { cleanup, render };

  closeBtn.focus();
})();
