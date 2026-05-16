/**
 * AI Event Collection 2027 - Supporter Page JS
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Intersection Observer for Scroll Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Once visible, we don't need to observe it anymore
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Select all elements with .fade-in class
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => {
        observer.observe(el);
    });

    // Specific handling for Hero to ensure it animates early
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        setTimeout(() => {
            heroContent.classList.add('visible');
        }, 100);
    }

    // CTA Button Click handling (Smooth Scroll is already handled by CSS scroll-behavior: smooth)
    // But we can add a fallback or logging if necessary.
    const ctaButtons = document.querySelectorAll('a[href^="#"]');
    ctaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const targetId = button.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // The browser will handle the smooth scroll due to CSS
                // We just prevent default if we want custom logic, but standard behavior is fine here.
            }
        });
    });

    // Optional: Dynamic floating items generation if we wanted more variety
    // For now, they are static in HTML for simplicity and performance.
});
