document.addEventListener('DOMContentLoaded', function() {
  initCarousels();
  initTooltips();
  initViewToggle();
  initListView();
  initModal();
  initGalleryView();
  
  const itemsGrid = document.querySelector('.items-grid');
  if (itemsGrid && document.body.classList.contains('gallery-view')) {
    
    itemsGrid.style.opacity = '0';
    itemsGrid.style.transition = 'none';
    
    setTimeout(() => {
      itemsGrid.style.transition = 'opacity 0.4s ease';
      itemsGrid.style.opacity = '1';
    }, 100);
  }
  
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
    
    if (images.length <= 1) return;
    
    function goToSlide(slideIndex) {
      dots[currentSlide].classList.remove('active');
      dots[slideIndex].classList.add('active');
      
      carousel.style.transform = `translateX(-${slideIndex * 100}%)`;
      
      currentSlide = slideIndex;
    }
    
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        goToSlide(index);
      });
    });
    
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

function initTooltips() {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip-content';
  document.body.appendChild(tooltip);
  
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


function initViewToggle() {
  const body = document.body;
  const galleryBtn = document.getElementById('gallery-btn');
  const listBtn = document.getElementById('list-btn');
  
  const savedView = localStorage.getItem('preferredView');
  const isMobile = window.innerWidth < 768;
  
  let defaultView = isMobile ? 'gallery' : 'list';
  let activeView = savedView || defaultView;
  
  body.classList.add('view-set', activeView + '-view');
  if (activeView === 'gallery' && galleryBtn) {
    galleryBtn.classList.add('active');
  } else if (activeView === 'list' && listBtn) {
    listBtn.classList.add('active');
  }
  
  if (activeView === 'list') {
    setTimeout(() => {
      populateListView();
    }, 50);
  }
  
  if (galleryBtn) {
    galleryBtn.addEventListener('click', () => {
      body.classList.remove('list-view');
      body.classList.add('gallery-view', 'view-set');
      galleryBtn.classList.add('active');
      if (listBtn) listBtn.classList.remove('active');
      localStorage.setItem('preferredView', 'gallery');
      
      const itemsGrid = document.querySelector('.items-grid');
      if (itemsGrid) {
            itemsGrid.style.opacity = '0';
        itemsGrid.style.transition = 'none';
        
        setTimeout(() => {
          itemsGrid.style.transition = 'opacity 0.4s ease';
          itemsGrid.style.opacity = '1';
        }, 100);
      }
      
      if (isShowingAboutInList) {
        const basePath = window.location.origin + (window.location.pathname.includes('/personal-site') ? '/personal-site' : '');
        window.location.href = `${basePath}/about-me/`;
        return;
      }
      
      setTimeout(() => {
        const mainNavItems = document.querySelectorAll('.main-nav .nav-item');
        const currentPath = window.location.pathname;
        
        mainNavItems.forEach(item => {
          const itemPath = new URL(item.href).pathname;
          if (itemPath === currentPath) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }, 50);
    });
  }
  
  if (listBtn) {
    listBtn.addEventListener('click', () => {
      body.classList.remove('gallery-view');
      body.classList.add('list-view', 'view-set');
      listBtn.classList.add('active');
      if (galleryBtn) galleryBtn.classList.remove('active');
      populateListView();
      localStorage.setItem('preferredView', 'list');
    });
  }
}

let currentFilter = 'main';
let isShowingAboutInList = false;
let allItems = [];
let globalSlideshowInterval;
let globalSlideshowIndex = 0;
let globalSlideshowItems = [];

function initListView() {
  collectItemsFromGallery();
  
  initGlobalSlideshow();
  
  const listNavItems = document.querySelectorAll('.list-nav .nav-item');
  listNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = item.getAttribute('data-filter');
      
      const newUrl = item.href;
      history.pushState({filter: filter}, '', newUrl);
      
      setActiveFilter(filter);
      filterListItems(filter);
    });
  });
}

