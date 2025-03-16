// This script helps keep the service worker alive in Manifest V3
// It sends periodic pings to the service worker

// Send a ping to the service worker every 25 seconds
// This helps prevent the service worker from being terminated due to inactivity
setInterval(() => {
  chrome.runtime.sendMessage({ action: 'keepalive' })
    .catch(err => {
      // This error is expected and can be ignored
      console.debug('Keepalive ping error (expected):', err);
    });
}, 25000);

// Also send a ping when the page loads
chrome.runtime.sendMessage({ action: 'keepalive' })
  .catch(err => {
    // This error is expected and can be ignored
    console.debug('Initial keepalive ping error (expected):', err);
  }); 