#!/usr/bin/env node
/**
 * optimize-media.js — shrink the source images and videos in src/images/ in place.
 *
 * Dry run by default: nothing is written unless you pass --apply.
 * See utilities/README.md for full documentation.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_ROOT = path.join(REPO_ROOT, 'src', 'images');
const MANIFEST_PATH = path.join(__dirname, '.media-optimized.json');

const RASTER_EXT = ['.jpg', '.jpeg', '.png'];
const VIDEO_EXT = ['.mp4', '.mov', '.webm'];
const GIF_EXT = ['.gif'];

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const opts = {
    apply: false,
    force: false,
    only: null,
    backup: null,
    root: DEFAULT_ROOT,
    maxWidth: 2400,
    quality: 82,
    videoMaxWidth: 1600,
    crf: 26,
    gifMaxWidth: 1200,
    keepAudio: false,
    minSavings: 3,
  };

  const numeric = {
    '--max-width': 'maxWidth',
    '--quality': 'quality',
    '--video-max-width': 'videoMaxWidth',
    '--crf': 'crf',
    '--gif-max-width': 'gifMaxWidth',
    '--min-savings': 'minSavings',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--apply') opts.apply = true;
    else if (arg === '--dry-run') opts.apply = false;
    else if (arg === '--force') opts.force = true;
    else if (arg === '--keep-audio') opts.keepAudio = true;
    else if (arg === '--only') opts.only = argv[++i];
    else if (arg === '--backup') opts.backup = path.resolve(REPO_ROOT, argv[++i]);
    else if (arg === '--root') opts.root = path.resolve(REPO_ROOT, argv[++i]);
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else if (numeric[arg]) opts[numeric[arg]] = Number(argv[++i]);
    else {
      console.error(`Unknown option: ${arg}\nRun with --help for usage.`);
      process.exit(1);
    }
  }

  return opts;
}

const USAGE = `
optimize-media.js — shrink source images and videos in place

  node utilities/optimize-media.js               report what would change (default)
  node utilities/optimize-media.js --apply        actually rewrite the files

Options
  --apply                 write the optimized files (default is a dry run)
  --force                 re-process files the manifest says are already done
  --only <substring>      limit to paths containing this substring, e.g. --only two-sides
  --root <dir>            directory to scan            (default src/images)
  --backup <dir>          copy each original here before replacing it
  --max-width <px>        longest edge for jpg/png     (default 2400)
  --quality <1-100>       jpeg quality                 (default 82)
  --video-max-width <px>  width cap for video          (default 1600)
  --crf <n>               h.264 quality, lower is better (default 26)
  --gif-max-width <px>    width cap for gif            (default 1200)
  --keep-audio            keep audio tracks in video   (default: stripped)
  --min-savings <pct>     skip rewrites below this gain (default 3)
  --help                  this message
`;

// -------------------------------------------------------------- environment

function hasTool(name) {
  return spawnSync('which', [name], { stdio: 'ignore' }).status === 0;
}

function detectTools() {
  const magick = hasTool('magick') ? 'magick' : hasTool('convert') ? 'convert' : null;
  return {
    magick,
    ffmpeg: hasTool('ffmpeg') ? 'ffmpeg' : null,
    gifsicle: hasTool('gifsicle') ? 'gifsicle' : null,
  };
}

// ------------------------------------------------------------------ helpers

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function humanBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
}

/** A file is "already done" if its current size matches what we recorded. */
function isAlreadyOptimized(manifest, relPath, size) {
  const record = manifest[relPath];
  return Boolean(record) && record.optimizedSize === size;
}

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] });
}

// ------------------------------------------------------------- optimizers

function optimizeRaster(tools, input, output, opts) {
  const ext = path.extname(input).toLowerCase();
  const resize = `${opts.maxWidth}x${opts.maxWidth}>`; // ">" = only shrink, never enlarge

  const args = [input, '-auto-orient', '-resize', resize, '-strip'];

  if (ext === '.png') {
    args.push(
      '-define', 'png:compression-level=9',
      '-define', 'png:compression-filter=5',
      '-define', 'png:compression-strategy=1'
    );
  } else {
    args.push(
      '-sampling-factor', '4:2:0',
      '-interlace', 'JPEG',
      '-quality', String(opts.quality)
    );
  }

  args.push(output);
  run(tools.magick, args);
}

function optimizeVideo(tools, input, output, opts) {
  const args = [
    '-y', '-loglevel', 'error',
    '-i', input,
    // scale only when wider than the cap; -2 keeps the height even for h.264
    '-vf', `scale='min(${opts.videoMaxWidth},iw)':-2`,
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-preset', 'medium',
    '-crf', String(opts.crf),
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
  ];
  args.push(opts.keepAudio ? '-c:a' : '-an');
  if (opts.keepAudio) args.push('aac', '-b:a', '128k');
  args.push(output);
  run(tools.ffmpeg, args);
}

function optimizeGif(tools, input, output, opts) {
  if (tools.gifsicle) {
    const args = ['-O3', '--lossy=80', '--resize-fit-width', String(opts.gifMaxWidth), input];
    const result = spawnSync(tools.gifsicle, args, { maxBuffer: 1024 * 1024 * 512 });
    if (result.status !== 0) throw new Error(result.stderr.toString());
    fs.writeFileSync(output, result.stdout);
    return;
  }
  run(tools.magick, [
    input, '-coalesce',
    '-resize', `${opts.gifMaxWidth}x>`,
    '-layers', 'Optimize',
    output,
  ]);
}

// ---------------------------------------------------------------- pipeline

