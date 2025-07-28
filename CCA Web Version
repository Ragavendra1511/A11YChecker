javascript:(function(){
if(window.accessibilityContrastChecker){window.accessibilityContrastChecker.toggle();return;}

// Color utilities
const ColorUtils = {
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return {h: h * 360, s: s * 100, l: l * 100};
  },

  rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return {h: h * 360, s: s * 100, v: v * 100};
  },

  parseColor(colorStr) {
    // Handle edge cases
    if (!colorStr || colorStr === 'transparent') return null;
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = colorStr;
      ctx.fillRect(0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      return {r: data[0], g: data[1], b: data[2], a: data[3] / 255};
    } catch (e) {
      console.warn('Could not parse color:', colorStr);
      return null;
    }
  },

  getLuminance(r, g, b) {
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const R = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const G = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const B = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  },

  getContrast(color1, color2) {
    const lum1 = this.getLuminance(color1.r, color1.g, color1.b);
    const lum2 = this.getLuminance(color2.r, color2.g, color2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  simulateColorBlindness(r, g, b, type) {
    const matrices = {
      protanopia: [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]],
      deuteranopia: [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]],
      tritanopia: [[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]]
    };
    
    const matrix = matrices[type];
    if (!matrix) return {r, g, b};
    
    return {
      r: Math.round(Math.max(0, Math.min(255, r * matrix[0][0] + g * matrix[0][1] + b * matrix[0][2]))),
      g: Math.round(Math.max(0, Math.min(255, r * matrix[1][0] + g * matrix[1][1] + b * matrix[1][2]))),
      b: Math.round(Math.max(0, Math.min(255, r * matrix[2][0] + g * matrix[2][1] + b * matrix[2][2])))
    };
  }
};

// Main contrast checker class
class AccessibilityContrastChecker {
  constructor() {
    this.isVisible = false;
    this.hoverMode = false;
    this.boxSelectMode = false;
    this.isSelecting = false;
    this.issues = [];
    this.highlightedElements = [];
    this.colorPalettes = this.loadPalettes();
    this.currentColorFormat = 'hex';
    this.observer = null;
    this.tooltip = null;
    this.hoverHandler = null;
    this.mouseLeaveHandler = null;
    this.boxStartHandler = null;
    this.boxMoveHandler = null;
    this.boxEndHandler = null;
    this.init();
  }

  init() {
    this.createUI();
    this.setupEventListeners();
    this.setupMutationObserver();
  }

