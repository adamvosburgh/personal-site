**Overview**

Personal site currently served at https://adamvosburgh.com. Collection of projects and other things that serve as a kind of web CV.

**This site is built with:**
- Eleventy (to generate the static site from md files)
- Nunjucks (templating engine)
- Git LFS (to handle large files)
- Github Actions + Pages (to build deploy and hoste site)

**How this site works:**
- Initialized with Git LFS to handle large files I may add down the road.
- Eleventy reads the markdown files located in src/ 
- Markdown files are processed through Nunjucks templates
- Nunjucks renders the content into HTML pages and outputs static content in _site/
- Deployed with Github Actions and hosted in Github Pages

**About the design:**

This is the third iteration of my personal website. The goal of this iteration was to make something where editing or adding an item did not feel like a massive task—I often feel in portfolio sites so much is crafted around what you see first. The site has two views: list and gallery, the former designed for desktop, the latter mobile.

I also increasingly really do not enjoy sharing things on social media. The inclusion of the "updates" feed will hopefully allow me to put small things, which may only have one image or one link associated with them (maybe even just text?) in a place that I own, both for my archive and for interest people.

To help the site not become cluttered by additional content: I added a "Main" feed, that pulls from posts in other feeds (projects, teaching, updates). The thinking is that I won't feel deterred to add small updates to the site, given that I can always control what shows first seperately.

Also added in a size variable on all posts frontmatter. This only appears on gallery view, but kind of denotes relative importance of a project. That view employs a masonry gird that fits in the different sizes of content, okay-ish. It's something that could be improved upon.

**To do**
- I do not have any interactive work hosted here yet - will need to test how well an iframe works for this, and decide if I need to always link out, or build some seperate functionality for interactive portions of the site.
- Add in a 'give me your email if you would like to be notified when this site updates' functionality. Would be good if I cut out social media entirely. I would need some way to manually mark which updates would required blasting the email list though.

This was built in collaboration with a few LLMs, mainly Sonnet 4 via Claude Code. If you would like to use this website, feel free to fork it! Just not the work :)