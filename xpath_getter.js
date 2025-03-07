javascript:(function() {
    // Check if overlay already exists
    if (document.getElementById('snippet-overlay')) {
      document.getElementById('snippet-overlay').remove();
      return;
    }
  
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'snippet-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      max-height: 80vh;
      background-color: #ffffff;
      border: 1px solid #cccccc;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      font-family: Arial, sans-serif;
      font-size: 14px;
      overflow-y: auto;
      padding: 10px;
    `;
  
    // Create header for drag functionality
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
      cursor: move;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Element Inspector';
    title.style.margin = '0';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 0 5px;
    `;
    closeButton.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      overlay.remove();
      document.removeEventListener('click', handleElementClick, true);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    header.appendChild(title);
    header.appendChild(closeButton);
    overlay.appendChild(header);
  
    // Instruction text
    const instructions = document.createElement('p');
    instructions.textContent = 'Click on any element to inspect. Press ESC to close. Drag header to move.';
    instructions.style.margin = '0 0 15px 0';
    overlay.appendChild(instructions);
  
    // Content container
    const content = document.createElement('div');
    content.id = 'snippet-content';
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 15px;
    `;
    overlay.appendChild(content);
  
    document.body.appendChild(overlay);
  
    // Make overlay draggable
    let isDragging = false;
    let dragOffsetX, dragOffsetY;
  
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragOffsetX = e.clientX - overlay.getBoundingClientRect().left;
      dragOffsetY = e.clientY - overlay.getBoundingClientRect().top;
      overlay.style.cursor = 'grabbing';
      e.preventDefault();
    });
  
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        overlay.style.left = (e.clientX - dragOffsetX) + 'px';
        overlay.style.top = (e.clientY - dragOffsetY) + 'px';
        overlay.style.right = 'auto';
      }
    });
  
    document.addEventListener('mouseup', () => {
      isDragging = false;
      overlay.style.cursor = 'auto';
    });
  
    // Function to generate absolute XPath
    function getAbsoluteXPath(element) {
      if (!element) return '';
      if (element.nodeType !== 1) return '';
      
      if (element === document.body) return '/html/body';
      
      let ix = 0;
      const siblings = element.parentNode.childNodes;
      
      for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i];
        
        if (sibling === element) {
          return getAbsoluteXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
        }
        
        if (sibling.nodeType === 1 && sibling.tagName.toLowerCase() === element.tagName.toLowerCase()) {
          ix++;
        }
      }
      
      return '';
    }
  
    // Function to generate relative XPath
    function getRelativeXPath(element) {
      if (!element) return '';
      if (element.nodeType !== 1) return '';
      if (element === document.body) return '/html/body';
      
      // Try to use id attribute
      if (element.id) {
        return `//*[@id="${element.id}"]`;
      }
      
      // Try to use a unique class if available
      if (element.className) {
        const classes = element.className.split(/\s+/).filter(c => c);
        for (const cls of classes) {
          const elements = document.getElementsByClassName(cls);
          if (elements.length === 1) {
            return `//*[@class="${cls}"]`;
          }
        }
      }
      
      // Fall back to position-based XPath but keep it relative
      let path = '';
      let current = element;
      
      while (current && current !== document.body) {
        let name = current.tagName.toLowerCase();
        
        if (current.id) {
          return `//*[@id="${current.id}"]` + path;
        }
        
        let position = 1;
        let sibling = current.previousElementSibling;
        
        while (sibling) {
          if (sibling.tagName.toLowerCase() === name) {
            position++;
          }
          sibling = sibling.previousElementSibling;
        }
        
        path = '/' + name + '[' + position + ']' + path;
        current = current.parentElement;
      }
      
      return '//' + path.substring(1);
    }
  
    // Function to get parent HTML with context (1 level up)
    function getContextHTML(element) {
      // Get the parent element (1 level up)
      const parent = element.parentElement;
      
      if (!parent || parent === document.body) {
        return element.outerHTML;
      }
      
      // Clone the parent to avoid modifying the actual DOM
      const tempParent = parent.cloneNode(true);
      
      // Find the equivalent of our target element in the cloned parent
      const parentHTML = tempParent.outerHTML;
      
      return parentHTML;
    }
  
    // Function to create a snippet section
    function createSnippetSection(title, content) {
      const section = document.createElement('div');
      section.style.cssText = `
        border: 1px solid #eee;
        border-radius: 4px;
        overflow: hidden;
      `;
      
      const titleBar = document.createElement('div');
      titleBar.textContent = title;
      titleBar.style.cssText = `
        background-color: #f5f5f5;
        padding: 8px;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;
      
      const copyButton = document.createElement('button');
      copyButton.textContent = 'Copy';
      copyButton.style.cssText = `
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 3px 8px;
        cursor: pointer;
        font-size: 12px;
      `;
      copyButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(content)
          .then(() => {
            copyButton.textContent = 'Copied!';
            setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);
          })
          .catch(() => {
            copyButton.textContent = 'Failed';
            setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);
          });
      });
      
      titleBar.appendChild(copyButton);
      section.appendChild(titleBar);
      
      const codeBlock = document.createElement('pre');
      codeBlock.style.cssText = `
        margin: 0;
        padding: 8px;
        background-color: #f9f9f9;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 150px;
        font-family: monospace;
        font-size: 12px;
      `;
      codeBlock.textContent = content;
      section.appendChild(codeBlock);
      
      return section;
    }
  
    // Function to clean HTML for display
    function cleanHTML(html) {
      return html
        .replace(/>/g, '>\n')
        .replace(/</g, '\n<')
        .replace(/\n\n/g, '\n')
        .trim();
    }
  
    // Click handler to get element info
    function handleElementClick(e) {
      // Ignore clicks on buttons and the overlay
      if (e.target.tagName === 'BUTTON' || e.target.closest('#snippet-overlay')) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      const element = e.target;
      
      // Clear previous content
      content.innerHTML = '';
      
      // Get HTML snippet with parent context
      const htmlSnippet = getContextHTML(element);
      const cleanedHTML = cleanHTML(htmlSnippet);
      content.appendChild(createSnippetSection('HTML (with parent)', cleanedHTML));
      
      // Get absolute XPath
      const absoluteXPath = getAbsoluteXPath(element);
      content.appendChild(createSnippetSection('Absolute XPath', absoluteXPath));
      
      // Get relative XPath
      const relativeXPath = getRelativeXPath(element);
      content.appendChild(createSnippetSection('Relative XPath', relativeXPath));
      
      return false;
    }
  
    // Add click event listener to document
    document.addEventListener('click', handleElementClick, true);
    
    // Add escape key listener
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (document.getElementById('snippet-overlay')) {
          document.getElementById('snippet-overlay').remove();
          document.removeEventListener('click', handleElementClick, true);
        }
      }
    });
  })();