  loadPalettes() {
    try {
      const saved = localStorage.getItem('acc-contrast-palettes');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  savePalettes() {
    try {
      localStorage.setItem('acc-contrast-palettes', JSON.stringify(this.colorPalettes));
    } catch (e) {
      console.warn('Could not save palettes to localStorage');
    }
  }

  createUI() {
    // Remove any existing overlay
    const existing = document.getElementById('acc-contrast-overlay');
    if (existing) existing.remove();

    // Main overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'acc-contrast-overlay';
    this.overlay.innerHTML = `
      <div class="acc-header">
        <h3>Accessibility Contrast Checker</h3>
        <div class="acc-controls">
          <button id="acc-minimize">−</button>
          <button id="acc-close">×</button>
        </div>
      </div>
      <div class="acc-content">
        <div class="acc-tabs">
          <button class="acc-tab active" data-tab="checker">Checker</button>
          <button class="acc-tab" data-tab="results">Results</button>
          <button class="acc-tab" data-tab="settings">Settings</button>
        </div>
        
        <div class="acc-tab-content active" id="acc-checker">
          <div class="acc-section">
            <h4>Color Picker</h4>
            <div class="acc-color-inputs">
              <div class="acc-color-group">
                <label>Foreground:</label>
                <input type="color" id="acc-fg-color" value="#000000">
                <input type="text" id="acc-fg-text" value="#000000">
              </div>
              <div class="acc-color-group">
                <label>Background:</label>
                <input type="color" id="acc-bg-color" value="#ffffff">
                <input type="text" id="acc-bg-text" value="#ffffff">
              </div>
            </div>
            <div class="acc-format-selector">
              <select id="acc-color-format">
                <option value="hex">HEX</option>
                <option value="rgb">RGB</option>
                <option value="hsl">HSL</option>
                <option value="hsv">HSV</option>
              </select>
            </div>
            <div class="acc-contrast-result">
              <div id="acc-contrast-ratio">Contrast: 21.00:1</div>
              <div id="acc-wcag-status">✅ WCAG AA Pass</div>
            </div>
          </div>

          <div class="acc-section">
            <h4>Analysis Tools</h4>
            <div class="acc-buttons">
              <button id="acc-scan-all">🔍 Scan All Elements</button>
              <button id="acc-hover-mode">👆 Hover Mode</button>
              <button id="acc-box-select">📦 Box Select</button>
              <button id="acc-clear-highlights">🧹 Clear Highlights</button>
            </div>
          </div>

          <div class="acc-section">
            <h4>Color Adjustment</h4>
            <div class="acc-sliders">
              <div class="acc-slider-group">
                <label>Lighten/Darken Text:</label>
                <input type="range" id="acc-text-adjust" min="-100" max="100" value="0">
                <span id="acc-text-value">0</span>
              </div>
              <div class="acc-slider-group">
                <label>Lighten/Darken Background:</label>
                <input type="range" id="acc-bg-adjust" min="-100" max="100" value="0">
                <span id="acc-bg-value">0</span>
              </div>
            </div>
          </div>
        </div>

        <div class="acc-tab-content" id="acc-results">
          <div class="acc-section">
            <h4>Issues Found</h4>
            <div class="acc-issue-filters">
              <button class="acc-filter active" data-filter="all">All</button>
              <button class="acc-filter" data-filter="1.4.3">1.4.3 Text</button>
              <button class="acc-filter" data-filter="1.4.11">1.4.11 Non-text</button>
            </div>
            <div id="acc-issues-list"></div>
          </div>
        </div>

        <div class="acc-tab-content" id="acc-settings">
          <div class="acc-section">
            <h4>Color Blindness Simulation</h4>
            <select id="acc-colorblind-sim">
              <option value="none">None</option>
              <option value="protanopia">Protanopia</option>
              <option value="deuteranopia">Deuteranopia</option>
              <option value="tritanopia">Tritanopia</option>
            </select>
          </div>
          
          <div class="acc-section">
            <h4>Color Palettes</h4>
            <div class="acc-palette-controls">
              <input type="text" id="acc-palette-name" placeholder="Palette name">
              <button id="acc-save-palette">Save Current Colors</button>
            </div>
            <div id="acc-saved-palettes"></div>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #acc-contrast-overlay {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        max-height: 80vh;
        background: #fff;
        border: 2px solid #333;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        overflow: hidden;
        cursor: move;
      }
      
      .acc-header {
        background: #333;
        color: #FFFFFF;
        padding: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
      }
      
      .acc-header h3 {
        margin: 0;
        font-size: 16px;
        color: #FFFFFF;
      }
      
      .acc-controls button {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        margin-left: 5px;
        padding: 0 5px;
      }
      
      .acc-controls button:hover {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }
      
      .acc-content {
        max-height: 70vh;
        overflow-y: auto;
      }
      
      .acc-tabs {
        display: flex;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
      }
      
      .acc-tab {
        flex: 1;
        padding: 10px;
        border: none;
        background: none;
        cursor: pointer;
        border-bottom: 2px solid transparent;
      }
      
      .acc-tab.active {
        background: white;
        border-bottom-color: #007cba;
      }
      
      .acc-tab-content {
        display: none;
        padding: 15px;
      }
      
      .acc-tab-content.active {
        display: block;
      }
      
      .acc-section {
        margin-bottom: 20px;
      }
      
      .acc-section h4 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 14px;
        font-weight: 600;
      }
      
      .acc-color-inputs {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .acc-color-group {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .acc-color-group label {
        width: 80px;
        font-weight: 500;
      }
      
      .acc-color-group input[type="color"] {
        width: 40px;
        height: 30px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .acc-color-group input[type="text"] {
        flex: 1;
        padding: 5px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: monospace;
      }
      
      .acc-format-selector {
        margin: 10px 0;
      }
      
      .acc-format-selector select {
        padding: 5px;
        border: 1px solid #ddd;
        border-radius: 4px;
        width: 100%;
      }
      
      .acc-contrast-result {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        text-align: center;
        margin: 10px 0;
      }
      
      #acc-contrast-ratio {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      #acc-wcag-status {
        font-size: 14px;
      }
      
      .acc-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      
      .acc-buttons button {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 12px;
      }
      
      .acc-buttons button:hover {
        background: #f0f0f0;
      }
      
      .acc-buttons button.active {
        background: #007cba;
        color: white;
        border-color: #007cba;
      }
      
      .acc-sliders {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      
      .acc-slider-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .acc-slider-group label {
        font-size: 12px;
        font-weight: 500;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .acc-slider-group input[type="range"] {
        width: 100%;
      }
      
      .acc-issue-filters {
        display: flex;
        gap: 5px;
        margin-bottom: 15px;
      }
      
      .acc-filter {
        padding: 5px 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 12px;
      }
      
      .acc-filter.active {
        background: #007cba;
        color: white;
        border-color: #007cba;
      }
      
      #acc-issues-list {
        max-height: 300px;
        overflow-y: auto;
      }
      
      .acc-issue-item {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-bottom: 10px;
        cursor: pointer;
        background: white;
      }
      
      .acc-issue-item:hover {
        background: #f8f9fa;
      }
      
      .acc-issue-header {
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .acc-issue-details {
        font-size: 12px;
        color: #666;
      }
      
      .acc-issue-details button {
        margin-top: 5px;
        margin-right: 5px;
        padding: 2px 6px;
        font-size: 11px;
        border: 1px solid #ddd;
        background: white;
        cursor: pointer;
        border-radius: 3px;
      }
      
      .acc-issue-details button:hover {
        background: #f0f0f0;
      }
      
      .acc-palette-controls {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .acc-palette-controls input {
        flex: 1;
        padding: 5px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      
      .acc-palette-controls button {
        padding: 5px 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 12px;
      }
      
      .acc-palette-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-bottom: 5px;
      }
      
      .acc-palette-colors {
        display: flex;
        gap: 5px;
        margin-top: 5px;
      }
      
      .acc-palette-color {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 1px solid #ddd;
      }
      
      .acc-palette-item button {
        padding: 2px 6px;
        font-size: 11px;
        margin-left: 5px;
        border: 1px solid #ddd;
        background: white;
        cursor: pointer;
        border-radius: 3px;
      }
      
      .acc-highlight-pass {
        outline: 2px solid #28a745 !important;
        outline-offset: 2px !important;
      }
      
      .acc-highlight-fail {
        outline: 2px solid #dc3545 !important;
        outline-offset: 2px !important;
      }
      
      .acc-tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        z-index: 1000000;
        max-width: 250px;
      }
      
      .acc-box-selector {
        position: absolute;
        border: 2px dashed #007cba;
        background: rgba(0, 123, 186, 0.1);
        pointer-events: none;
        z-index: 999998;
      }
      
      .acc-minimized .acc-content {
        display: none;
      }
      
      .acc-minimized {
        height: auto;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(this.overlay);
    
    this.makeDraggable();
    this.updatePalettesDisplay();
  }

  makeDraggable() {
    const header = this.overlay.querySelector('.acc-header');
    let isDragging = false;
    let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

    const dragStart = (e) => {
      if (e.target.tagName === 'BUTTON') return;
      isDragging = true;
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      e.preventDefault();
    };

    const dragMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;
      this.overlay.style.transform = `translate(${currentX}px, ${currentY}px)`;
    };

    const dragEnd = () => {
      isDragging = false;
    };

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);
  }

  setupEventListeners() {
    // Tab switching
    this.overlay.querySelectorAll('.acc-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // Close and minimize
    this.overlay.querySelector('#acc-close').addEventListener('click', () => this.hide());
    this.overlay.querySelector('#acc-minimize').addEventListener('click', () => this.toggleMinimize());

    // Color inputs
    this.overlay.querySelector('#acc-fg-color').addEventListener('input', (e) => {
      this.overlay.querySelector('#acc-fg-text').value = e.target.value;
      this.updateContrast();
    });

    this.overlay.querySelector('#acc-bg-color').addEventListener('input', (e) => {
      this.overlay.querySelector('#acc-bg-text').value = e.target.value;
      this.updateContrast();
    });

    this.overlay.querySelector('#acc-fg-text').addEventListener('input', (e) => {
      const color = ColorUtils.parseColor(e.target.value);
      if (color) {
        this.overlay.querySelector('#acc-fg-color').value = ColorUtils.rgbToHex(color.r, color.g, color.b);
      }
      this.updateContrast();
    });

    this.overlay.querySelector('#acc-bg-text').addEventListener('input', (e) => {
      const color = ColorUtils.parseColor(e.target.value);
      if (color) {
        this.overlay.querySelector('#acc-bg-color').value = ColorUtils.rgbToHex(color.r, color.g, color.b);
      }
      this.updateContrast();
    });

    // Color format selector
    this.overlay.querySelector('#acc-color-format').addEventListener('change', (e) => {
      this.currentColorFormat = e.target.value;
      this.updateColorInputs();
    });

    // Analysis buttons
    this.overlay.querySelector('#acc-scan-all').addEventListener('click', () => this.scanAllElements());
    this.overlay.querySelector('#acc-hover-mode').addEventListener('click', () => this.toggleHoverMode());
    this.overlay.querySelector('#acc-box-select').addEventListener('click', () => this.toggleBoxSelect());
    this.overlay.querySelector('#acc-clear-highlights').addEventListener('click', () => this.clearHighlights());

    // Sliders
    const textSlider = this.overlay.querySelector('#acc-text-adjust');
    const bgSlider = this.overlay.querySelector('#acc-bg-adjust');
    const textValue = this.overlay.querySelector('#acc-text-value');
    const bgValue = this.overlay.querySelector('#acc-bg-value');
    
    textSlider.addEventListener('input', (e) => {
      textValue.textContent = e.target.value;
      this.updateContrast();
    });

    bgSlider.addEventListener('input', (e) => {
      bgValue.textContent = e.target.value;
      this.updateContrast();
    });

    // Issue filters
    this.overlay.querySelectorAll('.acc-filter').forEach(filter => {
      filter.addEventListener('click', () => this.filterIssues(filter.dataset.filter));
    });

    // Palette management
    this.overlay.querySelector('#acc-save-palette').addEventListener('click', () => this.savePalette());

    // Color blindness simulation
    this.overlay.querySelector('#acc-colorblind-sim').addEventListener('change', () => this.updateContrast());

    // Initialize contrast display
    this.updateContrast();
  }

  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      if (this.hoverMode) return;
      
      let shouldRescan = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (let node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE && !node.closest('#acc-contrast-overlay')) {
              shouldRescan = true;
              break;
            }
          }
        }
      });
      
      if (shouldRescan) {
        this.debounce(() => this.rescanNewElements(), 500)();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  switchTab(tabName) {
    this.overlay.querySelectorAll('.acc-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    this.overlay.querySelectorAll('.acc-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `acc-${tabName}`);
    });
  }

  toggleMinimize() {
    this.overlay.classList.toggle('acc-minimized');
  }

  updateContrast() {
    const fgHex = this.overlay.querySelector('#acc-fg-text').value;
    const bgHex = this.overlay.querySelector('#acc-bg-text').value;
    
    const fgColor = ColorUtils.parseColor(fgHex);
    const bgColor = ColorUtils.parseColor(bgHex);
    
    if (!fgColor || !bgColor) return;

    // Apply adjustments
    const textAdjust = parseInt(this.overlay.querySelector('#acc-text-adjust').value);
    const bgAdjust = parseInt(this.overlay.querySelector('#acc-bg-adjust').value);
    
    const adjustedFg = this.adjustBrightness(fgColor, textAdjust);
    const adjustedBg = this.adjustBrightness(bgColor, bgAdjust);

    // Apply color blindness simulation
    const cbSim = this.overlay.querySelector('#acc-colorblind-sim').value;
    const simFg = cbSim !== 'none' ? ColorUtils.simulateColorBlindness(adjustedFg.r, adjustedFg.g, adjustedFg.b, cbSim) : adjustedFg;
    const simBg = cbSim !== 'none' ? ColorUtils.simulateColorBlindness(adjustedBg.r, adjustedBg.g, adjustedBg.b, cbSim) : adjustedBg;

    const contrast = ColorUtils.getContrast(simFg, simBg);
    
    this.overlay.querySelector('#acc-contrast-ratio').textContent = `Contrast: ${contrast.toFixed(2)}:1`;
    
    const passAA = contrast >= 4.5;
    const passAAA = contrast >= 7;
    const passLarge = contrast >= 3;
    
    let status = '';
    if (passAAA) status = '✅ WCAG AAA Pass';
    else if (passAA) status = '✅ WCAG AA Pass';
    else if (passLarge) status = '⚠️ Large Text Only';
    else status = '❌ WCAG Fail';
    
    this.overlay.querySelector('#acc-wcag-status').textContent = status;
    
    // Update color inputs based on format
    this.updateColorInputs();
  }

  adjustBrightness(color, adjustment) {
    const factor = adjustment / 100;
    return {
      r: Math.max(0, Math.min(255, Math.round(color.r + (factor * (factor > 0 ? 255 - color.r : color.r))))),
      g: Math.max(0, Math.min(255, Math.round(color.g + (factor * (factor > 0 ? 255 - color.g : color.g))))),
      b: Math.max(0, Math.min(255, Math.round(color.b + (factor * (factor > 0 ? 255 - color.b : color.b)))))
    };
  }

  updateColorInputs() {
    const fgColor = ColorUtils.parseColor(this.overlay.querySelector('#acc-fg-color').value);
    const bgColor = ColorUtils.parseColor(this.overlay.querySelector('#acc-bg-color').value);
    
    if (!fgColor || !bgColor) return;

    const format = this.currentColorFormat;
    
    if (format === 'rgb') {
      this.overlay.querySelector('#acc-fg-text').value = `rgb(${fgColor.r}, ${fgColor.g}, ${fgColor.b})`;
      this.overlay.querySelector('#acc-bg-text').value = `rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`;
    } else if (format === 'hsl') {
      const fgHsl = ColorUtils.rgbToHsl(fgColor.r, fgColor.g, fgColor.b);
      const bgHsl = ColorUtils.rgbToHsl(bgColor.r, bgColor.g, bgColor.b);
      this.overlay.querySelector('#acc-fg-text').value = `hsl(${Math.round(fgHsl.h)}, ${Math.round(fgHsl.s)}%, ${Math.round(fgHsl.l)}%)`;
      this.overlay.querySelector('#acc-bg-text').value = `hsl(${Math.round(bgHsl.h)}, ${Math.round(bgHsl.s)}%, ${Math.round(bgHsl.l)}%)`;
    } else if (format === 'hsv') {
      const fgHsv = ColorUtils.rgbToHsv(fgColor.r, fgColor.g, fgColor.b);
      const bgHsv = ColorUtils.rgbToHsv(bgColor.r, bgColor.g, bgColor.b);
      this.overlay.querySelector('#acc-fg-text').value = `hsv(${Math.round(fgHsv.h)}, ${Math.round(fgHsv.s)}%, ${Math.round(fgHsv.v)}%)`;
      this.overlay.querySelector('#acc-bg-text').value = `hsv(${Math.round(bgHsv.h)}, ${Math.round(bgHsv.s)}%, ${Math.round(bgHsv.v)}%)`;
    } else {
      // Default to hex
      this.overlay.querySelector('#acc-fg-text').value = ColorUtils.rgbToHex(fgColor.r, fgColor.g, fgColor.b);
      this.overlay.querySelector('#acc-bg-text').value = ColorUtils.rgbToHex(bgColor.r, bgColor.g, bgColor.b);
    }
  }

  scanAllElements() {
    this.clearHighlights();
    this.issues = [];
    
    const elements = document.querySelectorAll('*:not(script):not(style):not(noscript):not(#acc-contrast-overlay):not(#acc-contrast-overlay *)');
    let processedCount = 0;
    const totalElements = elements.length;
    
    // Process elements in batches to avoid blocking the UI
    const batchSize = 50;
    let currentIndex = 0;
    
    const processBatch = () => {
      const endIndex = Math.min(currentIndex + batchSize, totalElements);
      
      for (let i = currentIndex; i < endIndex; i++) {
        this.analyzeElement(elements[i]);
        processedCount++;
      }
      
      currentIndex = endIndex;
      
      if (currentIndex < totalElements) {
        // Continue processing in next tick
        setTimeout(processBatch, 0);
      } else {
        // All done
        this.updateResultsTab();
        this.switchTab('results');
      }
    };
    
    processBatch();
  }

  analyzeElement(element) {
    try {
      const computedStyle = window.getComputedStyle(element);
      const textColor = this.getEffectiveTextColor(element);
      const bgColor = this.getEffectiveBackgroundColor(element);
      
      if (!textColor || !bgColor) return;
      
      const hasText = element.textContent && element.textContent.trim().length > 0;
      const hasVisibleContent = computedStyle.opacity !== '0' && 
                               computedStyle.visibility !== 'hidden' && 
                               computedStyle.display !== 'none';
      
      if (!hasVisibleContent) return;

      const contrast = ColorUtils.getContrast(textColor, bgColor);
      const fontSize = parseFloat(computedStyle.fontSize);
      const fontWeight = computedStyle.fontWeight;
      
      // Determine if text is large (18pt+ or 14pt+ bold)
      const isLargeText = fontSize >= 24 || (fontSize >= 18 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
      
      // WCAG thresholds
      const requiredRatio = isLargeText ? 3 : 4.5;
      const passes = contrast >= requiredRatio;
      
      // Check for non-text elements (1.4.11)
      const isNonTextElement = this.isNonTextElement(element);
      const nonTextPasses = isNonTextElement ? contrast >= 3 : true;
      
      if (hasText && !passes) {
        this.issues.push({
          element,
          type: '1.4.3',
          contrast: contrast.toFixed(2),
          required: requiredRatio,
          passes: false,
          textColor,
          bgColor,
          isLargeText,
          selector: this.getSelector(element)
        });
        
        element.classList.add('acc-highlight-fail');
        this.highlightedElements.push(element);
      } else if (hasText && passes) {
        element.classList.add('acc-highlight-pass');
        this.highlightedElements.push(element);
      }
      
      if (isNonTextElement && !nonTextPasses) {
        this.issues.push({
          element,
          type: '1.4.11',
          contrast: contrast.toFixed(2),
          required: 3,
          passes: false,
          textColor,
          bgColor,
          selector: this.getSelector(element)
        });
        
        if (!element.classList.contains('acc-highlight-fail')) {
          element.classList.add('acc-highlight-fail');
          this.highlightedElements.push(element);
        }
      }
    } catch (e) {
      // Skip elements that cause errors
      console.warn('Error analyzing element:', element, e);
    }
  }

  getEffectiveTextColor(element) {
    try {
      const style = window.getComputedStyle(element);
      const color = style.color;
      
      if (!color || color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
        return null;
      }
      
      return ColorUtils.parseColor(color);
    } catch (e) {
      return null;
    }
  }

  getEffectiveBackgroundColor(element) {
    let currentElement = element;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loops
    
    while (currentElement && currentElement !== document.documentElement && attempts < maxAttempts) {
      try {
        const style = window.getComputedStyle(currentElement);
        const bgColor = style.backgroundColor;
        
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          const parsed = ColorUtils.parseColor(bgColor);
          if (parsed && parsed.a > 0) {
            return parsed;
          }
        }
        
        currentElement = currentElement.parentElement;
        attempts++;
      } catch (e) {
        break;
      }
    }
    
    // Default to white if no background found
    return {r: 255, g: 255, b: 255, a: 1};
  }

  isNonTextElement(element) {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    
    // Common non-text elements that need contrast checking
    const nonTextElements = ['button', 'input', 'select', 'textarea'];
    const nonTextRoles = ['button', 'link', 'tab', 'menuitem'];
    
    return nonTextElements.includes(tagName) || 
           nonTextRoles.includes(role) ||
           element.hasAttribute('tabindex') || 
           element.onclick !== null;
  }

  getSelector(element) {
    try {
      if (element.id) {
        return `#${element.id}`;
      }
      
      let selector = element.tagName.toLowerCase();
      
      if (element.className && typeof element.className === 'string') {
        const classes = element.className.split(' ')
          .filter(c => c && !c.startsWith('acc-'))
          .slice(0, 3); // Limit to first 3 classes
        if (classes.length > 0) {
          selector += '.' + classes.join('.');
        }
      }
      
      // Add position if needed for disambiguation
      if (element.parentElement) {
        const siblings = Array.from(element.parentElement.children)
          .filter(el => el.tagName === element.tagName);
        
        if (siblings.length > 1) {
          const index = siblings.indexOf(element) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
      
      // Truncate very long selectors
      if (selector.length > 100) {
        selector = selector.substring(0, 97) + '...';
      }
      
      return selector;
    } catch (e) {
      return element.tagName.toLowerCase();
    }
  }

  toggleHoverMode() {
    this.hoverMode = !this.hoverMode;
    const button = this.overlay.querySelector('#acc-hover-mode');
    button.classList.toggle('active', this.hoverMode);
    
    if (this.hoverMode) {
      this.setupHoverListeners();
      document.body.style.cursor = 'crosshair';
    } else {
      this.removeHoverListeners();
      this.hideTooltip();
      document.body.style.cursor = '';
    }
  }

  setupHoverListeners() {
    this.hoverHandler = (e) => {
      if (e.target.closest('#acc-contrast-overlay')) return;
      
      const element = e.target;
      const textColor = this.getEffectiveTextColor(element);
      const bgColor = this.getEffectiveBackgroundColor(element);
      
      if (textColor && bgColor) {
        const contrast = ColorUtils.getContrast(textColor, bgColor);
        this.showTooltip(e, {
          textColor: ColorUtils.rgbToHex(textColor.r, textColor.g, textColor.b),
          bgColor: ColorUtils.rgbToHex(bgColor.r, bgColor.g, bgColor.b),
          contrast: contrast.toFixed(2),
          element: this.getSelector(element)
        });
        
        // Update color picker with hovered colors
        this.overlay.querySelector('#acc-fg-color').value = ColorUtils.rgbToHex(textColor.r, textColor.g, textColor.b);
        this.overlay.querySelector('#acc-fg-text').value = ColorUtils.rgbToHex(textColor.r, textColor.g, textColor.b);
        this.overlay.querySelector('#acc-bg-color').value = ColorUtils.rgbToHex(bgColor.r, bgColor.g, bgColor.b);
        this.overlay.querySelector('#acc-bg-text').value = ColorUtils.rgbToHex(bgColor.r, bgColor.g, bgColor.b);
        this.updateContrast();
      }
    };
    
    this.mouseLeaveHandler = () => {
      this.hideTooltip();
    };
    
    document.addEventListener('mouseover', this.hoverHandler);
    document.addEventListener('mouseleave', this.mouseLeaveHandler);
  }

  removeHoverListeners() {
    if (this.hoverHandler) {
      document.removeEventListener('mouseover', this.hoverHandler);
      document.removeEventListener('mouseleave', this.mouseLeaveHandler);
      this.hoverHandler = null;
      this.mouseLeaveHandler = null;
    }
  }

  showTooltip(event, data) {
    if (!this.tooltip) {
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'acc-tooltip';
      document.body.appendChild(this.tooltip);
    }
    
    this.tooltip.innerHTML = `
      <div><strong>${data.element}</strong></div>
      <div>Text: ${data.textColor}</div>
      <div>Background: ${data.bgColor}</div>
      <div>Contrast: ${data.contrast}:1</div>
    `;
    
    this.tooltip.style.display = 'block';
    
    // Position tooltip to avoid going off screen
    const tooltipRect = this.tooltip.getBoundingClientRect();
    let left = event.pageX + 10;
    let top = event.pageY - 10;
    
    if (left + tooltipRect.width > window.innerWidth) {
      left = event.pageX - tooltipRect.width - 10;
    }
    
    if (top + tooltipRect.height > window.innerHeight) {
      top = event.pageY - tooltipRect.height + 10;
    }
    
    this.tooltip.style.left = left + 'px';
    this.tooltip.style.top = top + 'px';
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }

  toggleBoxSelect() {
    this.boxSelectMode = !this.boxSelectMode;
    const button = this.overlay.querySelector('#acc-box-select');
    button.classList.toggle('active', this.boxSelectMode);
    
    if (this.boxSelectMode) {
      this.setupBoxSelectListeners();
      document.body.style.cursor = 'crosshair';
    } else {
      this.removeBoxSelectListeners();
      document.body.style.cursor = '';
      this.removeBoxSelector();
    }
  }

  setupBoxSelectListeners() {
    this.boxStartHandler = (e) => {
      if (e.target.closest('#acc-contrast-overlay')) return;
      
      this.isSelecting = true;
      this.startX = e.pageX;
      this.startY = e.pageY;
      
      this.createBoxSelector();
      e.preventDefault();
    };
    
    this.boxMoveHandler = (e) => {
      if (!this.isSelecting) return;
      
      const currentX = e.pageX;
      const currentY = e.pageY;
      
      const left = Math.min(this.startX, currentX);
      const top = Math.min(this.startY, currentY);
      const width = Math.abs(currentX - this.startX);
      const height = Math.abs(currentY - this.startY);
      
      this.updateBoxSelector(left, top, width, height);
    };
    
    this.boxEndHandler = (e) => {
      if (!this.isSelecting) return;
      
      this.isSelecting = false;
      const rect = this.boxSelector.getBoundingClientRect();
      this.analyzeElementsInBox(rect);
      this.removeBoxSelector();
      this.toggleBoxSelect(); // Exit box select mode
    };
    
    document.addEventListener('mousedown', this.boxStartHandler);
    document.addEventListener('mousemove', this.boxMoveHandler);
    document.addEventListener('mouseup', this.boxEndHandler);
  }

  removeBoxSelectListeners() {
    if (this.boxStartHandler) {
      document.removeEventListener('mousedown', this.boxStartHandler);
      document.removeEventListener('mousemove', this.boxMoveHandler);
      document.removeEventListener('mouseup', this.boxEndHandler);
      this.boxStartHandler = null;
      this.boxMoveHandler = null;
      this.boxEndHandler = null;
    }
  }

  createBoxSelector() {
    this.removeBoxSelector(); // Remove any existing selector
    this.boxSelector = document.createElement('div');
    this.boxSelector.className = 'acc-box-selector';
    document.body.appendChild(this.boxSelector);
  }

  updateBoxSelector(left, top, width, height) {
    if (this.boxSelector) {
      this.boxSelector.style.left = left + 'px';
      this.boxSelector.style.top = top + 'px';
      this.boxSelector.style.width = width + 'px';
      this.boxSelector.style.height = height + 'px';
    }
  }

  removeBoxSelector() {
    if (this.boxSelector) {
      this.boxSelector.remove();
      this.boxSelector = null;
    }
  }

  analyzeElementsInBox(rect) {
    this.clearHighlights();
    this.issues = [];
    
    const elements = document.querySelectorAll('*:not(script):not(style):not(noscript):not(#acc-contrast-overlay):not(#acc-contrast-overlay *)');
    
    elements.forEach(element => {
      try {
        const elementRect = element.getBoundingClientRect();
        
        // Check if element intersects with selection box
        if (this.rectsIntersect(rect, elementRect)) {
          this.analyzeElement(element);
        }
      } catch (e) {
        // Skip problematic elements
      }
    });
    
    this.updateResultsTab();
    this.switchTab('results');
  }

  rectsIntersect(rect1, rect2) {
    return !(rect1.right < rect2.left || 
             rect1.left > rect2.right || 
             rect1.bottom < rect2.top || 
             rect1.top > rect2.bottom);
  }

  clearHighlights() {
    this.highlightedElements.forEach(element => {
      try {
        element.classList.remove('acc-highlight-pass', 'acc-highlight-fail');
      } catch (e) {
        // Element might have been removed from DOM
      }
    });
    this.highlightedElements = [];
  }

  rescanNewElements() {
    // Only rescan elements that aren't already highlighted
    const elements = document.querySelectorAll('*:not(script):not(style):not(noscript):not(#acc-contrast-overlay):not(#acc-contrast-overlay *)');
    
    elements.forEach(element => {
      if (!element.classList.contains('acc-highlight-pass') && 
          !element.classList.contains('acc-highlight-fail')) {
        this.analyzeElement(element);
      }
    });
    
    this.updateResultsTab();
  }

  updateResultsTab() {
    const issuesList = this.overlay.querySelector('#acc-issues-list');
    
    if (this.issues.length === 0) {
      issuesList.innerHTML = '<div style="text-align: center; color: #28a745; padding: 20px;">✅ No accessibility issues found!</div>';
      return;
    }
    
    issuesList.innerHTML = this.issues.map((issue, index) => `
      <div class="acc-issue-item" data-type="${issue.type}" onclick="window.accessibilityContrastChecker.scrollToElement(${index})">
        <div class="acc-issue-header">
          ${issue.type === '1.4.3' ? '📝 Text Contrast' : '🎨 Non-text Contrast'} - ${issue.contrast}:1
        </div>
        <div class="acc-issue-details">
          Required: ${issue.required}:1 | Element: ${issue.selector}
          <br>Text: ${ColorUtils.rgbToHex(issue.textColor.r, issue.textColor.g, issue.textColor.b)} | 
          Background: ${ColorUtils.rgbToHex(issue.bgColor.r, issue.bgColor.g, issue.bgColor.b)}
          <br>
          <button onclick="window.accessibilityContrastChecker.copySelector('${issue.selector.replace(/'/g, "\\'")}'); event.stopPropagation();">Copy Selector</button>
          <button onclick="window.accessibilityContrastChecker.suggestColors(${issue.textColor.r}, ${issue.textColor.g}, ${issue.textColor.b}, ${issue.bgColor.r}, ${issue.bgColor.g}, ${issue.bgColor.b}); event.stopPropagation();">Suggest Fix</button>
        </div>
      </div>
    `).join('');
  }

  scrollToElement(index) {
    const issue = this.issues[index];
    
    if (issue && issue.element && document.contains(issue.element)) {
      issue.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Temporarily highlight the element
      const originalOutline = issue.element.style.outline;
      issue.element.style.outline = '4px solid #ff6b6b';
      issue.element.style.outlineOffset = '2px';
      
      setTimeout(() => {
        issue.element.style.outline = originalOutline;
        issue.element.style.outlineOffset = '';
      }, 2000);
    }
  }

  copySelector(selector) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(selector).then(() => {
        // Show brief success message
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#28a745';
        button.style.color = 'white';
        
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '';
          button.style.color = '';
        }, 1000);
      }).catch(() => {
        // Fallback for older browsers
        this.fallbackCopyTextToClipboard(selector);
      });
    } else {
      this.fallbackCopyTextToClipboard(selector);
    }
  }

  fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1000);
    } catch (err) {
      console.error('Could not copy text: ', err);
    }
    
    document.body.removeChild(textArea);
  }

  suggestColors(fgR, fgG, fgB, bgR, bgG, bgB) {
    const originalFg = {r: fgR, g: fgG, b: fgB};
    const originalBg = {r: bgR, g: bgG, b: bgB};
    
    // Try lightening/darkening background first
    const suggestions = [];
    
    // Lighten background
    for (let i = 10; i <= 90; i += 10) {
      const newBg = this.adjustBrightness(originalBg, i);
      const contrast = ColorUtils.getContrast(originalFg, newBg);
      if (contrast >= 4.5) {
        suggestions.push({
          type: 'Background lighter',
          bg: ColorUtils.rgbToHex(newBg.r, newBg.g, newBg.b),
          fg: ColorUtils.rgbToHex(originalFg.r, originalFg.g, originalFg.b),
          contrast: contrast.toFixed(2)
        });
        break;
      }
    }
    
    // Darken background
    for (let i = -10; i >= -90; i -= 10) {
      const newBg = this.adjustBrightness(originalBg, i);
      const contrast = ColorUtils.getContrast(originalFg, newBg);
      if (contrast >= 4.5) {
        suggestions.push({
          type: 'Background darker',
          bg: ColorUtils.rgbToHex(newBg.r, newBg.g, newBg.b),
          fg: ColorUtils.rgbToHex(originalFg.r, originalFg.g, originalFg.b),
          contrast: contrast.toFixed(2)
        });
        break;
      }
    }
    
    // Lighten foreground
    for (let i = 10; i <= 90; i += 10) {
      const newFg = this.adjustBrightness(originalFg, i);
      const contrast = ColorUtils.getContrast(newFg, originalBg);
      if (contrast >= 4.5) {
        suggestions.push({
          type: 'Text lighter',
          bg: ColorUtils.rgbToHex(originalBg.r, originalBg.g, originalBg.b),
          fg: ColorUtils.rgbToHex(newFg.r, newFg.g, newFg.b),
          contrast: contrast.toFixed(2)
        });
        break;
      }
    }
    
    // Darken foreground
    for (let i = -10; i >= -90; i -= 10) {
      const newFg = this.adjustBrightness(originalFg, i);
      const contrast = ColorUtils.getContrast(newFg, originalBg);
      if (contrast >= 4.5) {
        suggestions.push({
          type: 'Text darker',
          bg: ColorUtils.rgbToHex(originalBg.r, originalBg.g, originalBg.b),
          fg: ColorUtils.rgbToHex(newFg.r, newFg.g, newFg.b),
          contrast: contrast.toFixed(2)
        });
        break;
      }
    }
    
    if (suggestions.length > 0) {
      const suggestion = suggestions[0];
      const message = `Suggestion: ${suggestion.type}\nForeground: ${suggestion.fg}\nBackground: ${suggestion.bg}\nContrast: ${suggestion.contrast}:1\n\nApply this suggestion to the color picker?`;
      
      if (confirm(message)) {
        this.overlay.querySelector('#acc-fg-color').value = suggestion.fg;
        this.overlay.querySelector('#acc-fg-text').value = suggestion.fg;
        this.overlay.querySelector('#acc-bg-color').value = suggestion.bg;
        this.overlay.querySelector('#acc-bg-text').value = suggestion.bg;
        this.updateContrast();
        this.switchTab('checker');
      }
    } else {
      alert('No simple color adjustments found. Try using high contrast colors like black on white.');
    }
  }

  filterIssues(filter) {
    this.overlay.querySelectorAll('.acc-filter').forEach(f => {
      f.classList.toggle('active', f.dataset.filter === filter);
    });
    
    const issues = this.overlay.querySelectorAll('.acc-issue-item');
    issues.forEach(issue => {
      const type = issue.dataset.type;
      issue.style.display = (filter === 'all' || filter === type) ? 'block' : 'none';
    });
  }

  savePalette() {
    const name = this.overlay.querySelector('#acc-palette-name').value.trim();
    if (!name) {
      alert('Please enter a palette name');
      return;
    }
    
    const fgColor = this.overlay.querySelector('#acc-fg-text').value;
    const bgColor = this.overlay.querySelector('#acc-bg-text').value;
    
    this.colorPalettes[name] = { fg: fgColor, bg: bgColor };
    this.savePalettes();
    this.updatePalettesDisplay();
    this.overlay.querySelector('#acc-palette-name').value = '';
  }

  updatePalettesDisplay() {
    const container = this.overlay.querySelector('#acc-saved-palettes');
    
    if (Object.keys(this.colorPalettes).length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 10px; font-style: italic;">No saved palettes</div>';
      return;
    }
    
    container.innerHTML = Object.entries(this.colorPalettes).map(([name, colors]) => `
      <div class="acc-palette-item">
        <div>
          <strong>${name}</strong>
          <div class="acc-palette-colors">
            <div class="acc-palette-color" style="background-color: ${colors.fg}" title="Foreground: ${colors.fg}"></div>
            <div class="acc-palette-color" style="background-color: ${colors.bg}" title="Background: ${colors.bg}"></div>
          </div>
        </div>
        <div>
          <button onclick="window.accessibilityContrastChecker.loadPalette('${name.replace(/'/g, "\\'")}')">Load</button>
          <button onclick="window.accessibilityContrastChecker.deletePalette('${name.replace(/'/g, "\\'")}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  loadPalette(name) {
    const palette = this.colorPalettes[name];
    if (palette) {
      this.overlay.querySelector('#acc-fg-color').value = palette.fg;
      this.overlay.querySelector('#acc-fg-text').value = palette.fg;
      this.overlay.querySelector('#acc-bg-color').value = palette.bg;
      this.overlay.querySelector('#acc-bg-text').value = palette.bg;
      this.updateContrast();
    }
  }

  deletePalette(name) {
    if (confirm(`Delete palette "${name}"?`)) {
      delete this.colorPalettes[name];
      this.updatePalettesDisplay();
    }
  }

  show() {
    this.overlay.style.display = 'block';
    this.isVisible = true;
  }

  hide() {
    this.overlay.style.display = 'none';
    this.isVisible = false;
    this.clearHighlights();
    this.removeHoverListeners();
    this.removeBoxSelectListeners();
    this.hideTooltip();
    document.body.style.cursor = '';
    
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

// Initialize the contrast checker
window.accessibilityContrastChecker = new AccessibilityContrastChecker();
window.accessibilityContrastChecker.show();

})();
