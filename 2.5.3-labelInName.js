javascript:(function() {
        // Load html2canvas
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = function() {
            // Your main code here
            checkLabelInName();
        };
        document.head.appendChild(script);
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'a11y-check-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: 380px;
        height: 100vh;
        background-color: #ffffff;
        color: #333333;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
        padding: 20px;
        box-sizing: border-box;
        z-index: 9999;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
        border-left: 1px solid #e0e0e0;
    `;

    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
        margin-bottom: 20px;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 15px;
    `;
    header.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0; color: #2c3e50; font-size: 20px;">Accessibility Checker</h2>
            <button id="a11y-close-btn" style="background: none; border: none; cursor: pointer; font-size: 22px; color: #555;">×</button>
        </div>
        <p style="margin: 8px 0 0; color: #5d6778; font-size: 14px;">Checking if visible text appears in accessible names</p>
    `;
    
    // Create results container
    const resultsContainer = document.createElement('div');
    resultsContainer.style.cssText = `
        flex: 1;
        overflow-y: auto;
        margin-bottom: 15px;
        padding-right: 5px;
    `;

    // Create summary container
    const summaryContainer = document.createElement('div');
    summaryContainer.style.cssText = `
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
    `;

    // Create filter controls
    const filterContainer = document.createElement('div');
    filterContainer.style.cssText = `
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
    `;

    // Add components to overlay
    overlay.appendChild(header);
    overlay.appendChild(summaryContainer);
    overlay.appendChild(filterContainer);
    overlay.appendChild(resultsContainer);

    // Add overlay to body
    document.body.appendChild(overlay);
    
    // Function to highlight element
    function highlightElement(element) {
        const originalOutline = element.style.outline;
        const originalBoxShadow = element.style.boxShadow;
        
        element.style.outline = 'none';
        element.style.boxShadow = '0 0 0 3px #4299e1, 0 0 0 6px rgba(66, 153, 225, 0.3)';
        
        setTimeout(() => {
            element.style.outline = originalOutline;
            element.style.boxShadow = originalBoxShadow;
        }, 2000);
    }

    // Function to generate XPath for an element
    function getXPath(element) {
        if (!element) return '';
        
        if (element.id !== '') {
            return `//*[@id="${element.id}"]`;
        }
        
        if (element === document.body) {
            return '/html/body';
        }

        let ix = 0;
        const siblings = element.parentNode.childNodes;
        
        for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            
            if (sibling === element) {
                return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
            }
            
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                ix++;
            }
        }
    }

    // Function to copy text to clipboard
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        try {
            const successful = document.execCommand('copy');
            const msg = successful ? 'successful' : 'unsuccessful';
            console.log('Copying text was ' + msg);
        } catch (err) {
            console.error('Unable to copy', err);
        }
        
        document.body.removeChild(textarea);
    }

    // Function to create a copy button
    function createCopyButton(text) {
        const button = document.createElement('button');
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        `;
        button.style.cssText = `
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 4px;
            cursor: pointer;
            color: #64748b;
            transition: all 0.2s ease;
        `;
        button.title = "Copy to clipboard";
        
        button.addEventListener('mouseover', function() {
            this.style.background = '#f1f5f9';
            this.style.color = '#475569';
        });
        
        button.addEventListener('mouseout', function() {
            this.style.background = '#f8fafc';
            this.style.color = '#64748b';
        });
        
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            copyToClipboard(text);
            
            // Visual feedback
            const originalBackground = this.style.background;
            const originalColor = this.style.color;
            
            this.style.background = '#10b981';
            this.style.color = 'white';
            
            setTimeout(() => {
                this.style.background = originalBackground;
                this.style.color = originalColor;
            }, 1000);
        });
        
        return button;
    }

    // Function to capture element screenshot
    function captureElementScreenshot(element) {
        return new Promise((resolve) => {
            const rect = element.getBoundingClientRect();
            const padding = 10; // Add some padding
            
            // Skip if element is not visible
            if (rect.width === 0 || rect.height === 0) {
                resolve(null);
                return;
            }
            
            // Create canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.width = rect.width + (padding * 2);
            canvas.height = rect.height + (padding * 2);
            
            // Draw highlighted box
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add a border
            context.strokeStyle = '#ef4444';
            context.lineWidth = 2;
            context.strokeRect(padding, padding, rect.width, rect.height);
            
            // Convert to data URL
            try {
                html2canvas(element, {
                    backgroundColor: null,
                    scale: 1,
                    logging: false,
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height
                }).then(elementCanvas => {
                    context.drawImage(elementCanvas, padding, padding, rect.width, rect.height);
                    resolve(canvas.toDataURL('image/png'));
                }).catch(() => {
                    // Fallback in case html2canvas fails
                    resolve(null);
                });
            } catch (e) {
                // html2canvas might not be available, so just resolve with null
                resolve(null);
            }
        });
    }

    // Check function
    function checkLabelInName() {
        resultsContainer.innerHTML = '';
        let results = {
            pass: [],
            fail: [],
            notApplicable: []
        };
    
        // List of widget roles that support name from content
        const widgetRoles = [
            'button', 'checkbox', 'gridcell', 'link', 'menuitem', 'menuitemcheckbox',
            'menuitemradio', 'option', 'radio', 'searchbox', 'switch', 'tab', 'treeitem'
        ];
    
        // Select all interactive elements
        const elements = document.querySelectorAll('a, button, [role]');
    
        elements.forEach(element => {
            const role = element.getAttribute('role') || element.tagName.toLowerCase();
            const ariaLabel = element.getAttribute('aria-label');
            const ariaLabelledby = element.getAttribute('aria-labelledby');
            const visibleText = element.textContent.trim();
            const ariaHidden = element.getAttribute('aria-hidden');
            const displayStyle = window.getComputedStyle(element).display;
            const visibilityStyle = window.getComputedStyle(element).visibility;
            const parentDisplayStyle = element.parentElement ? window.getComputedStyle(element.parentElement).display : '';
            const xpath = getXPath(element);
            const outerHTML = element.outerHTML;
    
            // Skip if the element is not a widget that supports name from content
            if (!widgetRoles.includes(role)) {
                results.notApplicable.push({
                    element,
                    elementDesc: getElementDescription(element),
                    visibleText,
                    accessibleName: '',
                    reason: 'Element role does not support name from content',
                    xpath,
                    outerHTML
                });
                return;
            }
    
            // Skip if the element is hidden or not visible
            if (ariaHidden === "true" || displayStyle === "none" || visibilityStyle === "hidden" || parentDisplayStyle === "none") {
                results.notApplicable.push({
                    element,
                    elementDesc: getElementDescription(element),
                    visibleText,
                    accessibleName: '',
                    reason: 'Hidden or not visible',
                    xpath,
                    outerHTML
                });
                return;
            }
    
            // Skip if there is no visible text
            if (!visibleText || visibleText.length === 0) {
                results.notApplicable.push({
                    element,
                    elementDesc: getElementDescription(element),
                    visibleText,
                    accessibleName: '',
                    reason: 'No visible text',
                    xpath,
                    outerHTML
                });
                return;
            }
    
            // Skip if the element does not have an aria-label or aria-labelledby
            if (!ariaLabel && !ariaLabelledby) {
                results.notApplicable.push({
                    element,
                    elementDesc: getElementDescription(element),
                    visibleText,
                    accessibleName: '',
                    reason: 'No aria-label or aria-labelledby attribute',
                    xpath,
                    outerHTML
                });
                return;
            }
    
            // Get the accessible name
            let accessibleName = ariaLabel || '';
            if (ariaLabelledby) {
                const labelledByElement = document.getElementById(ariaLabelledby);
                if (labelledByElement) {
                    accessibleName = labelledByElement.innerText.trim();
                }
            }
    
            // Normalize visible text and accessible name for comparison
            const normalizedVisibleText = normalizeText(visibleText);
            const normalizedAccessibleName = normalizeText(accessibleName);
    
            // Check if the visible text is part of the accessible name
            if (normalizedAccessibleName.includes(normalizedVisibleText)) {
                results.pass.push({
                    element,
                    elementDesc: getElementDescription(element),
                    visibleText,
                    accessibleName,
                    xpath,
                    outerHTML
                });
            } else {
                results.fail.push({
                    element,
                    elementDesc: getElementDescription(element),
                    visibleText,
                    accessibleName,
                    reason: 'Visible text is not part of the accessible name',
                    xpath,
                    outerHTML
                });
            }
        });
    
        // Helper function to get a simplified element description
        function getElementDescription(element) {
            const elementTag = element.tagName.toLowerCase();
            const elementId = element.id ? `#${element.id}` : '';
            const elementClass = Array.from(element.classList).map(c => `.${c}`).join('');
            return `<${elementTag}${elementId}${elementClass}>`;
        }
    
        // Helper function to normalize text (ignore case, whitespace, and non-text content)
        function normalizeText(text) {
            // Remove non-text content (e.g., emojis, symbolic characters)
            const cleanedText = text.replace(/[\u{1F600}-\u{1F6FF}]/gu, '').replace(/[^\w\s]/gi, '');
            // Normalize whitespace and convert to lowercase
            return cleanedText.trim().toLowerCase();
        }
    
        // Update summary
        summaryContainer.innerHTML = `
            <div style="background-color: #f0fff4; border: 1px solid #c6f6d5; padding: 8px 12px; border-radius: 6px; flex-grow: 1; text-align: center;">
                <span style="font-weight: 600; color: #2f855a;">${results.pass.length}</span>
                <span style="color: #2f855a;"> Passed</span>
            </div>
            <div style="background-color: #fff5f5; border: 1px solid #fed7d7; padding: 8px 12px; border-radius: 6px; flex-grow: 1; text-align: center;">
                <span style="font-weight: 600; color: #c53030;">${results.fail.length}</span>
                <span style="color: #c53030;"> Failed</span>
            </div>
            <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; flex-grow: 1; text-align: center;">
                <span style="font-weight: 600; color: #718096;">${results.notApplicable.length}</span>
                <span style="color: #718096;"> N/A</span>
            </div>
        `;
    
        // Create filter buttons
        filterContainer.innerHTML = `
            <button class="a11y-filter-btn" data-filter="all" style="flex: 1; padding: 8px; background-color: #4299e1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">All</button>
            <button class="a11y-filter-btn" data-filter="pass" style="flex: 1; padding: 8px; background-color: #edf2f7; color: #2d3748; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-weight: 500;">Passes</button>
            <button class="a11y-filter-btn" data-filter="fail" style="flex: 1; padding: 8px; background-color: #edf2f7; color: #2d3748; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-weight: 500;">Failures</button>
        `;
    
        // Add event listeners to filter buttons
        const filterButtons = document.querySelectorAll('.a11y-filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Reset all buttons
                filterButtons.forEach(btn => {
                    btn.style.backgroundColor = '#edf2f7';
                    btn.style.color = '#2d3748';
                    btn.style.border = '1px solid #e2e8f0';
                });
    
                // Highlight active button
                this.style.backgroundColor = '#4299e1';
                this.style.color = 'white';
                this.style.border = 'none';
    
                // Filter results
                renderResults(this.dataset.filter);
            });
        });
    
        function renderResults(filter) {
            resultsContainer.innerHTML = '';
    
            let itemsToRender = [];
            if (filter === 'all' || !filter) {
                itemsToRender = [
                    ...results.fail.map(item => ({ ...item, type: 'fail' })),
                    ...results.pass.map(item => ({ ...item, type: 'pass' })),
                    ...results.notApplicable.map(item => ({ ...item, type: 'na' }))
                ];
            } else if (filter === 'pass') {
                itemsToRender = results.pass.map(item => ({ ...item, type: 'pass' }));
            } else if (filter === 'fail') {
                itemsToRender = results.fail.map(item => ({ ...item, type: 'fail' }));
            }
    
            itemsToRender.forEach(item => {
                const resultItem = document.createElement('div');
                resultItem.style.cssText = `
                    border-radius: 8px;
                    padding: 14px;
                    margin-bottom: 12px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: transform 0.1s ease;
                    border: 1px solid;
                `;
    
                resultItem.addEventListener('mouseover', function() {
                    this.style.transform = 'translateX(-3px)';
                });
    
                resultItem.addEventListener('mouseout', function() {
                    this.style.transform = 'translateX(0)';
                });
    
                resultItem.addEventListener('click', function(e) {
                    // Only trigger if not clicking on a tab or copy button
                    if (!e.target.closest('.tab-button') && !e.target.closest('.copy-button')) {
                        highlightElement(item.element);
                        item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
    
                // Generate element screenshot if it's a failure
                let screenshotPromise = Promise.resolve(null);
                if (item.type === 'fail') {
                    screenshotPromise = captureElementScreenshot(item.element);
                }
    
                // Set item styles based on type
                if (item.type === 'na') {
                    resultItem.style.backgroundColor = '#f8fafc';
                    resultItem.style.borderColor = '#e2e8f0';
                } else if (item.type === 'pass') {
                    resultItem.style.backgroundColor = '#f0fff4';
                    resultItem.style.borderColor = '#c6f6d5';
                } else {
                    resultItem.style.backgroundColor = '#fff5f5';
                    resultItem.style.borderColor = '#fed7d7';
                }
    
                // Create the basic content first (before tabs)
                let headerContent = '';
                if (item.type === 'na') {
                    headerContent = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="font-weight: 600; color: #64748b;">Not Applicable</div>
                            <div style="color: #94a3b8; font-size: 12px; padding: 3px 8px; background: #f1f5f9; border-radius: 12px;">Hidden</div>
                        </div>
                        <div style="color: #475569; margin-bottom: 8px; word-break: break-all; font-family: monospace; font-size: 13px; display: flex; justify-content: space-between; align-items: center;">
                            <span>${item.elementDesc}</span>
                        </div>
                    `;
                } else if (item.type === 'pass') {
                    headerContent = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="font-weight: 600; color: #276749;">Passed</div>
                            <div style="color: #2f855a; font-size: 12px; padding: 3px 8px; background: #e6fffa; border-radius: 12px;">✓ Match</div>
                        </div>
                        <div style="color: #2c7a7b; margin-bottom: 8px; word-break: break-all; font-family: monospace; font-size: 13px; display: flex; justify-content: space-between; align-items: center;">
                            <span>${item.elementDesc}</span>
                        </div>
                        <div style="margin-bottom: 4px;">
                            <span style="color: #4a5568; font-weight: 500;">Visible text:</span> 
                            <span style="color: #2c7a7b;">"${item.visibleText}"</span>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <span style="color: #4a5568; font-weight: 500;">Accessible name:</span> 
                            <span style="color: #2c7a7b;">"${item.accessibleName}"</span>
                        </div>
                    `;
                } else {
                    headerContent = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="font-weight: 600; color: #c53030;">Failed</div>
                            <div style="color: #c53030; font-size: 12px; padding: 3px 8px; background: #fefcbf; border-radius: 12px;">⚠ Mismatch</div>
                        </div>
                        <div style="color: #c53030; margin-bottom: 8px; word-break: break-all; font-family: monospace; font-size: 13px; display: flex; justify-content: space-between; align-items: center;">
                            <span>${item.elementDesc}</span>
                        </div>
                        <div style="margin-bottom: 4px;">
                            <span style="color: #4a5568; font-weight: 500;">Visible text:</span> 
                            <span style="color: #c53030;">"${item.visibleText || '(empty)'}"</span>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <span style="color: #4a5568; font-weight: 500;">Accessible name:</span> 
                            <span style="color: #c53030;">"${item.accessibleName || '(missing)'}"</span>
                        </div>
                    `;
                }
    
                // Initialize tabs content
                const tabsContainer = document.createElement('div');
                tabsContainer.classList.add('tabs-container');
                tabsContainer.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                `;
    
                // Create tabs header
                const tabsHeader = document.createElement('div');
                tabsHeader.style.cssText = `
                    display: flex;
                    border-bottom: 1px solid #e2e8f0;
                    margin-bottom: 10px;
                `;
    
                // Create tab contents
                const tabContents = document.createElement('div');
                tabContents.style.cssText = `
                    min-height: 80px;
                    position: relative;
                `;
    
                // Define tabs
                const tabs = [
                    { id: 'xpath', name: 'XPath', content: item.xpath },
                    { id: 'html', name: 'HTML', content: item.outerHTML }
                ];
    
                // Add screenshot tab for failures
                if (item.type === 'fail') {
                    tabs.push({ id: 'screenshot', name: 'Preview', content: null });
                }
    
                // Create tab buttons
                tabs.forEach((tab, index) => {
                    const tabButton = document.createElement('button');
                    tabButton.classList.add('tab-button');
                    tabButton.dataset.tab = tab.id;
                    tabButton.textContent = tab.name;
                    tabButton.style.cssText = `
                        padding: 8px 12px;
                        background: ${index === 0 ? '#edf2f7' : 'transparent'};
                        border: none;
                        border-bottom: 2px solid ${index === 0 ? '#4299e1' : 'transparent'};
                        cursor: pointer;
                        font-size: 13px;
                        color: ${index === 0 ? '#2d3748' : '#718096'};
                        font-weight: ${index === 0 ? '500' : 'normal'};
                    `;
    
                    tabButton.addEventListener('click', function(e) {
                        e.stopPropagation();
    
                        // Deactivate all tabs
                        tabsHeader.querySelectorAll('.tab-button').forEach(btn => {
                            btn.style.background = 'transparent';
                            btn.style.borderBottom = '2px solid transparent';
                            btn.style.color = '#718096';
                            btn.style.fontWeight = 'normal';
                        });
    
                        // Activate clicked tab
                        this.style.background = '#edf2f7';
                        this.style.borderBottom = '2px solid #4299e1';
                        this.style.color = '#2d3748';
                        this.style.fontWeight = '500';
    
                        // Hide all content
                        tabContents.querySelectorAll('.tab-content').forEach(content => {
                            content.style.display = 'none';
                        });
    
                        // Show selected content
                        const targetContent = tabContents.querySelector(`.tab-content[data-tab="${this.dataset.tab}"]`);
                        if (targetContent) {
                            targetContent.style.display = 'block';
                        }
                    });
    
                    tabsHeader.appendChild(tabButton);
                });
    
                // Create tab contents
                tabs.forEach((tab, index) => {
                    const tabContent = document.createElement('div');
                    tabContent.classList.add('tab-content');
                    tabContent.dataset.tab = tab.id;
                    tabContent.style.cssText = `
                        display: ${index === 0 ? 'block' : 'none'};
                        padding: 10px 0;
                    `;
    
                    if (tab.id === 'screenshot') {
                        // Create loading indicator for screenshot
                        tabContent.innerHTML = `
                            <div class="screenshot-container" style="text-align: center; padding: 10px;">
                                <div class="loading-indicator" style="color: #718096;">Loading preview...</div>
                            </div>
                        `;
    
                        // Update with actual screenshot when available
                        screenshotPromise.then(dataUrl => {
                            if (dataUrl) {
                                const img = document.createElement('img');
                                img.src = dataUrl;
                                img.style.cssText = `
                                    max-width: 100%;
                                    border: 1px solid #e2e8f0;
                                    border-radius: 4px;
                                `;
    
                                tabContent.querySelector('.screenshot-container').innerHTML = '';
                                tabContent.querySelector('.screenshot-container').appendChild(img);
                            } else {
                                tabContent.querySelector('.screenshot-container').innerHTML = `
                                    <div style="color: #718096; padding: 10px;">
                                        Preview not available. Element may be hidden or outside viewport.
                                    </div>
                                `;
                            }
                        });
                    } else {
                        // Create content with syntax highlighting and copy button
                        const contentWrapper = document.createElement('div');
                        contentWrapper.style.cssText = `
                            position: relative;
                            background: #f8fafc;
                            border-radius: 4px;
                            border: 1px solid #e2e8f0;
                            padding: 10px;
                            font-family: monospace;
                            font-size: 12px;
                            white-space: pre-wrap;
                            word-break: break-all;
                            max-height: 120px;
                            overflow-y: auto;
                        `;
    
                        contentWrapper.textContent = tab.content || 'N/A';
    
                        // Create copy button container
                        const copyBtnContainer = document.createElement('div');
                        copyBtnContainer.style.cssText = `
                            position: absolute;
                            top: 5px;
                            right: 5px;
                        `;
    
                        // Add copy button if content exists
                        if (tab.content) {
                            const copyBtn = createCopyButton(tab.content);
                            copyBtn.classList.add('copy-button');
                            copyBtnContainer.appendChild(copyBtn);
                        }
    
                        contentWrapper.appendChild(copyBtnContainer);
                        tabContent.appendChild(contentWrapper);
                    }
    
                    tabContents.appendChild(tabContent);
                });
    
                // Add tabs to container
                tabsContainer.appendChild(tabsHeader);
                tabsContainer.appendChild(tabContents);
    
                // Set the inner HTML and append tabs
                resultItem.innerHTML = headerContent;
                resultItem.appendChild(tabsContainer);
    
                resultsContainer.appendChild(resultItem);
            });
    
            // Show message if no results for current filter
            if (itemsToRender.length === 0) {
                resultsContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px; color: #718096;">
                        <div style="font-size: 32px; margin-bottom: 10px;">🔍</div>
                        <div style="font-weight: 600; margin-bottom: 8px;">No results found</div>
                        <div style="font-size: 14px;">Try changing the filter or checking another page</div>
                    </div>
                `;
            }
        }
    
        // Initial render with all results
        renderResults('all');
    }

    // Close functionality - moved after DOM elements are created
    document.getElementById('a11y-close-btn').addEventListener('click', function() {
        document.body.removeChild(overlay);
    });
    
    // Run check
    checkLabelInName();
})();