// Image carousel functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM Content Loaded - initializing');
  initCarousels();
  initTooltips();
  initViewToggle();
  initListView();
  initModal();
  initGalleryView();
  
  // Better gallery page load transition
  const itemsGrid = document.querySelector('.items-grid');
  if (itemsGrid && document.body.classList.contains('gallery-view')) {
    console.log('📄 Setting up gallery page load transition');
    
    // Start with content hidden
    itemsGrid.style.opacity = '0';
    itemsGrid.style.transition = 'none';
    
    // Small delay then fade in smoothly  
    setTimeout(() => {
      itemsGrid.style.transition = 'opacity 0.4s ease';
      itemsGrid.style.opacity = '1';
      console.log('✅ Gallery page loaded and faded in');
    }, 100);
  }
  
  // Log any additional page events that might be causing double loading
  window.addEventListener('beforeunload', () => {
    console.log('⚡ Page beforeunload event');
  });
  
  window.addEventListener('load', () => {
    console.log('📋 Window load event');
  });
  
  // Handle browser back/forward buttons (only for list view)
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.filter && document.body.classList.contains('list-view')) {
      setActiveFilter(e.state.filter);
      filterListItems(e.state.filter);
    }
  });
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
  
  // Handle card tooltips only
  const tooltipTriggers = document.querySelectorAll('.item-description-tooltip');
  
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


// View toggle functionality
function initViewToggle() {
  const body = document.body;
  const galleryBtn = document.getElementById('gallery-btn');
  const listBtn = document.getElementById('list-btn');
  
  // Check for saved view preference
  const savedView = localStorage.getItem('preferredView');
  const isMobile = window.innerWidth < 768;
  
  // Set default view: list for desktop, gallery for mobile
  let defaultView = isMobile ? 'gallery' : 'list';
  let activeView = savedView || defaultView;
  
  // Apply initial view state
  body.classList.add('view-set', activeView + '-view');
  if (activeView === 'gallery' && galleryBtn) {
    galleryBtn.classList.add('active');
  } else if (activeView === 'list' && listBtn) {
    listBtn.classList.add('active');
  }
  
  // Always populate list view on load (for when it's the default)
  if (activeView === 'list') {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      populateListView();
    }, 50);
  }
  
  // Gallery view button
  if (galleryBtn) {
    galleryBtn.addEventListener('click', () => {
      console.log('🖼️ Switching to gallery view from path:', window.location.pathname, 'isShowingAboutInList:', isShowingAboutInList);
      body.classList.remove('list-view');
      body.classList.add('gallery-view', 'view-set');
      galleryBtn.classList.add('active');
      if (listBtn) listBtn.classList.remove('active');
      localStorage.setItem('preferredView', 'gallery');
      
      // Trigger fade-in animation for gallery view
      const itemsGrid = document.querySelector('.items-grid');
      if (itemsGrid) {
        // Start with content hidden
        itemsGrid.style.opacity = '0';
        itemsGrid.style.transition = 'none';
        
        // Small delay then fade in smoothly
        setTimeout(() => {
          itemsGrid.style.transition = 'opacity 0.4s ease';
          itemsGrid.style.opacity = '1';
        }, 100);
      }
      
      // If we were showing about in list view, navigate to about page
      if (isShowingAboutInList) {
        console.log('🔄 Was showing about in list, navigating to about page');
        const basePath = window.location.origin + (window.location.pathname.includes('/personal-site') ? '/personal-site' : '');
        window.location.href = `${basePath}/about-me/`;
        return;
      }
      
      // Make sure the correct nav item is active in gallery view
      setTimeout(() => {
        const mainNavItems = document.querySelectorAll('.main-nav .nav-item');
        const currentPath = window.location.pathname;
        
        mainNavItems.forEach(item => {
          const itemPath = new URL(item.href).pathname;
          if (itemPath === currentPath) {
            item.classList.add('active');
            console.log('✅ Made nav item active:', item.textContent);
          } else {
            item.classList.remove('active');
          }
        });
      }, 50);
    });
  }
  
  // List view button
  if (listBtn) {
    listBtn.addEventListener('click', () => {
      console.log('📋 Switching to list view from path:', window.location.pathname);
      body.classList.remove('gallery-view');
      body.classList.add('list-view', 'view-set');
      listBtn.classList.add('active');
      if (galleryBtn) galleryBtn.classList.remove('active');
      populateListView();
      localStorage.setItem('preferredView', 'list');
    });
  }
}

