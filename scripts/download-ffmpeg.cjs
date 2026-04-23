/**
 * download-ffmpeg.cjs
 *
 * Downloads platform-specific ffmpeg and ffprobe binaries from ffbinaries and
 * renames them to the Tauri sidecar naming convention:
 *   <name>-<target-triple>[.exe]
 *
 * Usage:
 *   node scripts/download-ffmpeg.cjs <target-triple>
 *
 * Supported triples:
 *   x86_64-pc-windows-msvc
 *   x86_64-apple-darwin
 *   aarch64-apple-darwin
 *   x86_64-unknown-linux-gnu
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const targetTriple = process.argv[2];
const binDir = path.resolve(__dirname, '../src-tauri/bin');

if (!targetTriple) {
  console.error('Usage: node download-ffmpeg.cjs <target-triple>');
  console.error('Example: node download-ffmpeg.cjs x86_64-pc-windows-msvc');
  process.exit(1);
}

if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

/**
 * Maps a Rust target triple to the ffbinaries platform slug and version tag.
 * ffbinaries release naming: https://github.com/ffbinaries/ffbinaries-prebuilt/releases
 */
function getPlatformSlug(triple) {
  if (triple.includes('windows'))          return 'win-64';
  if (triple.includes('aarch64-apple'))    return 'macos-64'; // ffbinaries only has macos-64
  if (triple.includes('x86_64-apple'))     return 'macos-64';
  if (triple.includes('linux'))            return 'linux-64';
  throw new Error(`Unsupported target triple: ${triple}`);
}

const FFBINARIES_VERSION = '6.1';
const FFBINARIES_BASE    = `https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v${FFBINARIES_VERSION}`;

function getBinaryFilename(name, triple) {
  const ext = triple.includes('windows') ? '.exe' : '';
  return `${name}-${triple}${ext}`;
}

/** Follow all 301/302 redirects and resolve to the final URL. */
function resolveRedirects(url, maxRedirects = 10) {
  return new Promise((resolve, reject) => {
    if (maxRedirects === 0) return reject(new Error('Too many redirects'));

    https.get(url, { headers: { 'User-Agent': 'kenichi-converter-ci' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        res.resume(); // drain
        return resolve(resolveRedirects(res.headers.location, maxRedirects - 1));
      }
      resolve({ url, res });
    }).on('error', reject);
  });
}

/** Download url → localPath, following redirects. Returns promise<localPath>. */
function downloadFile(url, localPath) {
  return new Promise(async (resolve, reject) => {
    try {
      const { res } = await resolveRedirects(url);

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }

      const file = fs.createWriteStream(localPath);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(localPath)));
      file.on('error', (err) => { fs.unlink(localPath, () => {}); reject(err); });
    } catch (err) {
      reject(err);
    }
  });
}

function extractBinary(zipPath, targetFilename) {
  const isWindows = process.platform === 'win32';

  try {
    if (isWindows) {
      // PowerShell Expand-Archive is available on all modern Windows; 7z is not guaranteed
      execSync(
        `powershell -Command "Expand-Archive -Force '${zipPath}' '${binDir}'"`,
        { stdio: 'inherit' }
      );
    } else {
      execSync(`unzip -o "${zipPath}" -d "${binDir}"`, { stdio: 'inherit' });
    }
  } catch (e) {
    console.error('Extraction failed:', e.message);
    process.exit(1);
  }

  // Find the extracted file (e.g. ffmpeg.exe, ffmpeg, ffmpeg-6.1, …)
  const prefix = targetFilename.split('-')[0]; // 'ffmpeg' or 'ffprobe'
  const files   = fs.readdirSync(binDir);
  const found   = files.find(
    (f) => f.startsWith(prefix) && !f.endsWith('.zip') && f !== targetFilename
  );

  if (!found) {
    console.error(`Could not find extracted binary starting with "${prefix}" in ${binDir}`);
    console.error('Directory contents:', files.join(', '));
    process.exit(1);
  }

  const rawPath   = path.join(binDir, found);
  const finalPath = path.join(binDir, targetFilename);

  if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
  fs.renameSync(rawPath, finalPath);

  if (!isWindows) {
    execSync(`chmod +x "${finalPath}"`);
  }

  // Clean up the zip
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  console.log(`  ✔ ${found} → ${targetFilename}`);
}

async function setupBinary(name, triple, platformSlug) {
  const targetFilename = getBinaryFilename(name, triple);
  const finalPath      = path.join(binDir, targetFilename);

  if (fs.existsSync(finalPath)) {
    console.log(`  ⏭  ${targetFilename} already exists, skipping.`);
    return;
  }

  const zipName = `${name}-${FFBINARIES_VERSION}-${platformSlug}.zip`;
  const url     = `${FFBINARIES_BASE}/${zipName}`;
  const zipPath = path.join(binDir, zipName);

  console.log(`  ↓ Downloading ${name} for ${triple}…`);
  console.log(`    ${url}`);

  await downloadFile(url, zipPath);
  extractBinary(zipPath, targetFilename);
}

async function main() {
  let platformSlug;
  try {
    platformSlug = getPlatformSlug(targetTriple);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  console.log(`\n⚡ FFmpeg Sidecar Setup`);
  console.log(`   Target : ${targetTriple}`);
  console.log(`   Platform: ${platformSlug}`);
  console.log(`   Output  : ${binDir}\n`);

  for (const bin of ['ffmpeg', 'ffprobe']) {
    await setupBinary(bin, targetTriple, platformSlug);
  }

  console.log('\n✅ FFmpeg sidecar setup complete!\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
