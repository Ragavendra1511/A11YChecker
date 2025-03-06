javascript:(function(){
    // Create and inject styles (styles remain the same as before)
    const styles = document.createElement('style');
    styles.textContent = 
        '.a11y-checker-panel{position:fixed;top:20px;right:20px;width:450px;max-height:80vh;background:white;border:1px solid #ccc;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);z-index:999999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;overflow:hidden}' +
        '.a11y-checker-header{padding:12px;background:#2563eb;color:white;display:flex;justify-content:space-between;align-items:center;cursor:move}' +
        '.a11y-checker-content{padding:16px;overflow-y:auto;max-height:calc(80vh - 120px)}' +
        '.a11y-checker-tabs{display:flex;gap:8px;padding:8px 16px;border-bottom:1px solid #eee}' +
        '.a11y-checker-tab{padding:8px 16px;border:none;background:none;cursor:pointer;border-radius:4px;color:#666}' +
        '.a11y-checker-tab.active{background:#2563eb;color:white}' +
        '.a11y-result{margin:8px 0;padding:12px;border-radius:4px;border:1px solid #eee}' +
        '.a11y-result.passed{border-left:4px solid #22c55e}' +
        '.a11y-result.failed{border-left:4px solid #ef4444}' +
        '.a11y-result.inapplicable{border-left:4px solid #94a3b8}' +
        '.close-button{background:none;border:none;color:white;cursor:pointer;font-size:20px;padding:4px}' +
        '.result-count{display:flex;gap:16px;margin-bottom:16px;padding:12px;background:#f8fafc;border-radius:4px}' +
        '.count-item{display:flex;align-items:center;gap:8px}' +
        '.count-dot{width:8px;height:8px;border-radius:50%}' +
        '.image-preview{max-width:200px;max-height:100px;margin:8px 0;border:1px solid #eee;border-radius:4px}' +
        '.code-snippet{background:#f8fafc;padding:8px;border-radius:4px;font-family:monospace;font-size:12px;margin:8px 0;position:relative;white-space:pre-wrap;word-break:break-all}' +
        '.copy-button{position:absolute;top:4px;right:4px;padding:4px 8px;background:#2563eb;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;opacity:0;transition:opacity 0.2s}' +
        '.code-snippet:hover .copy-button{opacity:1}' +
        '.copy-button:hover{background:#1d4ed8}' +
        '.snippet-tabs{display:flex;gap:8px;margin:8px 0}' +
        '.snippet-tab{padding:4px 8px;background:#f1f5f9;border:none;border-radius:4px;cursor:pointer;font-size:12px}' +
        '.snippet-tab.active{background:#2563eb;color:white}' +
        '.toast{position:fixed;bottom:20px;right:20px;background:#2563eb;color:white;padding:8px 16px;border-radius:4px;animation:fadeOut 2s forwards;z-index:999999}' +
        '@keyframes fadeOut{0%{opacity:1}70%{opacity:1}100%{opacity:0}}' +
        '.code-content{white-space:pre-wrap;word-break:break-all}';

    document.head.appendChild(styles);

    // Helper function to get XPath
    function getXPath(element) {
        if (!element) return '';
        const idx = (sib, name) => sib 
            ? idx(sib.previousElementSibling, name||sib.tagName) + (sib.tagName == name)
            : 1;
        const segs = elm => !elm || elm.nodeType !== 1 
            ? ['']
            : elm.id && document.getElementById(elm.id) === elm
                ? ['id("' + elm.id + '")']
                : [...segs(elm.parentNode), elm.tagName + '[' + idx(elm) + ']'];
        return segs(element).join('/');
    }

    // Show toast notification
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    // Copy to clipboard function
    function copyToClipboard(text, type) {
        navigator.clipboard.writeText(text)
            .then(() => showToast(type + ' copied to clipboard'))
            .catch(err => showToast('Failed to copy ' + type));
    }

    // Create snippets section with proper event handling
    function createSnippetSection(result) {
        const container = document.createElement('div');
        
        const tabsHtml = `
            <div class="snippet-tabs">
                <button class="snippet-tab active" data-view="html">HTML</button>
                <button class="snippet-tab" data-view="xpath">XPath</button>
            </div>
            <div class="snippets-container">
                <div class="code-snippet html-snippet">
                    <div class="code-content">${result.elementHtml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                    <button class="copy-button">Copy</button>
                </div>
                <div class="code-snippet xpath-snippet" style="display: none">
                    <div class="code-content">${result.elementXPath}</div>
                    <button class="copy-button">Copy</button>
                </div>
            </div>`;

        container.innerHTML = tabsHtml;

        // Add event listeners for tabs
        container.querySelectorAll('.snippet-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const view = tab.dataset.view;
                container.querySelectorAll('.snippet-tab').forEach(t => t.classList.remove('active'));
                container.querySelectorAll('.code-snippet').forEach(s => s.style.display = 'none');
                tab.classList.add('active');
                container.querySelector('.' + view + '-snippet').style.display = 'block';
            });
        });

        // Add event listeners for copy buttons
        container.querySelectorAll('.code-snippet').forEach(snippet => {
            const copyBtn = snippet.querySelector('.copy-button');
            const codeContent = snippet.querySelector('.code-content');
            copyBtn.addEventListener('click', () => {
                const type = snippet.classList.contains('html-snippet') ? 'HTML' : 'XPath';
                copyToClipboard(codeContent.textContent, type);
            });
        });

        return container;
    }

    // Create panel
    const panel = document.createElement('div');
    panel.className = 'a11y-checker-panel';
    
    // Initialize panel content
    panel.innerHTML = `
        <div class="a11y-checker-header">
            <h2 style="margin: 0; font-size: 16px;">Accessibility Checker</h2>
            <button class="close-button">&times;</button>
        </div>
        <div class="a11y-checker-tabs">
            <button class="a11y-checker-tab active" data-tab="all">All Results</button>
            <button class="a11y-checker-tab" data-tab="passed">Passed</button>
            <button class="a11y-checker-tab" data-tab="failed">Failed</button>
        </div>
        <div class="a11y-checker-content"></div>`;

    // Results storage
    const results = {
        passed: [],
        failed: [],
        inapplicable: []
    };

    // Update results in panel
    // Inside the updateResults function, replace the conditional image display with this code:
function updateResults() {
    const content = panel.querySelector('.a11y-checker-content');
    const activeTab = panel.querySelector('.a11y-checker-tab.active').dataset.tab;
    
    const resultCountHtml = `
        <div class="result-count">
            <div class="count-item">
                <span class="count-dot" style="background: #22c55e"></span>
                <span>Passed: ${results.passed.length}</span>
            </div>
            <div class="count-item">
                <span class="count-dot" style="background: #ef4444"></span>
                <span>Failed: ${results.failed.length}</span>
            </div>
            <div class="count-item">
                <span class="count-dot" style="background: #94a3b8"></span>
                <span>N/A: ${results.inapplicable.length}</span>
            </div>
        </div>`;

    content.innerHTML = resultCountHtml;

    Object.entries(results).forEach(([status, items]) => {
        if (activeTab === 'all' || activeTab === status) {
            items.forEach(item => {
                const resultDiv = document.createElement('div');
                resultDiv.className = `a11y-result ${status}`;
                
                let resultContent = `
                    <div style="font-weight: 500; margin-bottom: 4px">
                        ${status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                    <div>${item.message}</div>`;
                
                // Display image for all result types if src is available
                if (item.src) {
                    const statusText = status === 'passed' ? 'Passed element preview' : 
                                      status === 'failed' ? 'Failed element preview' : 
                                      'Inapplicable element preview';
                    resultContent += `<img src="${item.src}" alt="${statusText}" class="image-preview">`;
                }

                resultDiv.innerHTML = resultContent;
                resultDiv.appendChild(createSnippetSection(item));
                content.appendChild(resultDiv);
            });
        }
    });
}

    // Custom logger
    function logResult(status, message, element) {
        results[status.toLowerCase()].push({
            message,
            element,
            elementHtml: element?.outerHTML || '',
            elementXPath: getXPath(element),
            src: element?.src || ''
        });
        updateResults();
    }

    // Make panel draggable
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    function dragStart(e) {
        if (e.target.closest('.a11y-checker-content')) return;
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        if (e.target === panel.querySelector('.a11y-checker-header')) {
            isDragging = true;
        }
    }

    function dragEnd() {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    }

    // Add event listeners for dragging
    panel.querySelector('.a11y-checker-header').addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    // Add tab switching functionality
    panel.querySelectorAll('.a11y-checker-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            panel.querySelectorAll('.a11y-checker-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateResults();
        });
    });

    // Add close functionality
    panel.querySelector('.close-button').addEventListener('click', () => {
        panel.remove();
        styles.remove();
    });

    // Add panel to page
    document.body.appendChild(panel);

    // Check functions
    function checkImgAlt() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        const altText = img.getAttribute('alt');
        const role = img.getAttribute('role');
        const ariaHidden = img.getAttribute('aria-hidden');
        const displayStyle = window.getComputedStyle(img).display;
        const zIndex = window.getComputedStyle(img).zIndex;
        const src = img.getAttribute('src');

        // Check if the image is decorative, hidden, or not visible
        if (role === "presentation" || ariaHidden === "true" || displayStyle === "none" || zIndex === "-1" || !src) {
            logResult('inapplicable', 'Image is decorative or hidden', img);
        } else if (altText !== null && altText.trim() !== '') {
            logResult('passed', 'Image has alt text: "' + altText + '"', img);
        } else {
            logResult('failed', 'Image missing alt text', img);
        }
    });
}

    // Run checks

    // Function to check input[type="image"] accessible names
    function checkImageButtonAccessibleName() {
        const imageButtons = document.querySelectorAll('input[type="image"]');
        imageButtons.forEach(button => {
            const altText = button.getAttribute('alt');
            const ariaLabel = button.getAttribute('aria-label');
            const title = button.getAttribute('title');
            const ariaLabelledby = button.getAttribute('aria-labelledby');
            const value = button.getAttribute('value');
            const ariaHidden = button.getAttribute('aria-hidden');
            const displayStyle = window.getComputedStyle(button).display;
    
            // Check if the button is hidden
            if (ariaHidden === "true" || displayStyle === "none") {
                logResult('inapplicable', 'Button is hidden', button);
                return;
            }
    
            // Check for default name ("Submit Query" or localized versions)
            const defaultNames = ['Submit Query', 'Senden', 'Envoyer', 'Enviar']; // Add more localized versions as needed
            const computedName = getAccessibleName(button);
            if (defaultNames.includes(computedName)) {
                logResult('failed', `Button has default name: "${computedName}"`, button);
                return;
            }
    
            // Check for valid accessible names
            if (altText && altText.trim() !== '') {
                logResult('passed', `Button has alt text: "${altText}"`, button);
            } else if (ariaLabel && ariaLabel.trim() !== '') {
                logResult('passed', `Button has aria-label: "${ariaLabel}"`, button);
            } else if (title && title.trim() !== '') {
                logResult('passed', `Button has title: "${title}"`, button);
            } else if (ariaLabelledby && document.getElementById(ariaLabelledby)) {
                const labelledByText = document.getElementById(ariaLabelledby).innerText;
                logResult('passed', `Button has aria-labelledby text: "${labelledByText}"`, button);
            } else if (value && value.trim() !== '') {
                logResult('passed', `Button has value: "${value}"`, button);
            } else {
                logResult('failed', 'Button does not have a valid accessible name', button);
            }
        });
    }
    
    // Helper function to get the accessible name of an element
    function getAccessibleName(element) {
        return element.ariaLabel || element.alt || element.title || element.value || '';
    }
    
    function checkAccessibleName() {
        const elements = document.querySelectorAll('img, [role="img"], svg[role="img"], canvas[role="img"]');
        elements.forEach(element => {
            const altText = element.getAttribute('alt');
            const ariaLabel = element.getAttribute('aria-label');
            const title = element.getAttribute('title');
            const ariaLabelledby = element.getAttribute('aria-labelledby');
            const role = element.getAttribute('role');
            const ariaHidden = element.getAttribute('aria-hidden');
            const displayStyle = window.getComputedStyle(element).display;
            const visibilityStyle = window.getComputedStyle(element).visibility;
            const parentDisplayStyle = element.parentElement ? window.getComputedStyle(element.parentElement).display : '';
            const isFocusable = element.tabIndex >= 0;
    
            // Check if the element is programmatically hidden
            if (ariaHidden === "true" || displayStyle === "none" || visibilityStyle === "hidden" || parentDisplayStyle === "none") {
                logResult(`Inapplicable: ${getElementDescription(element)} is hidden`);
                return;
            }
    
            // Check for focusable elements with role="none" or role="presentation"
            if ((role === "none" || role === "presentation") && isFocusable) {
                logResult(`Failed: ${getElementDescription(element)} is focusable and has role="${role}"`);
                return;
            }
    
            // Check for decorative images
            if (altText === "" || role === "presentation" || role === "none") {
                logResult(`Passed: ${getElementDescription(element)} is decorative`);
                return;
            }
    
            // Check for empty accessible names
            const accessibleName = getAccessibleName(element);
            if (!accessibleName || accessibleName.trim() === "") {
                logResult(`Failed: ${getElementDescription(element)} has an empty accessible name`);
                return;
            }
    
            // Check for valid accessible names
            if (accessibleName && accessibleName.trim() !== "") {
                logResult(`Passed: ${getElementDescription(element)} has accessible name "${accessibleName}"`);
            } else {
                logResult(`Failed: ${getElementDescription(element)} does not have a valid accessible name`);
            }
        });
    }
    
    // Helper function to compute the accessible name
    function getAccessibleName(element) {
        return (
            element.ariaLabel ||
            element.getAttribute('alt') ||
            element.getAttribute('title') ||
            (element.getAttribute('aria-labelledby') && document.getElementById(element.getAttribute('aria-labelledby'))?.innerText) ||
            ""
        ).trim();
    }
    
    // Helper function to get a description of the element
    function getElementDescription(element) {
        if (element.tagName.toLowerCase() === 'img') {
            return `Image with src "${element.src}"`;
        } else if (element.tagName.toLowerCase() === 'svg') {
            return `SVG image`;
        } else if (element.tagName.toLowerCase() === 'canvas') {
            return `Canvas image`;
        } else if (element.getAttribute('role') === 'img') {
            return `Div with role="img"`;
        } else {
            return `Element with role="img"`;
        }
    }
    
    function checkObjectAccessibleName() {
        const objects = document.querySelectorAll('object');
        objects.forEach(obj => {
            const ariaLabel = obj.getAttribute('aria-label');
            const title = obj.getAttribute('title');
            const ariaLabelledby = obj.getAttribute('aria-labelledby');
            const ariaHidden = obj.getAttribute('aria-hidden');
            const role = obj.getAttribute('role');
            const alt = obj.getAttribute('alt'); // Some browsers may use this for images
            const displayStyle = window.getComputedStyle(obj).display;
            const visibilityStyle = window.getComputedStyle(obj).visibility;
            const parentDisplayStyle = obj.parentElement ? window.getComputedStyle(obj.parentElement).display : '';
    
            // 1. Skip inapplicable cases
            if (ariaHidden === "true" || displayStyle === "none" || visibilityStyle === "hidden" || parentDisplayStyle === "none" || role === "presentation") {
                logResult(`Inapplicable: ${obj.data}`);
                return;
            }
    
            // 2. Check if the object embeds an image, audio, or video
            const mimeType = obj.getAttribute('type'); // MIME type of embedded content
            if (!mimeType || !mimeType.startsWith('image/') && !mimeType.startsWith('audio/') && !mimeType.startsWith('video/')) {
                logResult(`Inapplicable: ${obj.data} does not embed an image, audio, or video.`);
                return;
            }
    
            // 3. Check for an accessible name
            if (ariaLabel && ariaLabel.trim() !== '') {
                logResult(`Passed: ${obj.data} has aria-label "${ariaLabel}"`);
            } else if (title && title.trim() !== '') {
                logResult(`Passed: ${obj.data} has title "${title}"`);
            } else if (ariaLabelledby && document.getElementById(ariaLabelledby)) {
                const labelledByText = document.getElementById(ariaLabelledby).innerText;
                logResult(`Passed: ${obj.data} has aria-labelledby text "${labelledByText}"`);
            } else if (alt && alt.trim() !== '') {
                logResult(`Passed: ${obj.data} has alt "${alt}"`);
            } else if (obj.textContent.trim() !== '') {
                logResult(`Passed: ${obj.data} has fallback text "${obj.textContent.trim()}"`);
            } else {
                logResult(`Failed: ${obj.data} does not have a valid accessible name.`);
            }
        });
    }
