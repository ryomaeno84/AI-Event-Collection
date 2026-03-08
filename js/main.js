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
});
