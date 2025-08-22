// Image carousel functionality
document.addEventListener('DOMContentLoaded', function() {
  initCarousels();
  initTooltips();
  initCursorShadows();
});

function initCarousels() {
  const carousels = document.querySelectorAll('[data-carousel]');
  
  carousels.forEach(carousel => {
    const container = carousel.parentElement;
    const dots = container.querySelectorAll('.carousel-dot');
    const prevBtn = container.querySelector('.carousel-prev');
    const nextBtn = container.querySelector('.carousel-next');
    const images = carousel.querySelectorAll('img');
    let currentSlide = 0;
    
    if (images.length <= 1) return; // Skip if only one image
    
    function goToSlide(slideIndex) {
      // Update active dot
      dots[currentSlide].classList.remove('active');
      dots[slideIndex].classList.add('active');
      
      // Move carousel
      carousel.style.transform = `translateX(-${slideIndex * 100}%)`;
      
      currentSlide = slideIndex;
    }
    
    // Dot navigation
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        goToSlide(index);
      });
    });
    
    // Arrow navigation
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const prevSlide = currentSlide === 0 ? images.length - 1 : currentSlide - 1;
        goToSlide(prevSlide);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const nextSlide = (currentSlide + 1) % images.length;
        goToSlide(nextSlide);
      });
    }
    
    // Auto-advance carousel on hover (optional)
    let autoAdvanceInterval;
    
    container.addEventListener('mouseenter', () => {
      if (images.length > 1) {
        autoAdvanceInterval = setInterval(() => {
          const nextSlide = (currentSlide + 1) % images.length;
          goToSlide(nextSlide);
        }, 3000);
      }
    });
    
    container.addEventListener('mouseleave', () => {
      clearInterval(autoAdvanceInterval);
    });
  });
}

// Tooltip functionality - follows mouse cursor
function initTooltips() {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip-content';
  document.body.appendChild(tooltip);
  
  // Handle both card tooltips and nav tooltips
  const tooltipTriggers = document.querySelectorAll('.item-description-tooltip, .nav-item[data-description]');
  
  tooltipTriggers.forEach(trigger => {
    const description = trigger.getAttribute('data-description');
    if (!description) return;
    
    trigger.addEventListener('mouseenter', (e) => {
      tooltip.textContent = description;
      tooltip.style.opacity = '1';
    });
    
    trigger.addEventListener('mousemove', (e) => {
      tooltip.style.left = (e.clientX + 10) + 'px';
      tooltip.style.top = (e.clientY + 10) + 'px';
    });
    
    trigger.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
  });
}

// Cursor-based shadow direction
function initCursorShadows() {
  const cards = document.querySelectorAll('.item-card');
  const nav = document.querySelector('.main-nav');
  
  document.addEventListener('mousemove', (e) => {
    // Update card shadows
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;
      
      // Calculate cursor position relative to card center
      const deltaX = e.clientX - cardCenterX;
      const deltaY = e.clientY - cardCenterY;
      
      // Normalize and create shadow offset (opposite direction)
      const shadowX = -deltaX * 0.025;
      const shadowY = -deltaY * 0.025;
      
      // Apply dynamic shadow
      card.style.boxShadow = `${shadowX}px ${shadowY}px 30px 10px rgba(0, 0, 0, 0.15), 0 0 20px 5px inset rgba(0, 0, 0, 0.15)`;
    });
    
    // Update nav shadow
    if (nav) {
      const navRect = nav.getBoundingClientRect();
      const navCenterX = navRect.left + navRect.width / 2;
      const navCenterY = navRect.top + navRect.height / 2;
      
      // Calculate cursor position relative to nav center
      const navDeltaX = e.clientX - navCenterX;
      const navDeltaY = e.clientY - navCenterY;
      
      // Normalize and create shadow offset (opposite direction)
      const navShadowX = -navDeltaX * 0.025;
      const navShadowY = -navDeltaY * 0.025;
      
      // Apply dynamic shadow
      nav.style.boxShadow = `${navShadowX}px ${navShadowY}px 30px 10px rgba(0, 0, 0, 0.15), 0 0 20px 5px inset rgba(0, 0, 0, 0.15)`;
    }
  });
}