function checkSvgAccessibleName() {
    const svgElements = document.querySelectorAll('svg[role="img"], svg[role="graphics-document"], svg[role="graphics-symbol"], [role="graphics-symbol"]');
    svgElements.forEach(element => {
        const title = element.querySelector('title');
        const ariaLabel = element.getAttribute('aria-label');
        const ariaLabelledby = element.getAttribute('aria-labelledby');
        const ariaHidden = element.getAttribute('aria-hidden');
        const role = element.getAttribute('role');
        const displayStyle = window.getComputedStyle(element).display;
        const visibilityStyle = window.getComputedStyle(element).visibility;
        const parentDisplayStyle = element.parentElement ? window.getComputedStyle(element.parentElement).display : '';

        if (ariaHidden === "true" || displayStyle === "none" || visibilityStyle === "hidden" || parentDisplayStyle === "none") {
            logResult(`Inapplicable: ${element.outerHTML}`);
        } else if (title && title.textContent.trim() !== '') {
            logResult(`Passed: ${element.outerHTML} has title "${title.textContent}"`);
        } else if (ariaLabel && ariaLabel.trim() !== '') {
            logResult(`Passed: ${element.outerHTML} has aria-label "${ariaLabel}"`);
        } else if (ariaLabelledby && document.getElementById(ariaLabelledby)) {
            const labelledByText = document.getElementById(ariaLabelledby).innerText;
            logResult(`Passed: ${element.outerHTML} has aria-labelledby text "${labelledByText}"`);
        } else {
            logResult(`Failed: ${element.outerHTML} does not have a valid accessible name`);
        }
    });
}
function checkImgFilenameAccessibleName() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        const altText = img.getAttribute('alt');
        const ariaLabel = img.getAttribute('aria-label');
        const role = img.getAttribute('role');
        const displayStyle = window.getComputedStyle(img).display;
        const ariaHidden = img.getAttribute('aria-hidden');
        const src = img.getAttribute('src');
        const filename = src ? src.split('/').pop().split('.')[0] : '';

        if (ariaHidden === "true" || displayStyle === "none" || role === "presentation") {
            logResult(`Inapplicable: ${img.src}`);
        } else if (altText && altText.trim().toLowerCase() === filename.toLowerCase()) {
            logResult(`Passed: ${img.src} has alt text "${altText}" equivalent to the filename`);
        } else if (ariaLabel && ariaLabel.trim().toLowerCase() === filename.toLowerCase()) {
            logResult(`Passed: ${img.src} has aria-label "${ariaLabel}" equivalent to the filename`);
        } else if (altText && altText.trim() !== '') {
            logResult(`Failed: ${img.src} has alt text "${altText}" that does not match the filename`);
        } else if (ariaLabel && ariaLabel.trim() !== '') {
            logResult(`Failed: ${img.src} has aria-label "${ariaLabel}" that does not match the filename`);
        } else {
            logResult(`Failed: ${img.src} does not have a valid accessible name`);
        }
    });
}
function checkDecorativeElements() {
    const elements = document.querySelectorAll('img, svg, canvas');
    elements.forEach(element => {
        const altText = element.getAttribute('alt');
        const ariaHidden = element.getAttribute('aria-hidden');
        const role = element.getAttribute('role');
        const displayStyle = window.getComputedStyle(element).display;
        const visibilityStyle = window.getComputedStyle(element).visibility;
        const parentDisplayStyle = element.parentElement ? window.getComputedStyle(element.parentElement).display : '';

        if (ariaHidden === "true" || displayStyle === "none" || visibilityStyle === "hidden" || parentDisplayStyle === "none") {
            logResult(`Inapplicable: ${element.outerHTML}`);
        } else if (element.tagName.toLowerCase() === 'img' && altText === "") {
            logResult(`Passed: ${element.src} is purely decorative`);
        } else if (element.tagName.toLowerCase() === 'img' && role === "none" && altText === "") {
            logResult(`Passed: ${element.src} is purely decorative`);
        } else if (element.tagName.toLowerCase() === 'svg' && !element.hasAttribute('aria-label') && !element.hasAttribute('title')) {
            logResult(`Passed: ${element.outerHTML} is purely decorative`);
        } else if (element.tagName.toLowerCase() === 'canvas' && !element.hasAttribute('aria-label') && !element.hasAttribute('title')) {
            logResult(`Passed: ${element.outerHTML} is purely decorative`);
        } else {
            logResult(`Failed: ${element.outerHTML} is not purely decorative`);
        }
    });
}
checkImgAlt();
checkImageButtonAccessibleName();
checkAccessibleName();
checkObjectAccessibleName();
checkSvgAccessibleName();
checkImgFilenameAccessibleName();
checkDecorativeElements();
})();
