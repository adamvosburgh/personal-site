Personal site currently served at https://adamvosburgh.com. Collection of projects and other things that serve as a kind of web CV.

**How this site works:f**
- Initialized with Git LFS to handle large files I may add down the road.
- Eleventy reads the markdown files located in src/ 
- The 'Layout' frontmatter dictates which template a file will be processed through
- Nunjucks renders the content into HTML pages and outputs static content in _site/
- Deployed with Github Actions and hosted in Github Pages

If you would like to use this website, either - feel free to fork it! Just not the work :)

**About the design: **

This is the third iteration of my personal website. The goal of this iteration was to make something where editing or adding an item did not feel like a massive task—I often feel in portfolio sites so much is crafted around what you see first. The site has two views: list and gallery, the former designed for desktop, the latter mobile.

I also increasingly really do not enjoy sharing things on social media. The inclusion of the "updates" feed will hopefully allow me to put small things, which may only have one image or one link associated with them (maybe even just text?) in a place that I own, both for my archive and for interest people.

To help the site not become cluttered by additional content: I added a "Main" feed, that pulls from posts in other feeds (projects, teaching, updates). The thinking is that I won't feel deterred to add small updates to the site, given that I can always control what shows first seperately.

Also added in a size variable on all posts frontmatter. This only appears on gallery view, but kind of denotes relative importance of a project. That view employs a masonry gird that fits in the different sizes of content, okay-ish. It's something that could be improved upon.