// List view functionality
let currentFilter = 'main';
let isShowingAboutInList = false; // Track if we're showing about content in list view
let allItems = [];
let previewCarouselInterval;
let currentPreviewIndex = 0;

// Global slideshow functionality (independent of feeds)
let globalSlideshowInterval;
let globalSlideshowIndex = 0;
let globalSlideshowItems = [];

function initListView() {
  // Collect all items from gallery view
  collectItemsFromGallery();
  
  // Initialize global slideshow (independent of feed filters)
  initGlobalSlideshow();
  
  // Set up list navigation
  const listNavItems = document.querySelectorAll('.list-nav .nav-item');
  listNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = item.getAttribute('data-filter');
      
      // Update URL without reloading page
      const newUrl = item.href;
      history.pushState({filter: filter}, '', newUrl);
      
      setActiveFilter(filter);
      filterListItems(filter); // This will NOT restart the global slideshow
    });
  });
}

function collectItemsFromGallery() {
  // Try to get items from window.siteData if available, otherwise fallback to DOM
  if (window.siteData && window.siteData.allItems) {
    allItems = window.siteData.allItems;
    return;
  }
  
  const galleryItems = document.querySelectorAll('.item-card');
  allItems = [];
  
  galleryItems.forEach(card => {
    const title = card.querySelector('.item-title')?.textContent || '';
    const category = card.getAttribute('data-tags') || '';
    const description = card.getAttribute('data-description') || '';
    const url = card.getAttribute('onclick')?.match(/location\.href='([^']+)'/)?.[1] || '';
    
    // Get cover image
    let coverImage = '';
    const img = card.querySelector('.carousel-image, .image-carousel img');
    if (img) {
      coverImage = img.src;
    }
    
    // Get tags from category
    const tags = category.split(',').map(tag => tag.trim()).filter(Boolean);
    
    allItems.push({
      title,
      category,
      tags,
      description,
      url,
      coverImage
    });
  });
}

function populateListView() {
  const listItemsContainer = document.getElementById('list-items');
  if (!listItemsContainer) return;
  
  // Set initial filter based on current page
  const currentPath = window.location.pathname;
  if (currentPath.includes('/teaching/')) {
    currentFilter = 'teaching';
  } else if (currentPath.includes('/projects/')) {
    currentFilter = 'projects';
  } else if (currentPath.includes('/updates/')) {
    currentFilter = 'updates';
  } else if (currentPath.includes('/about/')) {
    currentFilter = 'about';
  } else {
    currentFilter = 'main';
  }
  
  // Reset about flag - we're showing normal list content
  isShowingAboutInList = false;
  
  console.log('📋 populateListView - detected filter:', currentFilter, 'from path:', currentPath);
  
  setActiveFilter(currentFilter);
  filterListItems(currentFilter);
}

