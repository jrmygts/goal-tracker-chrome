// Popup script for Goal Tracker Extension
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const currentGoalElement = document.getElementById('current-goal');
  const timerDisplayElement = document.getElementById('timer-display');
  const completeGoalBtn = document.getElementById('complete-goal-btn');
  const pauseResumeBtn = document.getElementById('pause-resume-btn');
  const goalInput = document.getElementById('goal-input');
  const setGoalBtn = document.getElementById('set-goal-btn');
  const goalHistoryElement = document.getElementById('goal-history');
  
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
          
          // Update pause/resume button text based on timer state
          pauseResumeBtn.textContent = response.timerRunning ? 'Pause' : 'Resume';
        } else {
          currentGoalElement.textContent = 'No goal set';
          completeGoalBtn.disabled = true;
          pauseResumeBtn.disabled = true;
        }
        
        // Update timer display
        timerDisplayElement.textContent = response.formattedTime;
      }
    } catch (error) {
      console.error('Error getting timer state:', error);
    }
  }
  
  // Load goal history
  async function loadGoalHistory() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getCompletedGoals' });
      
      if (response && response.completedGoals) {
        // Clear current history
        goalHistoryElement.innerHTML = '';
        
        // Display most recent goals first (up to 5)
        const recentGoals = response.completedGoals.slice(-5).reverse();
        
        if (recentGoals.length === 0) {
          const emptyItem = document.createElement('li');
          emptyItem.textContent = 'No completed goals yet';
          goalHistoryElement.appendChild(emptyItem);
        } else {
          recentGoals.forEach(goal => {
            const item = document.createElement('li');
            
            // Format the date
            const date = new Date(goal.completedAt);
            const formattedDate = date.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            // Format the duration
            const hours = Math.floor(goal.duration / 3600000);
            const minutes = Math.floor((goal.duration % 3600000) / 60000);
            const seconds = Math.floor((goal.duration % 60000) / 1000);
            const formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Create the goal item content
            item.innerHTML = `
              <div class="goal-text">${goal.goal}</div>
              <div class="goal-meta">
                <span class="goal-date">${formattedDate}</span>
                <span class="goal-duration">${formattedDuration}</span>
              </div>
            `;
            
            goalHistoryElement.appendChild(item);
          });
        }
      }
    } catch (error) {
      console.error('Error loading goal history:', error);
    }
  }
  
  // Set a new goal
  async function setGoal() {
    const goalText = goalInput.value.trim();
    
    if (goalText) {
      try {
        await chrome.runtime.sendMessage({
          action: 'setGoal',
          data: { goal: goalText }
        });
        
        // Clear input
        goalInput.value = '';
        
        // Update UI
        updateTimerState();
      } catch (error) {
        console.error('Error setting goal:', error);
      }
    }
  }
  
  // Complete current goal
  async function completeGoal() {
    try {
      await chrome.runtime.sendMessage({ action: 'completeGoal' });
      
      // Update UI
      updateTimerState();
      loadGoalHistory();
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
  setGoalBtn.addEventListener('click', setGoal);
  completeGoalBtn.addEventListener('click', completeGoal);
  pauseResumeBtn.addEventListener('click', togglePauseResume);
  
  // Add enter key event for goal input
  goalInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      setGoal();
    }
  });
  
  // Initialize UI
  updateTimerState();
  loadGoalHistory();
  
  // Set up periodic updates
  setInterval(updateTimerState, 1000);
});
