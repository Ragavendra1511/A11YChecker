javascript:(function() {
    // Helper function to calculate relative luminance
    function getLuminance(r, g, b) {
        let [rs, gs, bs] = [r / 255, g / 255, b / 255].map(c => 
            c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        );
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    // Convert RGB to Hex
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    // Parse color string to RGB array
    function parseColor(color) {
        const div = document.createElement('div');
        div.style.display = 'none';
        div.style.color = color;
        document.body.appendChild(div);
        const computed = window.getComputedStyle(div).color;
        document.body.removeChild(div);
        
        const match = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null;
    }

    // Get background color including inherited backgrounds
    function getBackgroundColor(element) {
        const transparent = 'rgba(0, 0, 0, 0)';
        let el = element;
        let bg = transparent;

        // Create temporary canvas for sampling
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        while (el && el.nodeType === 1) {
            const style = window.getComputedStyle(el);
            bg = style.backgroundColor;
            
            // If element has background image
            if (style.backgroundImage !== 'none') {
                const rect = element.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                
                // Draw background color first
                if (bg !== transparent) {
                    ctx.fillStyle = bg;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // For gradients, simulate them on canvas
                if (style.backgroundImage.includes('gradient')) {
                    let gradient;
                    if (style.backgroundImage.includes('linear-gradient')) {
                        gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
                    } else {
                        gradient = ctx.createRadialGradient(
                            rect.width/2, rect.height/2, 0,
                            rect.width/2, rect.height/2, rect.width/2
                        );
                    }

                    // Extract colors from gradient
                    const colors = style.backgroundImage
                        .match(/\(([^)]+)\)/)[1]
                        .split(',')
                        .filter(c => /^#|^rgb|^hsl|^[a-z]/i.test(c.trim()));

                    colors.forEach((color, i) => {
                        gradient.addColorStop(i / (colors.length - 1), color.trim());
                    });

                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Sample the middle point
                    const imageData = ctx.getImageData(
                        Math.floor(rect.width / 2),
                        Math.floor(rect.height / 2),
                        1, 1
                    );
                    
                    return `rgb(${imageData.data[0]}, ${imageData.data[1]}, ${imageData.data[2]})`;
                }
            }

            if (bg !== transparent) break;
            el = el.parentElement;
        }

        return bg === transparent ? 'rgb(255, 255, 255)' : bg;
    }

    // Calculate contrast ratio
    function getContrastRatio(l1, l2) {
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    // Create the results panel
    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'contrast-checker-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2147483647;
            background: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            max-width: 300px;
            min-width: 250px;
        `;

        // Add toggle button
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Switch to Auto Picker';
        toggleButton.style.cssText = `
            position: absolute;
            top: 8px;
            right: 10px;
            padding: 4px 8px;
            background: #f0f0f0;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            z-index: 1;
        `;
        
        panel.appendChild(toggleButton);

        // Create containers for both modes
        const colorPickerContainer = document.createElement('div');
        colorPickerContainer.id = 'color-picker-container';
        
        const autoPickerContainer = document.createElement('div');
        autoPickerContainer.id = 'auto-picker-container';
        autoPickerContainer.style.display = 'none';
        
        panel.appendChild(colorPickerContainer);
        panel.appendChild(autoPickerContainer);

        // Toggle button click handler
        toggleButton.addEventListener('click', () => {
            const isColorPicker = colorPickerContainer.style.display !== 'none';
            colorPickerContainer.style.display = isColorPicker ? 'none' : 'block';
            autoPickerContainer.style.display = isColorPicker ? 'block' : 'none';
            toggleButton.textContent = isColorPicker ? 'Switch to Manual Picker' : 'Switch to Auto Picker';
            
            // Enable/disable click inspection based on mode
            if (isColorPicker) {
                document.addEventListener('click', inspectElement, true);
            } else {
                document.removeEventListener('click', inspectElement, true);
            }
        });

        return {
            panel,
            colorPickerContainer,
            autoPickerContainer
        };
    }

    // Main inspection function
    function inspectElement(e) {
        // Don't process if clicking on the panel
        if (e.target.closest('#contrast-checker-panel')) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        
        const target = e.target;
        const style = window.getComputedStyle(target);
        
        // Get colors
        const textColor = parseColor(style.color);
        const bgColor = parseColor(getBackgroundColor(target));
        
        if (!textColor || !bgColor) {
            alert('Could not determine colors for this element');
            return;
        }

        // Calculate contrast
        const textLuminance = getLuminance(...textColor);
        const bgLuminance = getLuminance(...bgColor);
        const ratio = getContrastRatio(textLuminance, bgLuminance);
        
        // WCAG criteria
        const wcag = {
            AA_large: ratio >= 3,
            AA_small: ratio >= 4.5,
            AAA_large: ratio >= 4.5,
            AAA_small: ratio >= 7
        };

        const textHex = rgbToHex(...textColor);
        const bgHex = rgbToHex(...bgColor);

        // Update the auto picker container
        const container = document.getElementById('auto-picker-container');
        if (container) {
            container.innerHTML = `
                <div style="margin-bottom: 12px;">
                    <strong>Element:</strong> ${target.tagName.toLowerCase()}
                    ${target.id ? '#' + target.id : ''}
                    ${Array.from(target.classList).map(c => '.' + c).join('')}
                </div>
                <div style="margin-bottom: 12px;">
                    <strong>Contrast Ratio:</strong> ${ratio.toFixed(2)}:1
                </div>
                <div style="margin-bottom: 12px;">
                    <strong>WCAG 2.1 Compliance:</strong>
                    <ul style="margin: 8px 0; padding-left: 20px;">
                        <li style="color: ${wcag.AA_large ? '#2da44e' : '#cf222e'}">
                            AA Large Text (3:1) ${wcag.AA_large ? '✓' : '✗'}
                        </li>
                        <li style="color: ${wcag.AA_small ? '#2da44e' : '#cf222e'}">
                            AA Small Text (4.5:1) ${wcag.AA_small ? '✓' : '✗'}
                        </li>
                        <li style="color: ${wcag.AAA_large ? '#2da44e' : '#cf222e'}">
                            AAA Large Text (4.5:1) ${wcag.AAA_large ? '✓' : '✗'}
                        </li>
                        <li style="color: ${wcag.AAA_small ? '#2da44e' : '#cf222e'}">
                            AAA Small Text (7:1) ${wcag.AAA_small ? '✓' : '✗'}
                        </li>
                    </ul>
                </div>
                <div>
                    <strong>Colors:</strong>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                        <div>
                            Text: <div style="width: 24px; height: 24px; background: rgb(${textColor.join(',')}); border: 1px solid #ddd; display: inline-block; vertical-align: middle; margin: 0 8px;"></div>
                            <code style="background: #f6f8fa; padding: 2px 4px; border-radius: 3px; font-family: monospace;">${textHex}</code>
                        </div>
                        <div>
                            Background: <div style="width: 24px; height: 24px; background: rgb(${bgColor.join(',')}); border: 1px solid #ddd; display: inline-block; vertical-align: middle; margin: 0 8px;"></div>
                            <code style="background: #f6f8fa; padding: 2px 4px; border-radius: 3px; font-family: monospace;">${bgHex}</code>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Make panel draggable
    function makeDraggable(panel) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        // Create drag handle
        const dragHandle = document.createElement('div');
        dragHandle.style.cssText = `
            padding: 8px;
            cursor: move;
            background: #f0f0f0;
            margin: -15px -15px 10px -15px;
            border-radius: 5px 5px 0 0;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        dragHandle.innerHTML = `
            <div style="flex: 1;">
                <strong>Color Contrast Checker</strong> (Drag to move)
            </div>
        `;
        panel.insertBefore(dragHandle, panel.firstChild);

        // Move toggle button inside drag handle for better layout
        const toggleButton = panel.querySelector('button');
        if (toggleButton) {
            toggleButton.style.position = 'static';  // Remove absolute positioning
            toggleButton.style.marginLeft = '10px';  // Add some spacing
            dragHandle.appendChild(toggleButton);
        }

        dragHandle.addEventListener('mousedown', dragStart);

        function dragStart(e) {
            initialX = e.clientX - panel.offsetLeft;
            initialY = e.clientY - panel.offsetTop;
            if (e.target === dragHandle) {
                isDragging = true;
            }
        }

        function dragEnd() {
            isDragging = false;
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                // Keep panel within viewport
                currentX = Math.min(Math.max(currentX, 0), window.innerWidth - panel.offsetWidth);
                currentY = Math.min(Math.max(currentY, 0), window.innerHeight - panel.offsetHeight);

                panel.style.left = currentX + 'px';
                panel.style.top = currentY + 'px';
            }
        }

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
    }

    // Create color picker section
    function createColorPicker(panel) {
        const pickerSection = document.createElement('div');
        pickerSection.style.cssText = `
            margin: 15px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        `;
        pickerSection.innerHTML = `
            <div style="margin-bottom: 15px;">
                <strong>Color Picker</strong>
            </div>
            <div style="margin-bottom: 10px;">
                <label>Text Color:</label><br>
                <input type="color" id="textColorPicker" style="margin: 5px 0;">
                <input type="text" id="textColorHex" placeholder="#000000" 
                    style="width: 80px; padding: 2px 5px; margin-left: 5px;">
            </div>
            <div style="margin-bottom: 10px;">
                <label>Background Color:</label><br>
                <input type="color" id="bgColorPicker" style="margin: 5px 0;">
                <input type="text" id="bgColorHex" placeholder="#FFFFFF" 
                    style="width: 80px; padding: 2px 5px; margin-left: 5px;">
            </div>
            <div id="pickerResults" style="margin-top: 15px;">
                Select colors to see contrast ratio
            </div>
        `;
        panel.appendChild(pickerSection);

        // Add color picker event listeners
        const textPicker = document.getElementById('textColorPicker');
        const bgPicker = document.getElementById('bgColorPicker');
        const textHex = document.getElementById('textColorHex');
        const bgHex = document.getElementById('bgColorHex');
        const results = document.getElementById('pickerResults');

        function updateResults() {
            const textColor = parseColor(textHex.value || textPicker.value);
            const bgColor = parseColor(bgHex.value || bgPicker.value);
            
            if (textColor && bgColor) {
                const textLuminance = getLuminance(...textColor);
                const bgLuminance = getLuminance(...bgColor);
                const ratio = getContrastRatio(textLuminance, bgLuminance);
                
                results.innerHTML = `
                    <strong>Contrast Ratio: ${ratio.toFixed(2)}:1</strong><br>
                    <span style="color: ${ratio >= 4.5 ? 'green' : 'red'}">
                        ${ratio >= 4.5 ? '✓' : '✗'} WCAG AA Standard (4.5:1)
                    </span><br>
                    <span style="color: ${ratio >= 7 ? 'green' : 'red'}">
                        ${ratio >= 7 ? '✓' : '✗'} WCAG AAA Standard (7:1)
                    </span>
                `;
            }
        }

        // Event listeners for color pickers and hex inputs
        textPicker.addEventListener('input', () => {
            textHex.value = textPicker.value.toUpperCase();
            updateResults();
        });
        bgPicker.addEventListener('input', () => {
            bgHex.value = bgPicker.value.toUpperCase();
            updateResults();
        });
        textHex.addEventListener('change', () => {
            if (/^#[0-9A-F]{6}$/i.test(textHex.value)) {
                textPicker.value = textHex.value;
                updateResults();
            }
        });
        bgHex.addEventListener('change', () => {
            if (/^#[0-9A-F]{6}$/i.test(bgHex.value)) {
                bgPicker.value = bgHex.value;
                updateResults();
            }
        });
    }

    // Initialize
    function init() {
        const { panel, colorPickerContainer, autoPickerContainer } = createPanel();
        document.body.appendChild(panel);
        
        // Make panel draggable
        makeDraggable(panel);
        
        // Add color picker to the color picker container
        createColorPicker(colorPickerContainer);
        
        // Start with manual color picker mode
        document.removeEventListener('click', inspectElement, true);
        
        // Add escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Remove event listeners
                document.removeEventListener('click', inspectElement, true);
                
                // Remove the panel
                if (panel && panel.parentNode) {
                    panel.parentNode.removeChild(panel);
                }
            }
        });
        
        alert('Press ESC key to close the color contrast checker');
    }

    init();
})();