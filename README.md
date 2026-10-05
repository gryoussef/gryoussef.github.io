# Youssef El Jirari

Youssef El Jirari’s personal engineering blog, built with Hugo.

## Local preview

Use Hugo 0.119.0 (the version pinned in the deployment workflow):

```sh
hugo server --disableFastRender
```

Open http://localhost:1313. Build the production site with `hugo --minify`.

## Editing

- Articles live in `content/posts/`.
- Site settings and social links live in `hugo.yml` and `layouts/index.html`.
- Templates live in `layouts/`; no external theme is required.
- Styles and theme switching live in `static/css/site.css` and `static/js/theme.js`.
- The original optimized profile photo is `static/images/youssef.jpg`. The hero uses `static/images/youssef-cutout.png`, created with the built-in image generation tool using the prompt: remove the outdoor background, preserve the person and clothing, and produce a transparent cutout. The hero uses a clean cutout without fades, masks, borders, or shadows.
- `PRODUCT.md` and `DESIGN.md` capture the design direction.

Pushing to `main` runs the existing GitHub Pages deployment workflow for eljirari.me. Generated production output is also tracked in `public/`.
