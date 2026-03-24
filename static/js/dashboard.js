// Dashboard JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    // Sidebar toggle functionality for mobile
    const sidebarToggle = document.createElement('button');
    sidebarToggle.innerHTML = '<i class="fas fa-bars"></i>';
    sidebarToggle.classList.add('sidebar-toggle');
    sidebarToggle.addEventListener('click', toggleSidebar);
    
    // Add sidebar toggle to header
    const header = document.querySelector('header');
    if (header && !document.querySelector('.sidebar-toggle')) {
        header.insertBefore(sidebarToggle, header.firstChild);
        
        // Add CSS for toggle button
        const style = document.createElement('style');
        style.textContent = `
            .sidebar-toggle {
                background: #667eea;
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 8px;
                cursor: pointer;
                margin-right: 15px;
                display: none; /* Initially hidden, shown on mobile */
                font-size: 18px;
            }
            
            @media (max-width: 768px) {
                .sidebar-toggle {
                    display: block;
                }
                
                .sidebar {
                    transform: translateX(-100%);
                }
                
                .sidebar.active {
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add smooth scrolling to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // Add animation to stat cards when they come into view
    animateOnScroll('.stat-card');
    
    // Add notification badge animation
    addNotificationAnimation();
});

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

// Animation when elements come into view
function animateOnScroll(selector) {
    const elements = document.querySelectorAll(selector);
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// Add notification animation
function addNotificationAnimation() {
    // Simulate notifications appearing periodically
    setInterval(() => {
        const randomCard = document.querySelector('.card');
        if (randomCard) {
            randomCard.style.boxShadow = '0 0 15px rgba(102, 126, 234, 0.5)';
            setTimeout(() => {
                randomCard.style.boxShadow = '';
            }, 1000);
        }
    }, 10000); // Every 10 seconds
}

// Utility function to show loading states
function showLoading(element) {
    const originalHTML = element.innerHTML;
    element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    element.disabled = true;
    
    return function() {
        element.innerHTML = originalHTML;
        element.disabled = false;
    };
}

// Form submission with loading state
document.addEventListener('submit', function(e) {
    if (e.target.classList.contains('ajax-form')) {
        e.preventDefault();
        const resetFunction = showLoading(e.target.querySelector('button[type="submit"]'));
        
        // Simulate form submission
        setTimeout(() => {
            resetFunction();
            alert('Action completed successfully!');
        }, 2000);
    }
});

// Add ripple effect to buttons
function addRippleEffect(button) {
    button.addEventListener('click', function(e) {
        let ripple = document.createElement("span");
        ripple.classList.add("ripple");
        
        this.appendChild(ripple);
        
        let x = e.clientX - e.target.getBoundingClientRect().left;
        let y = e.clientY - e.target.getBoundingClientRect().top;
        
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        setTimeout(() => {
            ripple.remove();
        }, 1000);
    });
}

// Add ripple effect to all buttons
document.querySelectorAll('button, .card').forEach(button => {
    addRippleEffect(button);
});

// Add CSS for ripple effect
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// Chart-like animation for stats
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-info p');
    statNumbers.forEach(stat => {
        const finalValue = parseInt(stat.textContent.replace(/[^0-9]/g, ''));
        if (!isNaN(finalValue)) {
            animateValue(stat, 0, finalValue, 2000);
        }
    });
}

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value + (element.textContent.includes('%') ? '%' : 
                                element.textContent.includes('GPA') ? '' : '');
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Initialize stat animations when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', animateStats);
} else {
    animateStats();
}