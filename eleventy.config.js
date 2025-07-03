import eleventyNavigationPlugin from "@11ty/eleventy-navigation";

export default async function (eleventyConfig) {
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  
  // public files
  eleventyConfig.addPassthroughCopy("public/css");
  eleventyConfig.addPassthroughCopy("public/images");

};

export const config = {
  // Control which files Eleventy will process
  // e.g.: *.md, *.njk, *.html, *.liquid
  templateFormats: [
    "md",
    "njk",
    "html",
    "liquid",
    "11ty.js",
  ],

  // Pre-process *.md files with: (default: `liquid`)
  markdownTemplateEngine: "njk",

  // Pre-process *.html files with: (default: `liquid`)
  htmlTemplateEngine: "njk",

  // These are all optional:
  dir: {
    input: "./content",
    includes: "../_includes",
    output: "_site"
  },

};