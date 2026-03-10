document.addEventListener('DOMContentLoaded', () => {
  // Initialize Tab Navigation
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  if (tabBtns.length > 0 && tabPanes.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        // Add active class to clicked tab and corresponding pane
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        const targetPane = document.getElementById(targetId);
        if (targetPane) {
          targetPane.classList.add('active');
        }
      });
    });
  }

  // Loading Overlay Logic (for index.html)
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    // Simulate loading time synchronized with CSS animation duration (0.625s)
    setTimeout(() => {
      loadingOverlay.classList.add('hidden');
      // Optional: remove from DOM entirely after fade out
      setTimeout(() => {
        if(loadingOverlay.parentNode) {
           loadingOverlay.parentNode.removeChild(loadingOverlay);
        }
      }, 800); // Wait for the CSS opacity transition to finish
    }, 625);
  }
});
