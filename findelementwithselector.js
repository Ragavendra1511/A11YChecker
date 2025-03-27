javascript:(function() {
  // Create UI elements
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 15px;
    z-index: 10000;
    box-shadow: 0 0 10px rgba(0,0,0,0.2);
    font-family: Arial, sans-serif;
    max-width: 400px;
    cursor: move;
    user-select: none;
    transition: box-shadow 0.3s ease;
  `;
  
  const title = document.createElement('h3');
  title.textContent = 'Element Highlighter';
  title.style.margin = '0 0 10px 0';
  
  const inputContainer = document.createElement('div');
  inputContainer.style.display = 'flex';
  inputContainer.style.marginBottom = '10px';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Enter selector, XPath, or HTML snippet';
  input.style.cssText = `
    flex-grow: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-right: 5px;
  `;
  
  const typeSelect = document.createElement('select');
  typeSelect.style.cssText = `
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  `;
  
  const types = ['CSS Selector', 'XPath (absolute)', 'XPath (relative)', 'HTML Snippet'];
  types.forEach(type => {
    const option = document.createElement('option');
    option.text = type;
    option.value = type.toLowerCase().replace(/\s/g, '-').replace(/[()]/g, '');
    typeSelect.appendChild(option);
  });
  
  const highlightButton = document.createElement('button');
  highlightButton.textContent = 'Highlight';
  highlightButton.style.cssText = `
    padding: 8px 12px;
    background: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 5px;
  `;
  
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.cssText = `
    padding: 8px 12px;
    background: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;
  
  const resultsDiv = document.createElement('div');
  resultsDiv.style.marginTop = '10px';
  
  // Build UI
  inputContainer.appendChild(input);
  container.appendChild(title);
  container.appendChild(typeSelect);
  container.appendChild(inputContainer);
  
  const buttonContainer = document.createElement('div');
  buttonContainer.appendChild(highlightButton);
  buttonContainer.appendChild(closeButton);
  container.appendChild(buttonContainer);
  
  container.appendChild(resultsDiv);
  document.body.appendChild(container);
  
  // Store highlighted elements to reset them later
  let highlightedElements = [];
  
  // Add these utility functions before highlightElements
  function isElementVisible(el) {
    const style = window.getComputedStyle(el);
    const isCurrentlyVisible = style.display !== 'none' 
                             && style.visibility !== 'hidden' 
                             && style.opacity !== '0'
                             && el.offsetParent !== null;
  
    return isCurrentlyVisible || isElementVisibleOnHoverOrFocus(el);
  }

  function findClosestVisibleParent(el) {
    let current = el.parentElement;
    while (current && !isElementVisible(current)) {
      current = current.parentElement;
    }
    return current || el;
  }

  function isElementVisibleOnHoverOrFocus(el) {
    // Store original styles
    const originalDisplay = el.style.display;
    const originalVisibility = el.style.visibility;
    const originalOpacity = el.style.opacity;
    
    // Simulate hover and focus states
    el.style.display = '';
    el.style.visibility = '';
    el.style.opacity = '1';
    
    // Force layout recalculation
    el.offsetHeight;
    
    // Check if element becomes visible
    const style = window.getComputedStyle(el);
    const wouldBeVisible = style.display !== 'none' && 
                          style.visibility !== 'hidden' && 
                          style.opacity !== '0';
    
    // Restore original styles
    el.style.display = originalDisplay;
    el.style.visibility = originalVisibility;
    el.style.opacity = originalOpacity;
    
    return wouldBeVisible;
  }

  // Replace the existing highlightElements function
  function highlightElements(elements) {
    resetHighlights();
    
    if (!elements || elements.length === 0) {
      resultsDiv.innerHTML = '<p style="color: red">No elements found</p>';
      return;
    }
    
    let visibleCount = 0;
    let hiddenCount = 0;
    let hoverVisibleCount = 0;
    
    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const isCurrentlyVisible = style.display !== 'none' && 
                               style.visibility !== 'hidden' && 
                               style.opacity !== '0' &&
                               el.offsetParent !== null;
      const isVisibleOnHover = !isCurrentlyVisible && isElementVisibleOnHoverOrFocus(el);
      
      const elementToHighlight = isCurrentlyVisible || isVisibleOnHover ? 
                               el : findClosestVisibleParent(el);
      
      // Store original styles
      const originalStyles = {
        outline: elementToHighlight.style.outline,
        backgroundColor: elementToHighlight.style.backgroundColor,
        position: elementToHighlight.style.position,
        boxShadow: elementToHighlight.style.boxShadow
      };
      
      // Apply highlight styles based on visibility state
      if (isCurrentlyVisible) {
        elementToHighlight.style.outline = '2px solid red';
        elementToHighlight.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
        visibleCount++;
      } else if (isVisibleOnHover) {
        elementToHighlight.style.outline = '2px dashed blue';
        elementToHighlight.style.boxShadow = '0 0 5px rgba(0, 0, 255, 0.5)';
        elementToHighlight.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
        hoverVisibleCount++;
      } else {
        elementToHighlight.style.outline = '2px dashed orange';
        elementToHighlight.style.backgroundColor = 'rgba(255, 165, 0, 0.2)';
        hiddenCount++;
      }
      
      highlightedElements.push({
        element: elementToHighlight,
        originalStyles: originalStyles,
        isHidden: !isCurrentlyVisible,
        isHoverVisible: isVisibleOnHover
      });
    });
    
    // Update results message with hover/focus information
    resultsDiv.innerHTML = `
      <p style="color: green">Found ${elements.length} element(s)</p>
      ${hoverVisibleCount > 0 ? `
        <p style="color: blue; font-size: 12px;">
          Note: ${hoverVisibleCount} element(s) are visible only on hover/focus
          (highlighted in blue)
        </p>
      ` : ''}
      ${hiddenCount > 0 ? `
        <p style="color: orange; font-size: 12px;">
          Note: ${hiddenCount} hidden element(s) have their parent containers
          highlighted in orange
        </p>
      ` : ''}
    `;
  }
  
  // Function to reset highlights
  function resetHighlights() {
    highlightedElements.forEach(item => {
      const el = item.element;
      const styles = item.originalStyles;
      
      el.style.outline = styles.outline;
      el.style.backgroundColor = styles.backgroundColor;
      el.style.position = styles.position;
      el.style.boxShadow = styles.boxShadow;
    });
    
    highlightedElements = [];
    resultsDiv.innerHTML = '';
  }
  
  // Find elements based on input type
  function findElements() {
    const query = input.value.trim();
    const type = typeSelect.value;
    
    if (!query) {
      resultsDiv.innerHTML = '<p style="color: orange">Please enter a query</p>';
      return;
    }
    
    let elements = [];
    
    try {
      switch (type) {
        case 'css-selector':
          try {
            // Try to simplify the selector first
            const simplifiedSelector = simplifySelector(query);
            elements = Array.from(document.querySelectorAll(simplifiedSelector));
            
            // If no elements found with simplified selector, try original
            if (elements.length === 0) {
              elements = Array.from(document.querySelectorAll(query));
            }
          } catch (selectorError) {
            // Try with most specific part of the selector
            const lastPart = query.split(' ').pop();
            const cleanSelector = lastPart.split(':')[0]; // Remove pseudo-classes
            
            try {
              elements = Array.from(document.querySelectorAll(cleanSelector));
            } catch {
              throw new Error('Could not parse selector. Try using a simpler selector.');
            }
          }
          break;
          
        case 'xpath-absolute':
        case 'xpath-relative':
          const xpathResult = document.evaluate(
            query, 
            document, 
            null, 
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
            null
          );
          
          for (let i = 0; i < xpathResult.snapshotLength; i++) {
            elements.push(xpathResult.snapshotItem(i));
          }
          break;
          
        case 'html-snippet':
          // Create a temporary container to parse HTML
          const tempContainer = document.createElement('div');
          tempContainer.innerHTML = query.trim();
          
          const firstEl = tempContainer.firstElementChild;
          if (firstEl) {
            // Get the exact HTML structure (removing whitespace between tags)
            const templateHTML = firstEl.outerHTML.replace(/>\s+</g, '><').trim();
            const templateText = firstEl.textContent.trim();
            
            // Find all elements with the same tag
            const candidates = document.getElementsByTagName(firstEl.tagName);
            
            for (let el of candidates) {
              // Check exact HTML match or structure + text content match
              const candidateHTML = el.outerHTML.replace(/>\s+</g, '><').trim();
              const candidateText = el.textContent.trim();
              
              if (candidateHTML === templateHTML || 
                  (el.children.length === firstEl.children.length && 
                   candidateText === templateText &&
                   Array.from(el.attributes).length === Array.from(firstEl.attributes).length)) {
                elements.push(el);
              }
            }
          }
          break;
      }
      
      highlightElements(elements);
      
    } catch (error) {
      resultsDiv.innerHTML = `<p style="color: red">Error: ${error.message}</p>
        <p style="color: orange; font-size: 12px; margin-top: 5px;">
          Tip: Try using a simpler selector like 'input[type="search"]' or '#searchInput'
        </p>`;
      console.error('Selector error:', error);
    }
  }
  
  function simplifySelector(selector) {
    // Try to extract the most useful parts of the selector
    const parts = selector.split(' ');
    const lastPart = parts[parts.length - 1];
    
    // Check for common patterns
    if (lastPart.includes('input')) {
      // If it's an input, try to find by type or name
      const typeMatch = lastPart.match(/type=['"]([^'"]*)['"]/);
      const nameMatch = lastPart.match(/name=['"]([^'"]*)['"]/);
      
      if (typeMatch) {
        return `input[type="${typeMatch[1]}"]`;
      }
      if (nameMatch) {
        return `input[name="${nameMatch[1]}"]`;
      }
      return 'input';
    }
    
    // Look for IDs
    const idMatch = selector.match(/#[\w-]+/);
    if (idMatch) {
      return idMatch[0];
    }
    
    // Look for classes
    const classMatch = selector.match(/\.[\w-]+/);
    if (classMatch) {
      return classMatch[0];
    }
    
    // Remove nth-of-type and other pseudo-selectors
    return lastPart.split(':')[0];
  }
  
  // Event listeners
  highlightButton.addEventListener('click', findElements);
  input.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      findElements();
    }
  });
  
  closeButton.addEventListener('click', () => {
    resetHighlights();
    document.body.removeChild(container);
  });
  
  // Make the UI draggable
  let isDragging = false;
  let offsetX, offsetY;
  
  container.addEventListener('mousedown', startDragging);
  
  function startDragging(e) {
    // Only allow dragging from the container itself or the title, not from inputs
    if (e.target.tagName.toLowerCase() === 'input' || 
        e.target.tagName.toLowerCase() === 'button' ||
        e.target.tagName.toLowerCase() === 'select') {
      return;
    }
  
    isDragging = true;
    offsetX = e.clientX - container.getBoundingClientRect().left;
    offsetY = e.clientY - container.getBoundingClientRect().top;
    
    container.style.boxShadow = '0 0 15px rgba(0,0,0,0.3)';
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);
    
    e.preventDefault();
  }
  
  function drag(e) {
    if (!isDragging) return;
    
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // Keep the panel within the viewport
    const maxX = window.innerWidth - container.offsetWidth;
    const maxY = window.innerHeight - container.offsetHeight;
    
    container.style.left = Math.min(Math.max(0, x), maxX) + 'px';
    container.style.top = Math.min(Math.max(0, y), maxY) + 'px';
    container.style.right = 'auto';
  }
  
  function stopDragging() {
    isDragging = false;
    container.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDragging);
  }
  
  // Remove the old title-specific drag listeners since we're now using the whole container
  title.style.cursor = 'inherit';
  title.removeEventListener('mousedown', startDragging);
})();
