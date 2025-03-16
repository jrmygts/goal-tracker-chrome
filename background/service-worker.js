// Service worker for Goal Tracker Extension
// Handles timer functionality, tab events, and state persistence

// Storage utility functions
// Save goal data to storage
function saveGoalData(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

// Retrieve goal data from storage
function getGoalData(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

// Add a completed goal to history
async function addCompletedGoal(goal, duration) {
  try {
    const data = await getGoalData(['completedGoals']);
    const completedGoals = data.completedGoals || [];
    
    completedGoals.push({
      goal,
      completedAt: Date.now(),
      duration
    });
    
    // Limit history to last 50 goals
    if (completedGoals.length > 50) {
      completedGoals.shift();
    }
    
    await saveGoalData({ completedGoals });
    return true;
  } catch (error) {
    console.error('Error adding completed goal:', error);
    return false;
  }
}

// Clear all goal data (for testing or reset)
function clearAllGoalData() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

// State variables
let currentGoal = null;
let timerStartTime = null;
let timerRunning = false;
let elapsedTimeBeforeStart = 0; // For resuming timer after browser restart
let completedGoals = [];
let timerInterval = null;

// Initialize extension state
async function initializeState() {
  try {
    // Load saved state from storage
    const result = await getGoalData([
      'currentGoal', 
      'timerStartTime', 
      'timerRunning', 
      'elapsedTimeBeforeStart', 
      'completedGoals'
    ]);
    
    currentGoal = result.currentGoal || null;
    timerRunning = result.timerRunning || false;
    elapsedTimeBeforeStart = result.elapsedTimeBeforeStart || 0;
    completedGoals = result.completedGoals || [];
    
    // If timer was running when browser closed, restart it
    if (timerRunning && result.timerStartTime) {
      // Calculate elapsed time since browser was closed
      const storedStartTime = result.timerStartTime;
      const now = Date.now();
      
      // Update elapsed time to include time while browser was closed
      elapsedTimeBeforeStart += (now - storedStartTime);
      
      // Restart timer with new start time
      timerStartTime = now;
      await saveState();
      
      // Start the timer interval
      startTimerInterval();
    }
  } catch (error) {
    console.error('Error initializing state:', error);
  }
}

// Save current state to storage
async function saveState() {
  try {
    await saveGoalData({
      currentGoal,
      timerStartTime,
      timerRunning,
      elapsedTimeBeforeStart,
      completedGoals
    });
  } catch (error) {
    console.error('Error saving state:', error);
  }
}

// Start timer for a goal
async function startTimer(goal) {
  currentGoal = goal;
  timerStartTime = Date.now();
  timerRunning = true;
  
  await saveState();
  
  // Start the timer interval
  startTimerInterval();
  
  // Notify all tabs about the new goal and timer state
  broadcastTimerState();
}

// Stop timer and record completed goal
async function stopTimer(completed = true) {
  if (!timerRunning) return;
  
  const endTime = Date.now();
  const totalElapsedTime = calculateElapsedTime();
  
  timerRunning = false;
  
  // Stop the timer interval
  stopTimerInterval();
  
  if (completed && currentGoal) {
    try {
      // Add to completed goals history using the utility function
      await addCompletedGoal(currentGoal, totalElapsedTime);
      
      // Update local completedGoals array to stay in sync
      const data = await getGoalData(['completedGoals']);
      completedGoals = data.completedGoals || [];
    } catch (error) {
      console.error('Error recording completed goal:', error);
      
      // Fallback: add to local array if storage operation failed
      completedGoals.push({
        goal: currentGoal,
        completedAt: endTime,
        duration: totalElapsedTime
      });
    }
    
    // Reset current goal
    currentGoal = null;
  }
  
  // Reset timer values
  timerStartTime = null;
  elapsedTimeBeforeStart = 0;
  
  await saveState();
  broadcastTimerState();
}

// Calculate total elapsed time in milliseconds
function calculateElapsedTime() {
  if (!timerRunning) return elapsedTimeBeforeStart;
  
  const now = Date.now();
  return elapsedTimeBeforeStart + (now - timerStartTime);
}

// Format milliseconds to HH:MM:SS
function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Start the timer interval
function startTimerInterval() {
  // Clear any existing interval first
  stopTimerInterval();
  
  // Set up periodic timer updates (every second)
  timerInterval = setInterval(() => {
    if (timerRunning) {
      broadcastTimerState();
    }
  }, 1000);
}

// Stop the timer interval
function stopTimerInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Broadcast timer state to all tabs
function broadcastTimerState() {
  const elapsedTime = calculateElapsedTime();
  const formattedTime = formatTime(elapsedTime);
  
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      try {
        chrome.tabs.sendMessage(tab.id, {
          action: 'timerUpdate',
          data: {
            currentGoal,
            timerRunning,
            elapsedTime,
            formattedTime
          }
        }).catch(err => {
          // Ignore errors from tabs that can't receive messages
          // This is common in Manifest V3 when sending to special pages
        });
      } catch (error) {
        // Ignore errors from tabs that can't receive messages
      }
    });
  });
}

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Use a function to handle async operations with sendResponse
  const handleMessage = async () => {
    try {
      switch (message.action) {
        case 'setGoal':
          await startTimer(message.data.goal);
          return { success: true };
          
        case 'completeGoal':
          await stopTimer(true);
          return { success: true };
          
        case 'pauseTimer':
          if (timerRunning) {
            // Store elapsed time so far
            elapsedTimeBeforeStart = calculateElapsedTime();
            timerRunning = false;
            timerStartTime = null;
            stopTimerInterval();
            await saveState();
            broadcastTimerState();
          }
          return { success: true };
          
        case 'resumeTimer':
          if (!timerRunning && currentGoal) {
            timerStartTime = Date.now();
            timerRunning = true;
            startTimerInterval();
            await saveState();
            broadcastTimerState();
          }
          return { success: true };
          
        case 'getTimerState':
          return {
            currentGoal,
            timerRunning,
            elapsedTime: calculateElapsedTime(),
            formattedTime: formatTime(calculateElapsedTime())
          };
          
        case 'getCompletedGoals':
          // Get the latest completed goals from storage
          const data = await getGoalData(['completedGoals']);
          return { completedGoals: data.completedGoals || [] };
          
        default:
          return { error: 'Unknown action' };
      }
    } catch (error) {
      console.error('Error handling message:', error);
      return { error: error.message };
    }
  };
  
  // In Manifest V3, we need to handle async responses differently
  handleMessage().then(response => {
    sendResponse(response);
  }).catch(error => {
    console.error('Error in message handler:', error);
    sendResponse({ error: error.message });
  });
  
  return true; // Keep the message channel open for async response
});

// Listen for tab creation events
chrome.tabs.onCreated.addListener((tab) => {
  // We'll handle the new tab page separately in the newtab.html/js
});

// Initialize when service worker loads
initializeState();

// Add listener for when the service worker is about to be terminated
chrome.runtime.onSuspend.addListener(() => {
  // Clean up resources
  stopTimerInterval();
}); 