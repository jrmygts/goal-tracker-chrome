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
      const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
      
      if (response) {
        // Update goal display
        if (response.currentGoal) {
          currentGoalElement.textContent = response.currentGoal;
          completeGoalBtn.disabled = false;
          pauseResumeBtn.disabled = false;
          hasActiveGoal = true;
          
          // Update pause/resume button text
          pauseResumeBtn.textContent = response.timerRunning ? 'Pause' : 'Resume';
        } else {
          currentGoalElement.textContent = 'No goal set';
          completeGoalBtn.disabled = true;
          pauseResumeBtn.disabled = true;
          hasActiveGoal = false;
          
          // Show goal modal if no active goal
          showGoalModal();
        }
        
        // Update timer display
        timerDisplayElement.textContent = response.formattedTime;
      }
    } catch (error) {
      console.error('Error getting timer state:', error);
    }
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
      console.error('Error setting goal:', error);
    }
  }
  
  // Complete current goal
  async function completeGoal() {
    try {
      await chrome.runtime.sendMessage({ action: 'completeGoal' });
      
      // Update UI
      updateTimerState();
    } catch (error) {
      console.error('Error completing goal:', error);
    }
  }
  
  // Toggle pause/resume timer
  async function togglePauseResume() {
    const action = pauseResumeBtn.textContent === 'Pause' ? 'pauseTimer' : 'resumeTimer';
    
    try {
      await chrome.runtime.sendMessage({ action });
      
      // Update UI
      updateTimerState();
    } catch (error) {
      console.error(`Error ${action}:`, error);
    }
  }
  
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
  updateTimerState();
  
  // Set up periodic updates
  setInterval(updateTimerState, 1000);
});
