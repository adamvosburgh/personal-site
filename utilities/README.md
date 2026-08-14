# Utilities

Maintenance scripts for this site. Nothing here runs during the build — these are things you run by hand, occasionally.

---

## optimize-media.js

Shrinks the source images and videos in `src/images/` **in place**, so the repo (and Git LFS) stops carrying camera-resolution JPEGs and unencoded screen recordings.

### Why it matters here

Eleventy generates WebP copies into `_site/images-opt/` at the *original* resolution (`widths: [null]` in `.eleventy.js`), and videos and GIFs are passed straight through with no processing at all. So a 60 MB mp4 in `src/images/` is a 60 MB mp4 the browser downloads. Optimizing the sources is what fixes it — everything downstream follows.

### Prerequisites

```bash
brew install imagemagick ffmpeg gifsicle
```

| Tool | Handles | Required? |
| --- | --- | --- |
| ImageMagick (`magick`) | `.jpg` `.jpeg` `.png` | needed for stills |
| ffmpeg | `.mp4` `.mov` `.webm` | needed for video |
| gifsicle | `.gif` | optional — falls back to ImageMagick, which does a worse job |

Missing tools are reported at startup and those file types are skipped; the rest still runs.

### Usage

```bash
# 1. See what would change. This writes nothing.
node utilities/optimize-media.js

# 2. Happy with the report? Write it, keeping originals somewhere safe.
node utilities/optimize-media.js --apply --backup ../site-media-backup

# 3. Check the site still looks right, then commit.
npm run build && npm run serve
```

The dry run genuinely encodes every file to measure the result, so a full pass over `src/images/` takes a few minutes. Use `--only` while you're iterating:

```bash
node utilities/optimize-media.js --only two-sides
node utilities/optimize-media.js --only backfire --apply
```

### What it does to each file type

| Type | Treatment |
| --- | --- |
| JPEG | auto-orient, longest edge capped at 2400 px, metadata stripped, re-encoded at quality 82, progressive |
| PNG | auto-orient, capped at 2400 px, metadata stripped, maximum zlib compression. Stays PNG — transparency and the filename are preserved |
| MP4 / MOV / WebM | H.264, width capped at 1600 px, CRF 26, `+faststart` for streaming, **audio removed** (every video on the site plays muted) |
| GIF | capped at 1200 px wide, lossy-80 via gifsicle |

Three safety rules:

- **Never enlarges.** The resize uses ImageMagick's `>` operator, so anything already under the cap keeps its dimensions and is only re-encoded.
- **Never writes a bigger file.** If the optimized version doesn't beat the original by at least `--min-savings` percent (default 3), the original is kept.
- **Never changes a filename or extension.** Nothing in `src/**/*.md`, the templates, or `main.js` needs updating after a run.

Use `--keep-audio` if you ever add a video that's meant to be heard.

### The manifest

`utilities/.media-optimized.json` records the size of each file after it was optimized. On the next run, any file whose size still matches is skipped, so re-running is cheap and you only pay for newly added media. It's only written on `--apply`.

If a file's size no longer matches (you replaced it with a fresh export), it gets picked up automatically. To re-process everything regardless, pass `--force`.

Commit the manifest — it's small, and it means the skip list is shared rather than per-machine.

### Options

```
--apply                 write the optimized files (default is a dry run)
--force                 re-process files the manifest says are already done
--only <substring>      limit to paths containing this substring
--root <dir>            directory to scan            (default src/images)
--backup <dir>          copy each original here before replacing it
--max-width <px>        longest edge for jpg/png     (default 2400)
--quality <1-100>       jpeg quality                 (default 82)
--video-max-width <px>  width cap for video          (default 1600)
--crf <n>               h.264 quality, lower is better (default 26)
--gif-max-width <px>    width cap for gif            (default 1200)
--keep-audio            keep audio tracks in video   (default: stripped)
--min-savings <pct>     skip rewrites below this gain (default 3)
```

### Recovering an original

Everything under `src/images/` is tracked by Git LFS, so the pre-optimization version is in history:

```bash
git checkout HEAD -- src/images/two-sides/biome-close.jpg
```

`--backup` is belt-and-braces on top of that, and worth using the first time you run with `--apply`.

### GIFs are the remaining problem

`--lossy` compression only goes so far. `backfire-cover.gif` is the clearest case: as an mp4 it would be roughly a tenth of the size. The script flags any GIF still over 2 MB after optimizing but won't convert it for you, because that changes the file extension and the `display.coverImage` path in the markdown would have to change with it. To do one by hand:

```bash
ffmpeg -i src/images/backfire/backfire-cover.gif \
  -vf "scale='min(1600,iw)':-2" -c:v libx264 -crf 26 \
  -pix_fmt yuv420p -movflags +faststart -an \
  src/images/backfire/backfire-cover.mp4
```

Then point `display.coverImage` in `src/projects/backfire.md` at the `.mp4` and delete the GIF. Both the gallery cards and the list-view slideshow autoplay video covers, so nothing else needs to change.