function setActiveFilter(filter) {
  currentFilter = filter;
  const listNavItems = document.querySelectorAll('.list-nav .nav-item');
  listNavItems.forEach(item => {
    if (item.getAttribute('data-filter') === filter) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function filterListItems(filter) {
  const listItemsContainer = document.getElementById('list-items');
  if (!listItemsContainer) return;
  
  // Add fade-out animation
  listItemsContainer.classList.add('fade-out');
  
  setTimeout(() => {
    if (filter === 'about') {
      // Special case for about: render about content instead of items list
      isShowingAboutInList = true;
      renderAboutContent();
    } else {
      isShowingAboutInList = false;
      let filteredItems = [];
      
      if (filter === 'main') {
        // Show items tagged with 'main'
        filteredItems = allItems.filter(item => 
          item.tags && item.tags.includes('main')
        );
      } else {
        // Show items with the specific tag (teaching, projects, updates)
        filteredItems = allItems.filter(item => 
          item.tags && item.tags.includes(filter)
        );
      }
      
      renderListItems(filteredItems);
    }
    
    // Remove fade-out and add fade-in
    listItemsContainer.classList.remove('fade-out');
    listItemsContainer.classList.add('fade-in');
    
    // Remove fade-in class after animation completes
    setTimeout(() => {
      listItemsContainer.classList.remove('fade-in');
    }, 600);
  }, 150);
}

// Global slideshow - independent of feed filtering
function initGlobalSlideshow() {
  // Collect all slideshow images from all items with showInSlideshow: true
  globalSlideshowItems = [];
  
  allItems.forEach((item, index) => {
    if (item.showInSlideshow) {
      // Add slideshow images
      if (item.slideshowImages && item.slideshowImages.length > 0) {
        item.slideshowImages.forEach(imageSrc => {
          globalSlideshowItems.push({
            type: 'image',
            src: imageSrc,
            linkedItem: item,
            title: item.title,
            url: item.url
          });
        });
      }
      
      // Add slideshow links
      if (item.slideshowLinks && item.slideshowLinks.length > 0) {
        item.slideshowLinks.forEach(linkSrc => {
          globalSlideshowItems.push({
            type: 'link',
            src: linkSrc,
            linkedItem: item,
            title: item.title,
            url: item.url
          });
        });
      }
    }
  });
  
  if (globalSlideshowItems.length > 0) {
    startGlobalSlideshow();
  }
}

function startGlobalSlideshow() {
  const previewCarousel = document.getElementById('preview-carousel');
  if (!previewCarousel) return;
  
  // Clear existing content
  previewCarousel.innerHTML = '';
  
  // Add all global slideshow content (images and embeds)
  globalSlideshowItems.forEach((slideItem, index) => {
    if (slideItem.type === 'image') {
      // Add image
      const img = document.createElement('img');
      img.src = slideItem.src;
      img.dataset.linkedItem = slideItem.linkedItem.title; // For future hover highlighting
      
      // Handle external vs internal links
      if (slideItem.linkedItem.linkExternal && slideItem.linkedItem.link) {
        img.style.cursor = 'grab';
        img.onclick = () => window.open(slideItem.linkedItem.link, '_blank');
      } else {
        img.style.cursor = 'grab';
        img.onclick = () => openModal(slideItem.url);
      }
      
      if (index === 0) {
        img.classList.add('active');
      }
      
      previewCarousel.appendChild(img);
    } else if (slideItem.type === 'link') {
      // Add link embed
      const embedDiv = document.createElement('div');
      embedDiv.className = 'preview-embed';
      embedDiv.dataset.linkedItem = slideItem.linkedItem.title; // For future hover highlighting
      
      // Handle external vs internal links for embeds
      if (slideItem.linkedItem.linkExternal && slideItem.linkedItem.link) {
        embedDiv.style.cursor = 'grab';
        embedDiv.onclick = () => window.open(slideItem.linkedItem.link, '_blank');
      } else {
        embedDiv.style.cursor = 'grab';
        embedDiv.onclick = () => openModal(slideItem.url);
      }
      
      let iframe;
      if (slideItem.src.includes('youtube.com') || slideItem.src.includes('youtu.be')) {
        // YouTube embed
        let videoId = slideItem.src.replace('https://www.youtube.com/watch?v=', '')
                                   .replace('https://youtu.be/', '')
                                   .replace(/&.*/, '');
        iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1`;
        iframe.frameBorder = '0';
        iframe.allowFullscreen = true;
      } else {
        // Generic iframe
        iframe = document.createElement('iframe');
        iframe.src = slideItem.src;
        iframe.frameBorder = '0';
      }
      
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      embedDiv.appendChild(iframe);
      
      if (index === 0) {
        embedDiv.classList.add('active');
      }
      
      previewCarousel.appendChild(embedDiv);
    }
  });
  
  // Start global slideshow autoplay
  globalSlideshowIndex = 0;
  startGlobalSlideshowAutoplay();
}

function startGlobalSlideshowAutoplay() {
  const previewCarousel = document.getElementById('preview-carousel');
  const content = previewCarousel.querySelectorAll('img, .preview-embed');
  
  if (content.length <= 1) return;
  
  // Clear any existing interval
  if (globalSlideshowInterval) {
    clearInterval(globalSlideshowInterval);
  }
  
  globalSlideshowInterval = setInterval(() => {
    if (content[globalSlideshowIndex]) {
      content[globalSlideshowIndex].classList.remove('active');
    }
    
    globalSlideshowIndex = (globalSlideshowIndex + 1) % content.length;
    
    if (content[globalSlideshowIndex]) {
      content[globalSlideshowIndex].classList.add('active');
    }
  }, 5000);
}

function pauseGlobalSlideshow() {
  if (globalSlideshowInterval) {
    clearInterval(globalSlideshowInterval);
    globalSlideshowInterval = null;
  }
}

function resumeGlobalSlideshow() {
  if (globalSlideshowItems.length > 1) {
    startGlobalSlideshowAutoplay();
  }
}

function showGlobalSlideshowImage(imageSrc) {
  const previewCarousel = document.getElementById('preview-carousel');
  const content = previewCarousel.querySelectorAll('img, .preview-embed');
  
  // First try to find matching slideshow image
  let foundMatch = false;
  content.forEach((element, index) => {
    if (element.tagName === 'IMG') {
      // Extract pathname for comparison (same as before)
      const targetPath = new URL(imageSrc, window.location.origin).pathname;
      const imgPath = new URL(element.src).pathname;
      
      if (imgPath === targetPath) {
        element.classList.add('active');
        globalSlideshowIndex = index; // Update index for resume
        foundMatch = true;
      } else {
        element.classList.remove('active');
      }
    } else {
      element.classList.remove('active');
    }
  });
  
  // If no match found, create temporary image for this hover
  if (!foundMatch) {
    // Hide all existing content
    content.forEach(element => {
      element.classList.remove('active');
    });
    
    // Create temporary image
    let existingTempImage = previewCarousel.querySelector('.temp-image');
    if (existingTempImage) {
      existingTempImage.remove();
    }
    
    const tempImg = document.createElement('img');
    tempImg.className = 'temp-image active';
    tempImg.src = imageSrc;
    tempImg.style.cursor = 'grab';
    
    previewCarousel.appendChild(tempImg);
  }
}

function showLinkEmbed(linkUrl, title, itemUrl, isExternal = false) {
  const previewCarousel = document.getElementById('preview-carousel');
  
  // Hide all existing content
  const content = previewCarousel.querySelectorAll('img, .preview-embed');
  content.forEach(element => {
    element.classList.remove('active');
  });
  
  // Create temporary embed for this hover
  let existingTempEmbed = previewCarousel.querySelector('.temp-embed');
  if (existingTempEmbed) {
    existingTempEmbed.remove();
  }
  
  const embedDiv = document.createElement('div');
  embedDiv.className = 'preview-embed temp-embed active';
  
  // Handle external vs internal links
  if (isExternal) {
    embedDiv.style.cursor = 'grab';
    embedDiv.onclick = () => window.open(linkUrl, '_blank');
  } else {
    embedDiv.style.cursor = 'grab';
    embedDiv.onclick = () => openModal(itemUrl);
  }
  
  let iframe;
  if (linkUrl.includes('youtube.com') || linkUrl.includes('youtu.be')) {
    // YouTube embed
    let videoId = linkUrl.replace('https://www.youtube.com/watch?v=', '')
                         .replace('https://youtu.be/', '')
                         .replace(/&.*/, '');
    iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1`;
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
  } else {
    // Generic iframe
    iframe = document.createElement('iframe');
    iframe.src = linkUrl;
    iframe.frameBorder = '0';
  }
  
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  embedDiv.appendChild(iframe);
  
  previewCarousel.appendChild(embedDiv);
}

function renderAboutContent() {
  const listItemsContainer = document.getElementById('list-items');
  if (!listItemsContainer) return;
  
  // Fetch the about page content and render it
  const baseUrl = window.location.origin + (window.location.pathname.includes('/personal-site') ? '/personal-site' : '');
  fetch(`${baseUrl}/about-me/`)
    .then(response => response.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const itemDetail = doc.querySelector('.item-detail');
      
      if (itemDetail) {
        listItemsContainer.innerHTML = `<div class="about-content">${itemDetail.outerHTML}</div>`;
      } else {
        listItemsContainer.innerHTML = '<div class="about-content"><p>About content could not be loaded.</p></div>';
      }
    })
    .catch(error => {
      console.error('Error loading about content:', error);
      listItemsContainer.innerHTML = '<div class="about-content"><p>Error loading about content.</p></div>';
    });
}

function renderListItems(items) {
  const listItemsContainer = document.getElementById('list-items');
  if (!listItemsContainer) return;
  
  listItemsContainer.innerHTML = '';
  
  items.forEach(item => {
    const listItem = document.createElement('div');
    listItem.className = `list-item item-description-tooltip${item.linkExternal ? ' external-link' : ''}`;
    listItem.setAttribute('data-description', item.description);
    listItem.setAttribute('data-cover-image', item.coverImage);
    
    // Handle external vs internal links
    if (item.linkExternal && item.link) {
      listItem.onclick = () => window.open(item.link, '_blank');
      listItem.style.cursor = 'grab';
    } else {
      listItem.onclick = () => openModal(item.url);
      listItem.style.cursor = 'grab';
    }
    
    const title = document.createElement('div');
    title.className = 'list-item-title';
    title.textContent = item.title;
    
    const tags = document.createElement('div');
    tags.className = 'list-item-tags';
    
    item.tags.forEach(tag => {
      const tagPill = document.createElement('span');
      tagPill.className = 'tag-pill';
      tagPill.setAttribute('data-tag', tag);
      tagPill.textContent = tag;
      tags.appendChild(tagPill);
    });
    
    listItem.appendChild(title);
    listItem.appendChild(tags);
    
    // Add hover listeners for global slideshow interaction
    listItem.addEventListener('mouseenter', () => {
      // Pause global slideshow on hover
      pauseGlobalSlideshow();
      
      // Show related content based on what's available
      if (item.showInSlideshow && item.slideshowImages && item.slideshowImages.length > 0) {
        // Item has slideshow images - show first one
        showGlobalSlideshowImage(item.slideshowImages[0]);
      } else if (item.coverImage) {
        // Item has cover image - show it
        showGlobalSlideshowImage(item.coverImage);
      } else if (item.link) {
        // Item has link but no images - show link embed
        showLinkEmbed(item.link, item.title, item.url, item.linkExternal);
      }
    });
    
    listItem.addEventListener('mouseleave', () => {
      // Resume global slideshow
      resumeGlobalSlideshow();
    });
    
    listItemsContainer.appendChild(listItem);
  });
  
  // Re-initialize tooltips for new list items
  initTooltipsForListItems();
}


function initTooltipsForListItems() {
  const tooltip = document.querySelector('.tooltip-content');
  const listItems = document.querySelectorAll('.list-item[data-description]');
  
  listItems.forEach(trigger => {
    const description = trigger.getAttribute('data-description');
    if (!description) return;
    
    trigger.addEventListener('mouseenter', (e) => {
      if (tooltip) {
        tooltip.textContent = description;
        tooltip.style.opacity = '1';
      }
    });
    
    trigger.addEventListener('mousemove', (e) => {
      if (tooltip) {
        tooltip.style.left = (e.clientX + 10) + 'px';
        tooltip.style.top = (e.clientY + 10) + 'px';
      }
    });
    
    trigger.addEventListener('mouseleave', () => {
      if (tooltip) {
        tooltip.style.opacity = '0';
      }
    });
  });
}

// Modal functionality
function initModal() {
  const modal = document.getElementById('item-modal');
  const modalClose = document.getElementById('modal-close');
  const modalBody = document.getElementById('modal-body');
  
  // Close modal when clicking X
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }
  
  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
  
  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

function openModal(itemUrl) {
  const modal = document.getElementById('item-modal');
  const modalBody = document.getElementById('modal-body');
  
  if (!modal || !modalBody) return;
  
  // Show loading state
  modalBody.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 50vh; font-size: 1rem;">Loading...</div>';
  
  // Show modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Fetch the item page content
  fetch(itemUrl)
    .then(response => response.text())
    .then(html => {
      // Parse the HTML and extract the content
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const itemDetail = doc.querySelector('.item-detail');
      
      if (itemDetail) {
        modalBody.innerHTML = itemDetail.outerHTML;
        
        // Re-initialize carousels in modal
        initCarouselsInModal();
      } else {
        modalBody.innerHTML = '<div style="padding: 2rem; text-align: center;">Content could not be loaded.</div>';
      }
    })
    .catch(error => {
      console.error('Error loading modal content:', error);
      modalBody.innerHTML = '<div style="padding: 2rem; text-align: center;">Error loading content.</div>';
    });
}

function closeModal() {
  const modal = document.getElementById('item-modal');
  if (!modal) return;
  
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function initGalleryView() {
  // Simple fade-out animation on navigation, then let browser handle it normally
  const mainNavItems = document.querySelectorAll('.main-nav .nav-item');
  console.log('🎯 initGalleryView: Adding simple fade-out to', mainNavItems.length, 'nav items');
  
  mainNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      // Only handle gallery view
      if (!document.body.classList.contains('gallery-view')) {
        return;
      }
      
      const currentPath = window.location.pathname;
      const targetPath = new URL(item.href).pathname;
      
      // Skip if already on target page
      if (currentPath === targetPath) {
        e.preventDefault();
        return;
      }
      
      console.log('🌅 Starting fade-out for navigation to:', item.href);
      
      const itemsGrid = document.querySelector('.items-grid');
      if (itemsGrid) {
        // Smooth fade out, then let browser navigate
        itemsGrid.style.transition = 'opacity 0.25s ease';
        itemsGrid.style.opacity = '0';
      }
      
      // Don't prevent default - let browser navigate normally
    });
  });
}


function initCarouselsInModal() {
  const modalBody = document.getElementById('modal-body');
  const carousels = modalBody.querySelectorAll('[data-carousel]');
  
  carousels.forEach(carousel => {
    const container = carousel.parentElement;
    const dots = container.querySelectorAll('.carousel-dot');
    const prevBtn = container.querySelector('.carousel-prev');
    const nextBtn = container.querySelector('.carousel-next');
    const images = carousel.querySelectorAll('img, video');
    let currentSlide = 0;
    
    if (images.length <= 1) return; // Skip if only one image
    
    function goToSlide(slideIndex) {
      // Update active dot
      if (dots.length > 0) {
        dots[currentSlide].classList.remove('active');
        dots[slideIndex].classList.add('active');
      }
      
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
  });
}