function classify(file, tools) {
  const ext = path.extname(file).toLowerCase();
  if (RASTER_EXT.includes(ext)) return tools.magick ? { kind: 'raster', ext } : { kind: 'skip', reason: 'imagemagick not installed' };
  if (VIDEO_EXT.includes(ext)) return tools.ffmpeg ? { kind: 'video', ext } : { kind: 'skip', reason: 'ffmpeg not installed' };
  if (GIF_EXT.includes(ext)) {
    if (tools.gifsicle || tools.magick) return { kind: 'gif', ext };
    return { kind: 'skip', reason: 'gifsicle/imagemagick not installed' };
  }
  return null; // not a media file we handle
}

function processFile(file, job, tools, opts, tmpDir) {
  const ext = path.extname(file).toLowerCase();
  const output = path.join(tmpDir, `${process.pid}-${Math.random().toString(36).slice(2)}${ext}`);

  try {
    if (job.kind === 'raster') optimizeRaster(tools, file, output, opts);
    else if (job.kind === 'video') optimizeVideo(tools, file, output, opts);
    else if (job.kind === 'gif') optimizeGif(tools, file, output, opts);

    if (!fs.existsSync(output)) throw new Error('no output produced');
    return { output, size: fs.statSync(output).size };
  } catch (err) {
    if (fs.existsSync(output)) fs.unlinkSync(output);
    throw err;
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(USAGE);
    return;
  }

  const tools = detectTools();
  if (!tools.magick) console.warn('! ImageMagick not found — jpg/png will be skipped. brew install imagemagick');
  if (!tools.ffmpeg) console.warn('! ffmpeg not found — video will be skipped. brew install ffmpeg');
  if (!tools.gifsicle && tools.magick) console.warn('! gifsicle not found — falling back to ImageMagick for gifs. brew install gifsicle');

  if (!fs.existsSync(opts.root)) {
    console.error(`Nothing to scan: ${opts.root} does not exist.`);
    process.exit(1);
  }

  const manifest = loadManifest();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'optimize-media-'));

  const files = walk(opts.root)
    .filter(f => !opts.only || f.includes(opts.only))
    .sort();

  const results = [];
  const skipped = [];
  let scanned = 0;

  for (const file of files) {
    const rel = path.relative(REPO_ROOT, file);
    const job = classify(file, tools);
    if (!job) continue;
    if (job.kind === 'skip') {
      skipped.push({ rel, reason: job.reason });
      continue;
    }

    scanned++;
    const beforeSize = fs.statSync(file).size;

    if (!opts.force && isAlreadyOptimized(manifest, rel, beforeSize)) continue;

    if (process.stderr.isTTY) process.stderr.write(`  … ${rel}\r`);

    let attempt;
    try {
      attempt = processFile(file, job, tools, opts, tmpDir);
    } catch (err) {
      skipped.push({ rel, reason: `failed: ${String(err.message).split('\n')[0]}` });
      continue;
    }

    const savedPct = ((beforeSize - attempt.size) / beforeSize) * 100;

    if (savedPct < opts.minSavings) {
      fs.unlinkSync(attempt.output);
      // Already small enough — record it so later runs don't retry.
      manifest[rel] = { optimizedSize: beforeSize, at: new Date().toISOString() };
      continue;
    }

    if (opts.apply) {
      if (opts.backup) {
        const backupPath = path.join(opts.backup, path.relative(REPO_ROOT, file));
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });
        fs.copyFileSync(file, backupPath);
      }
      fs.copyFileSync(attempt.output, file);
      manifest[rel] = { optimizedSize: attempt.size, at: new Date().toISOString() };
    }

    fs.unlinkSync(attempt.output);
    results.push({ rel, before: beforeSize, after: attempt.size, savedPct, kind: job.kind });
  }

  if (process.stderr.isTTY) process.stderr.write(' '.repeat(80) + '\r');
  fs.rmSync(tmpDir, { recursive: true, force: true });

  if (opts.apply) saveManifest(manifest);

  // ------------------------------------------------------------- reporting
  results.sort((a, b) => (b.before - b.after) - (a.before - a.after));

  const totalBefore = results.reduce((sum, r) => sum + r.before, 0);
  const totalAfter = results.reduce((sum, r) => sum + r.after, 0);

  console.log('');
  console.log(opts.apply ? 'OPTIMIZED' : 'DRY RUN — nothing was written (pass --apply to write)');
  console.log('');

  if (results.length === 0) {
    console.log(`Nothing to do. ${scanned} media file(s) scanned, all already at or below target.`);
  } else {
    const width = Math.max(...results.map(r => r.rel.length));
    for (const r of results) {
      console.log(
        `  ${r.rel.padEnd(width)}  ${humanBytes(r.before).padStart(9)} → ${humanBytes(r.after).padStart(9)}` +
        `  (-${r.savedPct.toFixed(0)}%)`
      );
    }
    console.log('');
    console.log(
      `  ${results.length} of ${scanned} file(s): ` +
      `${humanBytes(totalBefore)} → ${humanBytes(totalAfter)} ` +
      `(saves ${humanBytes(totalBefore - totalAfter)}, -${(((totalBefore - totalAfter) / totalBefore) * 100).toFixed(0)}%)`
    );
  }

  if (skipped.length) {
    console.log('');
    console.log('Skipped:');
    for (const s of skipped) console.log(`  ${s.rel} — ${s.reason}`);
  }

  // Nudge for gifs that would be far smaller as video.
  const bigGifs = results.filter(r => r.kind === 'gif' && r.after > 2 * 1024 * 1024);
  if (bigGifs.length) {
    console.log('');
    console.log('Note: these gifs are still large. An mp4 would be ~10x smaller —');
    console.log('convert them and update the coverImage path in the matching markdown file:');
    for (const g of bigGifs) console.log(`  ${g.rel} (${humanBytes(g.after)})`);
  }

  console.log('');
}

main();
