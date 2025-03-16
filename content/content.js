// Content script for Goal Tracker Extension
// Creates and manages the persistent monitoring window on web pages

// Create monitoring window DOM structure
function createMonitoringWindow() {
  // Create main container
  const monitorContainer = document.createElement('div');
  monitorContainer.className = 'goal-tracker-monitor';
  monitorContainer.id = 'goal-tracker-monitor';
  
  // Create header with controls
  const header = document.createElement('div');
  header.className = 'goal-tracker-header';
  
  const title = document.createElement('div');
  title.className = 'goal-tracker-title';
  title.textContent = 'Goal Tracker';
  
  const controls = document.createElement('div');
  controls.className = 'goal-tracker-controls';
  
  const minimizeBtn = document.createElement('button');
  minimizeBtn.className = 'goal-tracker-control';
  minimizeBtn.id = 'goal-tracker-minimize';
  minimizeBtn.innerHTML = '&#8212;';
  minimizeBtn.title = 'Minimize';
  
  const hideBtn = document.createElement('button');
  hideBtn.className = 'goal-tracker-control';
  hideBtn.id = 'goal-tracker-hide';
  hideBtn.innerHTML = '&#10005;';
  hideBtn.title = 'Hide';
  
  controls.appendChild(minimizeBtn);
  controls.appendChild(hideBtn);
  
  header.appendChild(title);
  header.appendChild(controls);
  
  // Create content area
  const content = document.createElement('div');
  content.className = 'goal-tracker-content';
  
  // Goal display
  const goalDisplay = document.createElement('div');
  goalDisplay.className = 'goal-tracker-goal';
  goalDisplay.id = 'goal-tracker-goal';
  goalDisplay.textContent = 'Loading...';
  
  // Timer display
  const timerDisplay = document.createElement('div');
  timerDisplay.className = 'goal-tracker-timer';
  timerDisplay.id = 'goal-tracker-timer';
  timerDisplay.textContent = '00:00:00';
  
  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'goal-tracker-actions';
  
  const pauseResumeBtn = document.createElement('button');
  pauseResumeBtn.className = 'goal-tracker-button';
  pauseResumeBtn.id = 'goal-tracker-pause-resume';
  pauseResumeBtn.textContent = 'Pause';
  
  const completeBtn = document.createElement('button');
  completeBtn.className = 'goal-tracker-button complete';
  completeBtn.id = 'goal-tracker-complete';
  completeBtn.textContent = 'Complete';
  
  actions.appendChild(pauseResumeBtn);
  actions.appendChild(completeBtn);
  
  // No goal message (hidden by default)
  const noGoalMessage = document.createElement('div');
  noGoalMessage.className = 'goal-tracker-no-goal';
  noGoalMessage.id = 'goal-tracker-no-goal';
  noGoalMessage.textContent = 'No active goal';
  noGoalMessage.style.display = 'none';
  
  // Set goal input (hidden by default)
  const setGoalContainer = document.createElement('div');
  setGoalContainer.id = 'goal-tracker-set-goal';
  setGoalContainer.style.display = 'none';
  
  const setGoalInput = document.createElement('input');
  setGoalInput.type = 'text';
  setGoalInput.className = 'goal-tracker-set-goal-input';
  setGoalInput.id = 'goal-tracker-set-goal-input';
  setGoalInput.placeholder = 'Enter your goal...';
  
  const setGoalBtn = document.createElement('button');
  setGoalBtn.className = 'goal-tracker-button';
  setGoalBtn.id = 'goal-tracker-set-goal-btn';
  setGoalBtn.textContent = 'Set Goal';
  
  setGoalContainer.appendChild(setGoalInput);
  setGoalContainer.appendChild(setGoalBtn);
  
  // Assemble content area
  content.appendChild(goalDisplay);
  content.appendChild(timerDisplay);
  content.appendChild(actions);
  content.appendChild(noGoalMessage);
  content.appendChild(setGoalContainer);
  
  // Assemble monitoring window
  monitorContainer.appendChild(header);
  monitorContainer.appendChild(content);
  
  // Add to page
  document.body.appendChild(monitorContainer);
  
  return monitorContainer;
}

