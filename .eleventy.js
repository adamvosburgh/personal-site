const Image = require("@11ty/eleventy-img");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const markdownIt = require("markdown-it");
const markdownItAttrs = require("markdown-it-attrs");

module.exports = function(eleventyConfig) {
  // No path prefix needed for custom domain
  const pathPrefix = '';
  // Plugins
  eleventyConfig.addPlugin(syntaxHighlight);
  
  // Markdown configuration
  const markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItAttrs);
  eleventyConfig.setLibrary("md", markdownLibrary);

  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/favicon");
  
  // Watch targets
  eleventyConfig.addWatchTarget("./src/assets/");
  
  // Collections for different content types
  const contentGlob = ["./src/teaching/*.md", "./src/projects/*.md", "./src/updates/*.md", "./src/about/*.md"];
  
  eleventyConfig.addCollection("allItems", function(collectionApi) {
    return collectionApi.getFilteredByGlob(contentGlob).sort((a, b) => {
      return new Date(b.data.date) - new Date(a.data.date); // Most recent first
    });
  });
  
  eleventyConfig.addCollection("mainItems", function(collectionApi) {
    return collectionApi.getFilteredByGlob(contentGlob)
      .filter(item => item.data.tags && item.data.tags.includes('selected'))
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date)); // Most recent first
  });
  
  eleventyConfig.addCollection("teachingItems", function(collectionApi) {
    return collectionApi.getFilteredByGlob("./src/teaching/*.md")
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date)); // Most recent first
  });
  
  eleventyConfig.addCollection("projectItems", function(collectionApi) {
    return collectionApi.getFilteredByGlob("./src/projects/*.md")
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date)); // Most recent first
  });
  
  eleventyConfig.addCollection("aboutItems", function(collectionApi) {
    return collectionApi.getFilteredByGlob("./src/about/*.md")
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date)); // Most recent first
  });
  
  eleventyConfig.addCollection("updateItems", function(collectionApi) {
    return collectionApi.getFilteredByGlob("./src/updates/*.md")
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date)); // Most recent first
  });

  // Convert a /images/... web path to its optimized /images-opt/... WebP path
  function optimizedWebPath(imgWebPath) {
    const path = require('path');
    const ext = path.extname(imgWebPath).toLowerCase();
    if (['.mp4', '.webm', '.mov', '.gif'].includes(ext)) return imgWebPath;
    // "/images/two-sides/interactive/1-biomes.png" -> "two-sides-interactive-1-biomes.webp"
    const relative = imgWebPath.replace(/^\/images\//, '');
    const name = relative.replace(/\//g, '-').replace(/\.[^.]+$/, '');
    return `/images-opt/${name}.webp`;
  }

  eleventyConfig.addFilter("optimizedImageUrl", function(imgWebPath) {
    if (!imgWebPath) return "";
    return optimizedWebPath(imgWebPath);
  });

  // Async shortcode — generates optimized WebP + fallback <picture> for images, passes videos through
  eleventyConfig.addAsyncShortcode("safeImage", async function(src, alt) {
    const fs = require('fs');
    const path = require('path');

    if (alt === undefined) alt = "Image";

    const ext = path.extname(src).toLowerCase();

    // Videos: pass through unchanged
    if (['.mp4', '.webm', '.mov'].includes(ext)) {
      const webPath = pathPrefix + src.replace('./src/', '/').replace('src/', '/');
      return `<video class="carousel-image" autoplay muted loop playsinline>
        <source src="${webPath}" type="video/${ext.substring(1)}">
      </video>`;
    }

    // GIFs: pass through unchanged (eleventy-img loses animation)
    if (ext === '.gif') {
      const webPath = pathPrefix + src.replace('./src/', '/').replace('src/', '/');
      return `<img src="${webPath}" alt="${alt}" class="carousel-image" loading="lazy">`;
    }

    if (!fs.existsSync(path.resolve(src))) {
      return `<div class="image-placeholder"><span>Missing: ${path.basename(src)}</span></div>`;
    }

    try {
      const fallbackFormat = ext === '.png' ? 'png' : 'jpeg';
      const relative = src.replace('./src/images/', '').replace('src/images/', '');
      const name = relative.replace(/\//g, '-').replace(/\.[^.]+$/, '');

      const metadata = await Image(src, {
        widths: [null],
        formats: ['webp', fallbackFormat],
        outputDir: './_site/images-opt/',
        urlPath: '/images-opt/',
        filenameFormat: (_id, _src, _width, format) => `${name}.${format}`
      });

      return Image.generateHTML(metadata, {
        alt,
        class: 'carousel-image',
        loading: 'lazy',
        decoding: 'async'
      });
    } catch (e) {
      const webPath = pathPrefix + src.replace('./src/', '/').replace('src/', '/');
      return `<img src="${webPath}" alt="${alt}" class="carousel-image" loading="lazy">`;
    }
  });

  // Filters
  eleventyConfig.addFilter("limit", function(array, limit) {
    return array.slice(0, limit);
  });

  eleventyConfig.addFilter("dateDisplay", function(dateObj) {
    return new Date(dateObj).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  return {
    pathPrefix: pathPrefix,
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data"
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};