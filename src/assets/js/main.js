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
      scrollToListSection(e.state.filter);
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

let currentFilter = 'selected';
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
      setActiveFilter(filter);
      scrollToListSection(filter);
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
    currentFilter = 'selected';
  }

  setActiveFilter(currentFilter);
  renderAllSections(null);
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

function renderAllSections(scrollToFilter) {
  const listItemsContainer = document.getElementById('list-items');
  if (!listItemsContainer) return;

  listItemsContainer.innerHTML = '';

  const appendSection = (label, filter) => {
    const items = allItems.filter(item => item.tags && item.tags.includes(filter));
    if (items.length === 0) return;
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'list-section-header';
    sectionHeader.id = `list-section-${filter}`;
    sectionHeader.textContent = label;
    listItemsContainer.appendChild(sectionHeader);
    items.forEach(item => listItemsContainer.appendChild(createListItemEl(item)));
  };

  const appendAboutSection = () => {
    const aboutHeader = document.createElement('div');
    aboutHeader.className = 'list-section-header';
    aboutHeader.id = 'list-section-about';
    aboutHeader.textContent = 'About';
    listItemsContainer.appendChild(aboutHeader);

    const aboutContainer = document.createElement('div');
    listItemsContainer.appendChild(aboutContainer);

    const baseUrl = window.location.origin + (window.location.pathname.includes('/personal-site') ? '/personal-site' : '');
    fetch(`${baseUrl}/about-me/`)
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const itemDetail = doc.querySelector('.item-detail');
        if (itemDetail) {
          aboutContainer.innerHTML = `<div class="about-content">${itemDetail.outerHTML}</div>`;
        }
      })
      .catch(() => {});
  };

  appendSection('Selected', 'selected');
  appendAboutSection();
  appendSection('Projects', 'projects');
  appendSection('Updates', 'updates');
  appendSection('Teaching', 'teaching');

  if (scrollToFilter) {
    setTimeout(() => scrollToListSection(scrollToFilter), 50);
  }
}

function scrollToListSection(filter) {
  const sectionEl = document.getElementById(`list-section-${filter}`);
  const listSidebar = document.querySelector('.list-sidebar');
  if (!sectionEl || !listSidebar) return;

  const sidebarRect = listSidebar.getBoundingClientRect();
  const sectionRect = sectionEl.getBoundingClientRect();
  const scrollOffset = listSidebar.scrollTop + (sectionRect.top - sidebarRect.top) - 16;

  listSidebar.scrollTo({ top: scrollOffset, behavior: 'smooth' });
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

  const titleLine = document.createElement('div');
  titleLine.className = 'list-item-title';
  titleLine.textContent = item.title;
  listItem.appendChild(titleLine);

  const descRow = document.createElement('div');
  descRow.className = 'list-item-desc-row';

  if (item.description) {
    const desc = document.createElement('span');
    desc.className = 'list-item-description';
    desc.textContent = item.description;
    descRow.appendChild(desc);
  }

  const displayTags = (item.tags || []).filter(t => t !== 'selected');
  displayTags.forEach(tag => {
    const pill = document.createElement('span');
    pill.className = 'list-item-tag-pill';
    pill.setAttribute('data-tag', tag);
    pill.textContent = tag;
    descRow.appendChild(pill);
  });

  if (descRow.hasChildNodes()) listItem.appendChild(descRow);


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

  return listItem;
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
  buildCombinedGallery();

  const mainNavItems = document.querySelectorAll('.main-nav .nav-item');
  mainNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      if (!document.body.classList.contains('gallery-view')) return;
      e.preventDefault();
      const filter = item.getAttribute('data-filter');
      if (!filter) return;
      mainNavItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      scrollToGallerySection(filter);
    });
  });
}

function buildCombinedGallery() {
  const galleryContent = document.querySelector('.gallery-view-content');
  if (!galleryContent) return;

  galleryContent.innerHTML = '';

  const sections = [
    { label: 'Selected', filter: 'selected' },
    { label: 'Projects', filter: 'projects' },
    { label: 'Updates', filter: 'updates' },
    { label: 'Teaching', filter: 'teaching' },
  ];

  sections.forEach(section => {
    const items = allItems.filter(item => item.tags && item.tags.includes(section.filter));
    if (items.length === 0) return;

    const sectionEl = document.createElement('div');
    sectionEl.className = 'gallery-section';
    sectionEl.id = `gallery-section-${section.filter}`;

    const header = document.createElement('h2');
    header.className = 'gallery-section-header';
    header.textContent = section.label;
    sectionEl.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'items-grid';
    grid.style.opacity = '1';

    items.forEach(item => grid.appendChild(buildGalleryCard(item)));
    sectionEl.appendChild(grid);
    galleryContent.appendChild(sectionEl);
  });
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
  } else if (item.link && !item.linkExternal) {
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

  const hoverTags = document.createElement('div');
  hoverTags.className = 'hover-tags';
  (item.tags || []).forEach(tag => {
    const tagPill = document.createElement('span');
    tagPill.className = 'hover-tag-pill';
    tagPill.textContent = tag;
    hoverTags.appendChild(tagPill);
  });
  hoverContent.appendChild(hoverTags);
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