function collectItemsFromGallery() {
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
    
    let coverImage = '';
    const img = card.querySelector('.carousel-image, .image-carousel img');
    if (img) {
      coverImage = img.src;
    }
    
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
  
  isShowingAboutInList = false;
  
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
  
  listItemsContainer.classList.add('fade-out');
  
  setTimeout(() => {
    if (filter === 'about') {
      isShowingAboutInList = true;
      renderAboutContent();
    } else {
      isShowingAboutInList = false;
      let filteredItems = [];
      
      if (filter === 'main') {
        filteredItems = allItems.filter(item => 
          item.tags && item.tags.includes('main')
        );
      } else {
        filteredItems = allItems.filter(item => 
          item.tags && item.tags.includes(filter)
        );
      }
      
      renderListItems(filteredItems);
    }
    
    listItemsContainer.classList.remove('fade-out');
    listItemsContainer.classList.add('fade-in');
    
    setTimeout(() => {
      listItemsContainer.classList.remove('fade-in');
    }, 600);
  }, 150);
}

function initGlobalSlideshow() {
  globalSlideshowItems = [];
  
  allItems.forEach((item, index) => {
    if (item.showInSlideshow) {
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
  
  previewCarousel.innerHTML = '';
  
  globalSlideshowItems.forEach((slideItem, index) => {
    if (slideItem.type === 'image') {
      const img = document.createElement('img');
      img.src = slideItem.src;
      img.dataset.linkedItem = slideItem.linkedItem.title;
      
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
      const embedDiv = document.createElement('div');
      embedDiv.className = 'preview-embed';
      embedDiv.dataset.linkedItem = slideItem.linkedItem.title;
      
      if (slideItem.linkedItem.linkExternal && slideItem.linkedItem.link) {
        embedDiv.style.cursor = 'grab';
        embedDiv.onclick = () => window.open(slideItem.linkedItem.link, '_blank');
      } else {
        embedDiv.style.cursor = 'grab';
        embedDiv.onclick = () => openModal(slideItem.url);
      }
      
      let iframe;
      if (slideItem.src.includes('youtube.com') || slideItem.src.includes('youtu.be')) {
        let videoId = slideItem.src.replace('https://www.youtube.com/watch?v=', '')
                                   .replace('https://youtu.be/', '')
                                   .replace(/&.*/, '');
        iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1`;
        iframe.frameBorder = '0';
        iframe.allowFullscreen = true;
      } else {
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
  
  globalSlideshowIndex = 0;
  startGlobalSlideshowAutoplay();
}

function startGlobalSlideshowAutoplay() {
  const previewCarousel = document.getElementById('preview-carousel');
  const content = previewCarousel.querySelectorAll('img, video, .preview-embed');
  
  if (content.length <= 1) return;
  
  if (globalSlideshowInterval) {
    clearInterval(globalSlideshowInterval);
  }
  
  globalSlideshowInterval = setInterval(() => {
    if (content[globalSlideshowIndex]) {
      content[globalSlideshowIndex].classList.remove('active');
      if (content[globalSlideshowIndex].tagName === 'VIDEO') {
        content[globalSlideshowIndex].pause();
      }
    }
    
    globalSlideshowIndex = (globalSlideshowIndex + 1) % content.length;
    
    if (content[globalSlideshowIndex]) {
      content[globalSlideshowIndex].classList.add('active');
      if (content[globalSlideshowIndex].tagName === 'VIDEO') {
        content[globalSlideshowIndex].play();
      }
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

function showGlobalSlideshowImage(mediaSrc) {
  const previewCarousel = document.getElementById('preview-carousel');
  const content = previewCarousel.querySelectorAll('img, video, .preview-embed');
  
  let foundMatch = false;
  content.forEach((element, index) => {
    if (element.tagName === 'IMG') {
      const targetPath = new URL(mediaSrc, window.location.origin).pathname;
      const imgPath = new URL(element.src).pathname;
      
      if (imgPath === targetPath) {
        element.classList.add('active');
        globalSlideshowIndex = index;
        foundMatch = true;
      } else {
        element.classList.remove('active');
      }
    } else if (element.tagName === 'VIDEO') {
      const targetPath = new URL(mediaSrc, window.location.origin).pathname;
      const videoSource = element.querySelector('source');
      const videoPath = videoSource ? new URL(videoSource.src).pathname : '';
      
      if (videoPath === targetPath) {
        element.classList.add('active');
        element.play();
        globalSlideshowIndex = index;
        foundMatch = true;
      } else {
        element.classList.remove('active');
        element.pause();
      }
    } else {
      element.classList.remove('active');
    }
  });
  
  if (!foundMatch) {
    content.forEach(element => {
      element.classList.remove('active');
      if (element.tagName === 'VIDEO') {
        element.pause();
      }
    });
    
    let existingTempMedia = previewCarousel.querySelector('.temp-image, .temp-video');
    if (existingTempMedia) {
      existingTempMedia.remove();
    }
    
    const isVideo = /\.(mp4|webm|mov)$/i.test(mediaSrc);
    
    if (isVideo) {
      const tempVideo = document.createElement('video');
      tempVideo.className = 'temp-video active';
      tempVideo.autoplay = true;
      tempVideo.muted = true;
      tempVideo.loop = true;
      tempVideo.playsInline = true;
      tempVideo.style.cursor = 'grab';
      
      const source = document.createElement('source');
      source.src = mediaSrc;
      source.type = `video/${mediaSrc.split('.').pop()}`;
      tempVideo.appendChild(source);
      
      previewCarousel.appendChild(tempVideo);
    } else {
      const tempImg = document.createElement('img');
      tempImg.className = 'temp-image active';
      tempImg.src = mediaSrc;
      tempImg.style.cursor = 'grab';
      
      previewCarousel.appendChild(tempImg);
    }
  }
}

function showLinkEmbed(linkUrl, title, itemUrl, isExternal = false) {
  const previewCarousel = document.getElementById('preview-carousel');
  
  const content = previewCarousel.querySelectorAll('img, .preview-embed');
  content.forEach(element => {
    element.classList.remove('active');
  });
  
  let existingTempEmbed = previewCarousel.querySelector('.temp-embed');
  if (existingTempEmbed) {
    existingTempEmbed.remove();
  }
  
  const embedDiv = document.createElement('div');
  embedDiv.className = 'preview-embed temp-embed active';
  
  if (isExternal) {
    embedDiv.style.cursor = 'grab';
    embedDiv.onclick = () => window.open(linkUrl, '_blank');
  } else {
    embedDiv.style.cursor = 'grab';
    embedDiv.onclick = () => openModal(itemUrl);
  }
  
  let iframe;
  if (linkUrl.includes('youtube.com') || linkUrl.includes('youtu.be')) {
    let videoId = linkUrl.replace('https://www.youtube.com/watch?v=', '')
                         .replace('https://youtu.be/', '')
                         .replace(/&.*/, '');
    iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1`;
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
  } else {
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
    
    listItem.addEventListener('mouseenter', () => {
      pauseGlobalSlideshow();
      
      if (item.showInSlideshow && item.slideshowImages && item.slideshowImages.length > 0) {
        showGlobalSlideshowImage(item.slideshowImages[0]);
      } else if (item.coverImage) {
        showGlobalSlideshowImage(item.coverImage);
      } else if (item.link) {
        showLinkEmbed(item.link, item.title, item.url, item.linkExternal);
      }
    });
    
    listItem.addEventListener('mouseleave', () => {
      resumeGlobalSlideshow();
    });
    
    listItemsContainer.appendChild(listItem);
  });
  
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

function initModal() {
  const modal = document.getElementById('item-modal');
  const modalClose = document.getElementById('modal-close');
  const modalBody = document.getElementById('modal-body');
  
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }
  
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
  
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
  
  modalBody.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 50vh; font-size: 1rem;">Loading...</div>';
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  fetch(itemUrl)
    .then(response => response.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const itemDetail = doc.querySelector('.item-detail');
      
      if (itemDetail) {
        modalBody.innerHTML = itemDetail.outerHTML;
        
        initCarouselsInModal();
      } else {
        modalBody.innerHTML = '<div style="padding: 2rem; text-align: center;">Content could not be loaded.</div>';
      }
    })
    .catch(error => {
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
  const mainNavItems = document.querySelectorAll('.main-nav .nav-item');
  
  mainNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      if (!document.body.classList.contains('gallery-view')) {
        return;
      }
      
      const currentPath = window.location.pathname;
      const targetPath = new URL(item.href).pathname;
      
      if (currentPath === targetPath) {
        e.preventDefault();
        return;
      }
      
      
      const itemsGrid = document.querySelector('.items-grid');
      if (itemsGrid) {
        itemsGrid.style.transition = 'opacity 0.25s ease';
        itemsGrid.style.opacity = '0';
      }
      
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
    
    if (images.length <= 1) return;
    
    function goToSlide(slideIndex) {
      if (dots.length > 0) {
        dots[currentSlide].classList.remove('active');
        dots[slideIndex].classList.add('active');
      }
      
      carousel.style.transform = `translateX(-${slideIndex * 100}%)`;
      
      currentSlide = slideIndex;
    }
    
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        goToSlide(index);
      });
    });
    
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


