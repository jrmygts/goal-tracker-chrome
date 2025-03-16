// New Tab script for Goal Tracker Extension
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const currentGoalElement = document.getElementById('current-goal');
  const timerDisplayElement = document.getElementById('timer-display');
  const completeGoalBtn = document.getElementById('complete-goal-btn');
  const pauseResumeBtn = document.getElementById('pause-resume-btn');
  const goalInput = document.getElementById('goal-input');
  const setGoalBtn = document.getElementById('set-goal-btn');
  const goalModal = document.getElementById('goal-modal');
  const modalGoalInput = document.getElementById('modal-goal-input');
  const modalSetGoalBtn = document.getElementById('modal-set-goal-btn');
  
  let hasActiveGoal = false;
  
  // Get current timer state from service worker
  async function updateTimerState() {
    try {
      console.log('Newtab: Requesting timer state');
      const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
      console.log('Newtab: Received timer state:', response);
      
      if (response) {
        updateUIWithTimerState(response);
      }
    } catch (error) {
      console.error('Newtab: Error getting timer state:', error);
    }
  }
  
  // Update UI with timer state data
  function updateUIWithTimerState(data) {
    console.log('Newtab: Updating UI with timer state:', data);
    
    // Update goal display
    if (data.currentGoal) {
      currentGoalElement.textContent = data.currentGoal;
      completeGoalBtn.disabled = false;
      pauseResumeBtn.disabled = false;
      hasActiveGoal = true;
      
      // Update pause/resume button text
      pauseResumeBtn.textContent = data.timerRunning ? 'Pause' : 'Resume';
      
      // Hide modal if it's showing
      hideGoalModal();
    } else {
      currentGoalElement.textContent = 'No goal set';
      completeGoalBtn.disabled = true;
      pauseResumeBtn.disabled = true;
      hasActiveGoal = false;
      
      // Show goal modal if no active goal
      showGoalModal();
    }
    
    // Update timer display
    timerDisplayElement.textContent = data.formattedTime;
  }
  
  // Show goal setting modal
  function showGoalModal() {
    goalModal.style.display = 'flex';
    modalGoalInput.focus();
  }
  
  // Hide goal setting modal
  function hideGoalModal() {
    goalModal.style.display = 'none';
  }
  
  // Set a new goal
  async function setGoal(goalText) {
    if (!goalText) return;
    
    try {
      console.log('Newtab: Setting goal:', goalText);
      await chrome.runtime.sendMessage({
        action: 'setGoal',
        data: { goal: goalText }
      });
      
      // Update UI
      updateTimerState();
      
      // Hide modal
      hideGoalModal();
      
      // Clear inputs
      goalInput.value = '';
      modalGoalInput.value = '';
    } catch (error) {
      console.error('Newtab: Error setting goal:', error);
    }
  }
  
  // Complete current goal
  async function completeGoal() {
    try {
      console.log('Newtab: Completing goal');
      await chrome.runtime.sendMessage({ action: 'completeGoal' });
      
      // Update UI
      updateTimerState();
    } catch (error) {
      console.error('Newtab: Error completing goal:', error);
    }
  }
  
  // Toggle pause/resume timer
  async function togglePauseResume() {
    const action = pauseResumeBtn.textContent === 'Pause' ? 'pauseTimer' : 'resumeTimer';
    
    try {
      console.log(`Newtab: ${action}`);
      await chrome.runtime.sendMessage({ action });
      
      // Update UI
      updateTimerState();
    } catch (error) {
      console.error(`Newtab: Error ${action}:`, error);
    }
  }
  
  // Listen for timer updates from service worker
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Newtab: Received message:', message);
    
    if (message.action === 'timerUpdate') {
      updateUIWithTimerState(message.data);
    }
    
    // Always return true for async response handling in Manifest V3
    return true;
  });
  
  // Add event listeners
  setGoalBtn.addEventListener('click', () => {
    setGoal(goalInput.value.trim());
  });
  
  modalSetGoalBtn.addEventListener('click', () => {
    setGoal(modalGoalInput.value.trim());
  });
  
  completeGoalBtn.addEventListener('click', completeGoal);
  pauseResumeBtn.addEventListener('click', togglePauseResume);
  
  // Add enter key event for goal inputs
  goalInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      setGoal(goalInput.value.trim());
    }
  });
  
  modalGoalInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      setGoal(modalGoalInput.value.trim());
    }
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    if (e.target === goalModal && hasActiveGoal) {
      hideGoalModal();
    }
  });
  
  // Initialize UI
  console.log('Newtab: Initializing');
  updateTimerState();
  
  // Set up periodic updates
  setInterval(updateTimerState, 1000);
});