// Make monitoring window draggable
function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  const header = element.querySelector('.goal-tracker-header');
  if (header) {
    header.onmousedown = dragMouseDown;
  } else {
    element.onmousedown = dragMouseDown;
  }
  
  function dragMouseDown(e) {
    e.preventDefault();
    // Get the mouse cursor position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // Call a function whenever the cursor moves
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e.preventDefault();
    // Calculate the new cursor position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // Set the element's new position
    const rect = element.getBoundingClientRect();
    
    // Calculate new position
    let newTop = element.offsetTop - pos2;
    let newLeft = element.offsetLeft - pos1;
    
    // Ensure the window stays within viewport bounds
    if (newTop < 0) newTop = 0;
    if (newLeft < 0) newLeft = 0;
    if (newTop > window.innerHeight - rect.height) {
      newTop = window.innerHeight - rect.height;
    }
    if (newLeft > window.innerWidth - rect.width) {
      newLeft = window.innerWidth - rect.width;
    }
    
    element.style.top = newTop + "px";
    element.style.left = newLeft + "px";
    element.style.bottom = "auto";
    element.style.right = "auto";
    
    // Save position to storage
    chrome.storage.local.set({
      monitorPosition: { top: newTop, left: newLeft }
    });
  }
  
  function closeDragElement() {
    // Stop moving when mouse button is released
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Update monitoring window with current goal and timer
function updateMonitoringWindow(data) {
  const goalElement = document.getElementById('goal-tracker-goal');
  const timerElement = document.getElementById('goal-tracker-timer');
  const pauseResumeBtn = document.getElementById('goal-tracker-pause-resume');
  const completeBtn = document.getElementById('goal-tracker-complete');
  const noGoalMessage = document.getElementById('goal-tracker-no-goal');
  const setGoalContainer = document.getElementById('goal-tracker-set-goal');
  
  if (data.currentGoal) {
    // Show goal and timer
    goalElement.textContent = data.currentGoal;
    timerElement.textContent = data.formattedTime;
    
    // Show action buttons
    pauseResumeBtn.style.display = 'block';
    completeBtn.style.display = 'block';
    
    // Update pause/resume button text
    pauseResumeBtn.textContent = data.timerRunning ? 'Pause' : 'Resume';
    
    // Hide no goal message and set goal input
    noGoalMessage.style.display = 'none';
    setGoalContainer.style.display = 'none';
    
    // Show goal and timer
    goalElement.style.display = 'block';
    timerElement.style.display = 'block';
  } else {
    // Hide goal, timer and action buttons
    goalElement.style.display = 'none';
    timerElement.style.display = 'none';
    pauseResumeBtn.style.display = 'none';
    completeBtn.style.display = 'none';
    
    // Show no goal message and set goal input
    noGoalMessage.style.display = 'block';
    setGoalContainer.style.display = 'block';
  }
}

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'timerUpdate') {
    updateMonitoringWindow(message.data);
  }
  // Always return true for async response handling in Manifest V3
  return true;
});

// Initialize monitoring window
function initMonitoringWindow() {
  // Create the monitoring window if it doesn't exist
  if (!document.getElementById('goal-tracker-monitor')) {
    createMonitoringWindow();
    
    // Make the window draggable
    const monitorElement = document.getElementById('goal-tracker-monitor');
    if (monitorElement) {
      makeDraggable(monitorElement);
    }
    
    // Set up event listeners for the controls
    const minimizeBtn = document.getElementById('goal-tracker-minimize');
    const hideBtn = document.getElementById('goal-tracker-hide');
    const showBtn = document.getElementById('goal-tracker-show-button');
    
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', function() {
        const monitorContent = document.querySelector('.goal-tracker-content');
        if (monitorContent) {
          const isMinimized = monitorContent.classList.toggle('goal-tracker-minimized');
          minimizeBtn.innerHTML = isMinimized ? '&#9650;' : '&#8212;';
          minimizeBtn.title = isMinimized ? 'Expand' : 'Minimize';
        }
      });
    }
    
    if (hideBtn) {
      hideBtn.addEventListener('click', function() {
        const monitor = document.getElementById('goal-tracker-monitor');
        const showButton = document.getElementById('goal-tracker-show-button');
        
        if (monitor) {
          monitor.style.display = 'none';
        }
        
        if (showButton) {
          showButton.style.display = 'block';
        }
      });
    }
    
    if (showBtn) {
      showBtn.addEventListener('click', function() {
        const monitor = document.getElementById('goal-tracker-monitor');
        
        if (monitor) {
          monitor.style.display = 'block';
        }
        
        showBtn.style.display = 'none';
      });
    }
  }
  
  // Get initial timer state
  chrome.runtime.sendMessage({ action: 'getTimerState' })
    .then(response => {
      if (response) {
        updateMonitoringWindow(response);
      }
    })
    .catch(error => {
      console.error('Error getting timer state:', error);
    });
}

// Initialize when the content script loads
initMonitoringWindow();
