// Image carousel functionality
document.addEventListener('DOMContentLoaded', function() {
  initCarousels();
});

function initCarousels() {
  const carousels = document.querySelectorAll('[data-carousel]');
  
  carousels.forEach(carousel => {
    const dots = carousel.parentElement.querySelectorAll('.carousel-dot');
    const images = carousel.querySelectorAll('img');
    let currentSlide = 0;
    
    if (dots.length <= 1) return; // Skip if only one image
    
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        goToSlide(index);
      });
    });
    
    function goToSlide(slideIndex) {
      // Update active dot
      dots[currentSlide].classList.remove('active');
      dots[slideIndex].classList.add('active');
      
      // Move carousel
      carousel.style.transform = `translateX(-${slideIndex * 100}%)`;
      
      currentSlide = slideIndex;
    }
    
    // Auto-advance carousel on hover (optional)
    let autoAdvanceInterval;
    
    carousel.parentElement.addEventListener('mouseenter', () => {
      if (images.length > 1) {
        autoAdvanceInterval = setInterval(() => {
          const nextSlide = (currentSlide + 1) % images.length;
          goToSlide(nextSlide);
        }, 3000);
      }
    });
    
    carousel.parentElement.addEventListener('mouseleave', () => {
      clearInterval(autoAdvanceInterval);
    });
  });
}