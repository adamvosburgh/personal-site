document.addEventListener('DOMContentLoaded', function() {
  collectItemsFromGallery();
  initCarousels();
  initTooltips();
  initViewToggle();
  initListView();
  initModal();
  initGalleryView();

  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.filter && document.body.classList.contains('list-view')) {
      setActiveFilter(e.state.filter);
      renderFilteredList(e.state.filter);
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
  const appsBtn = document.getElementById('apps-btn');

  const savedView = localStorage.getItem('preferredView');
  const isMobile = window.innerWidth < 768;

  let defaultView = isMobile ? 'gallery' : 'list';
  let activeView = savedView || defaultView;

  // Set initial view
  if (activeView === 'list') {
    body.classList.add('list-view');
    body.classList.remove('gallery-view', 'apps-view');
    if (listBtn) listBtn.classList.add('active');
    if (galleryBtn) galleryBtn.classList.remove('active');
    if (appsBtn) appsBtn.classList.remove('active');
    populateListView();
  } else if (activeView === 'apps') {
    body.classList.add('apps-view');
    body.classList.remove('gallery-view', 'list-view');
    if (appsBtn) appsBtn.classList.add('active');
    if (galleryBtn) galleryBtn.classList.remove('active');
    if (listBtn) listBtn.classList.remove('active');
  } else {
    body.classList.add('gallery-view');
    body.classList.remove('list-view', 'apps-view');
    if (galleryBtn) galleryBtn.classList.add('active');
    if (listBtn) listBtn.classList.remove('active');
    if (appsBtn) appsBtn.classList.remove('active');
  }

  if (galleryBtn) {
    galleryBtn.addEventListener('click', () => {
      body.classList.remove('list-view', 'apps-view');
      body.classList.add('gallery-view', 'view-set');
      galleryBtn.classList.add('active');
      if (listBtn) listBtn.classList.remove('active');
      if (appsBtn) appsBtn.classList.remove('active');
      localStorage.setItem('preferredView', 'gallery');


    });
  }

  if (listBtn) {
    listBtn.addEventListener('click', () => {
      body.classList.remove('gallery-view', 'apps-view');
      body.classList.add('list-view', 'view-set');
      listBtn.classList.add('active');
      if (galleryBtn) galleryBtn.classList.remove('active');
      if (appsBtn) appsBtn.classList.remove('active');
      populateListView();
      localStorage.setItem('preferredView', 'list');
    });
  }

  if (appsBtn) {
    appsBtn.addEventListener('click', () => {
      body.classList.remove('gallery-view', 'list-view');
      body.classList.add('apps-view', 'view-set');
      appsBtn.classList.add('active');
      if (galleryBtn) galleryBtn.classList.remove('active');
      if (listBtn) listBtn.classList.remove('active');
      localStorage.setItem('preferredView', 'apps');
    });
  }
}

let currentFilter = 'all';
let allItems = [];
let globalSlideshowInterval;
let globalSlideshowIndex = 0;
let globalSlideshowItems = [];

function initListView() {
  initGlobalSlideshow();

  const listNavItems = document.querySelectorAll('.list-nav .nav-item');
  listNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = item.getAttribute('data-filter');
      if (filter === 'about') {
        scrollToListAbout();
        return;
      }
      setActiveFilter(filter);
      renderFilteredList(filter);
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

  currentFilter = 'all';
  setActiveFilter('all');
  renderFilteredList('all');
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

function renderFilteredList(filter) {
  const listItemsContainer = document.getElementById('list-items');
  if (!listItemsContainer) return;

  listItemsContainer.innerHTML = '';

  if (filter !== 'about') {
    const nonAbout = allItems.filter(item => !(item.tags && item.tags.includes('about')));
    const pool = filter === 'all' ? nonAbout : nonAbout.filter(item => item.tags && item.tags.includes(filter));
    sortItems(pool).forEach(item => listItemsContainer.appendChild(createListItemEl(item)));
  }

  // About section always at bottom (scroll target when clicking About nav)
  const aboutSection = document.createElement('div');
  aboutSection.className = 'list-about-section';
  aboutSection.id = 'list-section-about';
  const aboutHeader = document.createElement('div');
  aboutHeader.className = 'list-section-header';
  aboutHeader.textContent = 'About';
  aboutSection.appendChild(aboutHeader);
  const aboutBody = document.createElement('div');
  aboutBody.className = 'list-about-body';
  aboutSection.appendChild(aboutBody);
  listItemsContainer.appendChild(aboutSection);

  const baseUrl = window.location.origin + (window.location.pathname.includes('/personal-site') ? '/personal-site' : '');
  fetch(`${baseUrl}/about-me/`)
    .then(r => r.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const itemBody = doc.querySelector('.item-body');
      if (itemBody) aboutBody.innerHTML = itemBody.innerHTML;
    })
    .catch(() => {});
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

function createListItemEl(item) {
  const listItem = document.createElement('div');
  listItem.className = `list-item${item.linkExternal ? ' external-link' : ''}`;
  listItem.setAttribute('data-cover-image', item.coverImage);
  listItem.style.cursor = 'grab';

  if (item.linkExternal && item.link) {
    listItem.onclick = () => window.open(item.link, '_blank');
  } else {
    listItem.onclick = () => openModal(item.url);
  }

  // Meta row: year + tags
  const metaRow = document.createElement('div');
  metaRow.className = 'list-item-meta-row';

  if (item.year) {
    const yearEl = document.createElement('span');
    yearEl.className = 'list-item-year';
    yearEl.textContent = item.year;
    metaRow.appendChild(yearEl);
  }

  (item.tags || []).forEach(tag => {
    const pill = document.createElement('span');
    pill.className = 'list-item-tag-pill';
    pill.setAttribute('data-tag', tag);
    pill.textContent = tag;
    metaRow.appendChild(pill);
  });

  listItem.appendChild(metaRow);

  const titleLine = document.createElement('div');
  titleLine.className = 'list-item-title';
  titleLine.textContent = item.title;
  listItem.appendChild(titleLine);


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
    hidePreviewDescription();
    hideTooltip();
  });

  if (item.description) {
    listItem.addEventListener('mouseenter', () => {
      showPreviewDescription(item.description);
      showTooltip(item.description, listItem);
    });
  }

  return listItem;
}


