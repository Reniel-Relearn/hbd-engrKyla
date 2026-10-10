# Kyla's Birthday Surprise

This is a database-free, single-page birthday experience built from editable photos and plain-text letters.

The website is published automatically with GitHub Pages whenever the `main` branch is updated.

## Change a letter

1. Open the matching file in `letters/`.
2. Edit the wording and save it.
3. Commit and push the change to `main`.

The filename must continue matching the associated entry in `site/content.js`.

## Change headings, captions, or photo order

Edit `site/content.js`. Each memory entry contains its caption, image path, letter path, and Polaroid rotation.

## Change the visual design

Edit `site/styles.css`. The primary colors are listed as variables at the top of the file.

## Build locally

```powershell
npm run build
```

The finished static website will be placed in `dist/`.

`dist/` is generated and intentionally excluded from Git. GitHub Actions builds it automatically before every deployment.
