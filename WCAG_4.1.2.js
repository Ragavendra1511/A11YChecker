javascript:(function(){
    function AccessibilityChecker() {
        let results = { 
            pass: [], 
            fail: [], 
            warnings: [],
            total: 0
        };
        
        function getAbsoluteXPath(element) {
            if (!element || element.nodeType !== Node.ELEMENT_NODE) return '';
            let path = [];
            while (element && element.nodeType === Node.ELEMENT_NODE) {
                let tagName = element.tagName.toLowerCase();
                let index = 1;
                let sibling = element.previousElementSibling;

                while (sibling) {
                    if (sibling.tagName.toLowerCase() === tagName) {
                        index++;
                    }
                    sibling = sibling.previousElementSibling;
                }

                path.unshift(`${tagName}[${index}]`);
                element = element.parentElement;
            }
            return '/' + path.join('/');
        }

        function getElementHTML(element) {
            if (!element) return 'No element found';
            return element.outerHTML.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        function checkElementAccessibility(element) {
            if (element.hidden || element.offsetParent === null || window.getComputedStyle(element).display === 'none') {
                return;
            }

            const role = element.getAttribute('role') || getImplicitRole(element.tagName.toLowerCase());
            let name = element.getAttribute('aria-label') 
                || (element.getAttribute('aria-labelledby') 
                    ? document.getElementById(element.getAttribute('aria-labelledby'))?.textContent.trim() : null)
                || element.getAttribute('title') 
                || element.textContent?.trim();

            const nestedImg = element.querySelector('img');
            if (nestedImg && !name) {
                name = nestedImg.getAttribute('alt');
            }

            if (element.tagName.toLowerCase() === 'input') {
                const inputType = element.getAttribute('type')?.toLowerCase();
                if (['submit', 'reset', 'button'].includes(inputType)) {
                    name = name || element.value;
                }
            }

            if (element.id) {
                const associatedLabel = document.querySelector(`label[for="${element.id}"]`);
                if (associatedLabel) {
                    name = name || associatedLabel.textContent.trim();
                }
            }

            if (!name && element.closest('label')) {
                name = element.closest('label').textContent.trim();
            }

            results.total++;

            const interactiveRoles = [
                'button', 'link', 'checkbox', 'radio', 'textbox', 'combobox', 'menuitem', 'tab', 'slider'
            ];
            const isInteractive = interactiveRoles.includes(role) 
                || ['a', 'button', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())
                || element.getAttribute('tabindex') !== null;

                if (isInteractive) {
                    if (!name) {
                        results.fail.push({
                            selector: getAbsoluteXPath(element),
                            role,
                            reason: 'Missing accessible name',
                            html: getElementHTML(element),
                            preview: element.cloneNode(true) // Clone the element for preview
                        });
                } else {
                    if (!isValidRole(role, element.tagName.toLowerCase())) {
                        results.fail.push({
                            selector: getAbsoluteXPath(element),
                            role,
                            reason: 'Invalid or mismatched role',
                            html: getElementHTML(element)
                        });
                    }

                    if (['input', 'textarea', 'select'].includes(element.tagName.toLowerCase())) {
                        const value = element.value || element.getAttribute('value');
                        if (!value && element.getAttribute('aria-valuenow') === null) {
                            results.fail.push({
                                selector: getAbsoluteXPath(element),
                                role,
                                reason: 'Missing value',
                                html: getElementHTML(element)
                            });
                        }
                    }

                    results.pass.push({
                        selector: getAbsoluteXPath(element),
                        role,
                        name,
                        html: getElementHTML(element)
                    });
                }
            }

            if (role === 'button' && !element.getAttribute('tabindex')) {
                results.warnings.push({
                    selector: getAbsoluteXPath(element),
                    reason: 'Button lacks explicit tabindex',
                    html: getElementHTML(element)
                });
            }
        }

        function getImplicitRole(tagName) {
            const implicitRoles = {
                a: 'link', button: 'button', select: 'combobox', textarea: 'textbox', img: 'img',
                input: (type) => {
                    switch (type) {
                        case 'checkbox': return 'checkbox';
                        case 'radio': return 'radio';
                        case 'submit': return 'button';
                        case 'text': return 'textbox';
                        default: return null;
                    }
                }
            };
            return implicitRoles[tagName] || null;
        }

        function isValidRole(role, tagName) {
            const validRoles = {
                button: ['button'], a: ['link'], input: ['checkbox', 'radio', 'textbox', 'button'], select: ['combobox'], textarea: ['textbox']
            };
            return validRoles[tagName]?.includes(role) || false;
        }

        this.run = function() {
            results = { pass: [], fail: [], warnings: [], total: 0 };
            document.querySelectorAll('*').forEach(checkElementAccessibility);
            return results;
        };
        this.visualize = function(results) {
            // Remove any existing overlays
            const existingOverlay = document.getElementById('wcag-overlay');
            if (existingOverlay) existingOverlay.remove();

            // Create main overlay
            const overlay = document.createElement('div');
            overlay.id = 'wcag-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                width: 500px;
                height: 80vh;
                background: white;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 10000;
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            `;

            // Tabs HTML
            overlay.innerHTML = `
                <div style="background: #4a90e2; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0;">WCAG 4.1.2</h2>
                    <button id="close-overlay" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
                </div>
                
                <div style="display: flex; border-bottom: 1px solid #eee;">
                    <button class="tab-btn active" data-tab="summary" style="flex: 1; padding: 10px; background: none; border: none; border-bottom: 3px solid #4a90e2; color: #4a90e2;">
                        Summary
                    </button>
                    <button class="tab-btn" data-tab="failed" style="flex: 1; padding: 10px; background: none; border: none;">
                        Failed Elements
                    </button>
                    <button class="tab-btn" data-tab="warnings" style="flex: 1; padding: 10px; background: none; border: none;">
                        Warnings
                    </button>
                </div>
                
                <div id="tab-content" style="flex-grow: 1; overflow-y: auto; padding: 15px;">
                    <!-- Content will be dynamically populated -->
                </div>
                
                <div style="background: #f4f4f4; padding: 15px; display: flex; justify-content: center; align-items: center;">
                    <button id="download-report" style="
                        background: #4a90e2; 
                        color: white; 
                        border: none; 
                        padding: 12px 24px; 
                        border-radius: 5px; 
                        cursor: pointer;
                        font-size: 16px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        transition: background 0.3s ease;
                    ">
                        Download Full Report
                    </button>
                </div>
            `;

            // Append to body
            document.body.appendChild(overlay);

            // Tab functionality
            const tabButtons = overlay.querySelectorAll('.tab-btn');
            const tabContent = overlay.querySelector('#tab-content');

            function showTab(tabName) {
                // Update button styles
                tabButtons.forEach(btn => {
                    if (btn.dataset.tab === tabName) {
                        btn.style.color = '#4a90e2';
                        btn.style.borderBottom = '3px solid #4a90e2';
                    } else {
                        btn.style.color = 'inherit';
                        btn.style.borderBottom = 'none';
                    }
                });

                // Populate content
                switch(tabName) {
                    case 'summary':
                        tabContent.innerHTML = `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                                <div style="background: #2ecc71; color: white; padding: 10px; border-radius: 5px; text-align: center; flex: 1; margin-right: 5px;">
                                    ✅ Pass<br>${results.pass.length}
                                </div>
                                <div style="background: #e74c3c; color: white; padding: 10px; border-radius: 5px; text-align: center; flex: 1; margin-right: 5px;">
                                    ❌ Fail<br>${results.fail.length}
                                </div>
                                <div style="background: #f39c12; color: white; padding: 10px; border-radius: 5px; text-align: center; flex: 1;">
                                    ⚠️ Warnings<br>${results.warnings.length}
                                </div>
                            </div>
                            <p>Total elements checked: ${results.total}</p>
                        `;
                        break;
                        case 'failed':
    tabContent.innerHTML = results.fail.length ? 
        results.fail.map(item => `
            <div style="background: #fff3f3; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                <div style="word-break: break-all; margin-bottom: 5px;">
                    <strong>XPath:</strong> ${item.selector}
                </div>
                <strong>Role:</strong> ${item.role}<br>
                <strong>Reason:</strong> ${item.reason}<br>
                <details>
                    <summary>View Details</summary>
                    <div style="margin-top: 10px;">
                        <div style="margin-bottom: 10px;">
                            <strong>HTML Snippet:</strong>
                            <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px;">${item.html}</pre>
                        </div>
                        <div>
                            <strong>Element Preview:</strong>
                            <div class="element-preview" style="background: #f4f4f4; padding: 10px; border-radius: 5px; margin-top: 5px;">
                                <div class="preview-content"></div>
                            </div>
                        </div>
                    </div>
                </details>
            </div>
        `).join('') 
        : '<p>No failed elements found.</p>';
    
    // After rendering HTML, inject the actual previews
    results.fail.forEach((item, index) => {
        const previewContainer = tabContent.querySelectorAll('.preview-content')[index];
        if (previewContainer) {
            try {
                const elementClone = document.evaluate(item.selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (elementClone) {
                    const clone = elementClone.cloneNode(true);
                    // Apply styles to maintain visual appearance
                    clone.style.pointerEvents = 'none';
                    clone.style.maxWidth = '100%';
                    clone.style.position = 'relative';
                    previewContainer.appendChild(clone);
                }
            } catch (e) {
                previewContainer.textContent = 'Preview not available';
            }
        }
    });
    break;
                        
                        case 'warnings':
                            tabContent.innerHTML = results.warnings.length ? 
                                results.warnings.map(item => `
                                    <div style="background: #fff9e6; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                                        <div style="word-break: break-all; margin-bottom: 5px;">
                                            <strong>XPath:</strong> ${item.selector}
                                        </div>
                                        <strong>Reason:</strong> ${item.reason}<br>
                                        <details>
                                            <summary>View Details</summary>
                                            <div style="margin-top: 10px;">
                                                <div style="margin-bottom: 10px;">
                                                    <strong>HTML Snippet:</strong>
                                                    <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px;">${item.html}</pre>
                                                </div>
                                                <div>
                                                    <strong>Element Preview:</strong>
                                                    <div style="background: #f4f4f4; padding: 10px; border-radius: 5px; margin-top: 5px; pointer-events: none;"
                                                         dangerouslySetInnerHTML="${{__html: item.html.replace(/&lt;/g, '<').replace(/&gt;/g, '>')}}">
                                                    </div>
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                `).join('') 
                                : '<p>No warnings found.</p>';
                            break;
                }
            }

            // Initial tab
            showTab('summary');

            // Add tab click listeners
            tabButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    showTab(btn.dataset.tab);
                });
            });

            // Event listeners
            document.getElementById('close-overlay').addEventListener('click', () => {
                overlay.remove();
            });

            document.getElementById('download-report').addEventListener('click', () => {
                downloadReport(results);
            });
        };

        // Download report method
        function downloadReport(results) {
            // Create CSV headers
            const headers = ['Type', 'XPath', 'Role', 'Name', 'Reason', 'HTML'];
            const rows = [];
        
            // Function to clean HTML entities
            function cleanHtml(html) {
                return html
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, '&')
                    .replace(/&apos;/g, "'");
            }
                    // Add passed elements
            results.pass.forEach(item => {
                rows.push([
                    'Pass',
                    item.selector || '',
                    item.role || '',
                    item.name || '',
                    '',
                    cleanHtml(item.html) || ''
                ]);
            });

            // Add failed elements
            results.fail.forEach(item => {
                rows.push([
                    'Fail',
                    item.selector || '',
                    item.role || '',
                    '',
                    item.reason || '',
                    cleanHtml(item.html) || ''
                ]);
            });

            // Add warnings
            results.warnings.forEach(item => {
                rows.push([
                    'Warning',
                    item.selector || '',
                    '',
                    '',
                    item.reason || '',
                    cleanHtml(item.html) || ''
                ]);
            });
        
            // Add summary row
            rows.push([
                'Summary',
                `Total Elements: ${results.total}`,
                `Passed: ${results.pass.length}`,
                `Failed: ${results.fail.length}`,
                `Warnings: ${results.warnings.length}`,
                ''
            ]);
        
            // Convert to CSV
            const csvContent = [
                headers.join(','),
                ...rows.map(row => 
                    row.map(cell => 
                        `"${String(cell).replace(/"/g, '""')}"`
                    ).join(',')
                )
            ].join('\n');
        
            // Create and trigger download
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            a.href = url;
            a.download = `wcag-report-${timestamp}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    // Run the checker
    const checker = new AccessibilityChecker();
    const results = checker.run();
    checker.visualize(results);
})();