// --- Option A: description below image in preview panel ---
function showPreviewDescription(text) {
  const el = document.getElementById('preview-description');
  if (!el) return;
  el.textContent = text;
  el.style.opacity = '1';
}

function hidePreviewDescription() {
  const el = document.getElementById('preview-description');
  if (!el) return;
  el.style.opacity = '0';
}

// --- Option B: tooltip near cursor ---
let tooltipEl = null;

function showTooltip(text, triggerEl) {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'list-tooltip';
    document.body.appendChild(tooltipEl);
  }
  tooltipEl.textContent = text;
  tooltipEl.style.opacity = '1';

  const rect = triggerEl.getBoundingClientRect();
  tooltipEl.style.left = (rect.left) + 'px';
  tooltipEl.style.top = (rect.bottom + 8) + 'px';
}

function hideTooltip() {
  if (tooltipEl) tooltipEl.style.opacity = '0';
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

let galleryFilter = 'all';

function sortItems(items) {
  return [...items].sort((a, b) => {
    const aSelected = a.tags && a.tags.includes('selected') ? 1 : 0;
    const bSelected = b.tags && b.tags.includes('selected') ? 1 : 0;
    if (bSelected !== aSelected) return bSelected - aSelected;
    return new Date(b.date) - new Date(a.date);
  });
}

function initGalleryView() {
  buildFilteredGallery('all');

  const mainNavItems = document.querySelectorAll('.main-nav .nav-item');
  mainNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      if (!document.body.classList.contains('gallery-view')) return;
      e.preventDefault();
      const filter = item.getAttribute('data-filter');
      if (!filter) return;
      mainNavItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      if (filter === 'about') {
        scrollToGalleryAbout();
        return;
      }

      galleryFilter = filter;
      buildFilteredGallery(filter);
    });
  });
}

function buildFilteredGallery(filter) {
  const galleryContent = document.querySelector('.gallery-view-content');
  if (!galleryContent) return;

  galleryContent.innerHTML = '';

  const nonAbout = allItems.filter(item => !(item.tags && item.tags.includes('about')));
  const pool = filter === 'all' ? nonAbout : nonAbout.filter(item => item.tags && item.tags.includes(filter));
  const items = sortItems(pool);

  const grid = document.createElement('div');
  grid.className = 'items-grid';
  grid.style.opacity = '1';
  items.forEach(item => grid.appendChild(buildGalleryCard(item)));
  galleryContent.appendChild(grid);

  // About always at bottom
  const aboutSectionEl = document.createElement('div');
  aboutSectionEl.className = 'gallery-section';
  aboutSectionEl.id = 'gallery-section-about';

  const aboutHeader = document.createElement('h2');
  aboutHeader.className = 'gallery-section-header';
  aboutHeader.textContent = 'About';
  aboutSectionEl.appendChild(aboutHeader);

  const aboutBody = document.createElement('div');
  aboutBody.className = 'gallery-about-body';
  aboutSectionEl.appendChild(aboutBody);
  galleryContent.appendChild(aboutSectionEl);

  const baseUrl = window.location.origin + (window.location.pathname.includes('/personal-site') ? '/personal-site' : '');
  fetch(`${baseUrl}/about-me/`)
    .then(r => r.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const itemDetail = doc.querySelector('.item-detail');
      if (itemDetail) aboutBody.innerHTML = itemDetail.outerHTML;
    })
    .catch(() => {});
}

