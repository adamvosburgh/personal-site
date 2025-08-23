const Image = require("@11ty/eleventy-img");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const markdownIt = require("markdown-it");
const markdownItAttrs = require("markdown-it-attrs");

module.exports = function(eleventyConfig) {
  // Set path prefix only for production (GitHub Pages)
  const isProduction = process.env.NODE_ENV === 'production';
  const pathPrefix = isProduction ? '/personal-site/' : '';
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
      .filter(item => item.data.tags && item.data.tags.includes('main'))
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

  // Image shortcode with fallback to placeholder
  eleventyConfig.addShortcode("safeImage", function(src, alt) {
    const fs = require('fs');
    const path = require('path');
    
    if(alt === undefined) alt = "Image";
    
    try {
      if (fs.existsSync(path.resolve(src))) {
        const webPath = src.replace('./src/', '/').replace('src/', '/');
        const finalPath = pathPrefix + webPath;
        return `<img src="${finalPath}" alt="${alt}" class="carousel-image" loading="lazy">`;
      } else {
        return `<div class="image-placeholder">
          <span>Missing: ${path.basename(src)}</span>
        </div>`;
      }
    } catch (error) {
      return `<div class="image-placeholder">
        <span>Error loading image</span>
      </div>`;
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