function scrollToGalleryAbout() {
  const sectionEl = document.getElementById('gallery-section-about');
  if (!sectionEl) return;
  const headerHeight = (document.querySelector('.site-header') || {}).offsetHeight || 0;
  const top = sectionEl.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
  window.scrollTo({ top, behavior: 'smooth' });
}

function scrollToListAbout() {
  const sectionEl = document.getElementById('list-section-about');
  if (!sectionEl) return;
  sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildGalleryCard(item) {
  const primaryTag = getPrimaryTag(item.tags);
  const shadowColor = getTagShadowColor(primaryTag);

  const card = document.createElement('article');
  card.className = 'item-card';
  card.setAttribute('data-size', item.size || '2');
  card.setAttribute('data-tags', (item.tags || []).join(','));
  card.style.boxShadow = `0 0 15px 15px ${shadowColor}, 0 0 10px 5px inset ${shadowColor}`;
  card.style.cursor = 'grab';

  if (item.linkExternal && item.link) {
    card.classList.add('external-link');
    card.onclick = () => window.open(item.link, '_blank');
  } else {
    card.onclick = () => openModal(item.url);
  }

  if (item.coverImage) {
    const imagesDiv = document.createElement('div');
    imagesDiv.className = 'item-images';
    const isVideo = /\.(mp4|webm|mov)$/i.test(item.coverImage);
    if (isVideo) {
      const video = document.createElement('video');
      video.className = 'carousel-image';
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      const source = document.createElement('source');
      source.src = item.coverImage;
      source.type = `video/${item.coverImage.split('.').pop().toLowerCase()}`;
      video.appendChild(source);
      imagesDiv.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = item.coverImage;
      img.alt = item.title;
      img.className = 'carousel-image';
      img.loading = 'lazy';
      imagesDiv.appendChild(img);
    }
    card.appendChild(imagesDiv);
  } else if (item.link) {
    const previewDiv = document.createElement('div');
    previewDiv.className = 'item-link-preview';
    const iframe = document.createElement('iframe');
    if (item.link.includes('youtube.com') || item.link.includes('youtu.be')) {
      let videoId = item.link.replace('https://www.youtube.com/watch?v=', '')
                              .replace('https://youtu.be/', '')
                              .replace(/&.*/, '');
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
      iframe.allowFullscreen = true;
    } else {
      iframe.src = item.link;
    }
    iframe.frameBorder = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    previewDiv.appendChild(iframe);
    card.appendChild(previewDiv);
  }

  const overlay = document.createElement('div');
  overlay.className = 'item-hover-overlay';

  const hoverContent = document.createElement('div');
  hoverContent.className = 'hover-content';

  const hoverTitle = document.createElement('h3');
  hoverTitle.className = 'hover-title';
  hoverTitle.textContent = item.title;
  hoverContent.appendChild(hoverTitle);

  if (item.description) {
    const hoverDesc = document.createElement('p');
    hoverDesc.className = 'hover-description';
    hoverDesc.textContent = item.description;
    hoverContent.appendChild(hoverDesc);
  }

  const hoverMeta = document.createElement('div');
  hoverMeta.className = 'hover-tags';

  if (item.year) {
    const yearEl = document.createElement('span');
    yearEl.className = 'hover-tag-pill hover-year';
    yearEl.textContent = item.year;
    hoverMeta.appendChild(yearEl);
  }

  (item.tags || []).forEach(tag => {
    const tagPill = document.createElement('span');
    tagPill.className = 'hover-tag-pill';
    tagPill.textContent = tag;
    hoverMeta.appendChild(tagPill);
  });
  hoverContent.appendChild(hoverMeta);
  overlay.appendChild(hoverContent);
  card.appendChild(overlay);

  return card;
}

function getPrimaryTag(tags) {
  const order = ['projects', 'teaching', 'updates'];
  for (const tag of order) {
    if (tags && tags.includes(tag)) return tag;
  }
  return 'selected';
}

function getTagShadowColor(tag) {
  const colors = {
    projects: 'rgba(0, 0, 255, 0.15)',
    teaching: 'rgba(0, 128, 0, 0.15)',
    updates: 'rgba(255, 140, 0, 0.15)',
    selected: 'rgba(0, 0, 0, 0.15)',
  };
  return colors[tag] || 'rgba(0, 0, 0, 0.15)';
}

function scrollToGallerySection(filter) {
  const sectionEl = document.getElementById(`gallery-section-${filter}`);
  if (!sectionEl) return;
  const headerHeight = (document.querySelector('.site-header') || {}).offsetHeight || 0;
  const top = sectionEl.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
  window.scrollTo({ top, behavior: 'smooth' });
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


