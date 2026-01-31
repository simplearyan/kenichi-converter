const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const targetTriple = process.argv[2];
const binDir = path.resolve(__dirname, '../src-tauri/bin');

if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

function getBinaryName(name, triple) {
  const ext = triple.includes('windows') ? '.exe' : '';
  // Correct Tauri convention: <name>-<target-triple><ext>
  return `${name}-${triple}${ext}`;
}

// Download FFmpeg and FFprobe
const binaries = [
  'ffmpeg', 
  'ffprobe'
];

async function downloadBinary(name, triple) {
    const platform = triple.includes('windows') ? 'win-64' : (triple.includes('darwin') ? 'osx-64' : 'linux-64');
    // Versioned filenames in the URL: ffmpeg-6.1-win-64.zip
    const url = `https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v6.1/${name}-6.1-${platform}.zip`;
    const zipPath = path.join(binDir, `${name}-${platform}.zip`);
    
    console.log(`Downloading ${name} for ${triple} (${platform}) from ${url}...`);

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(zipPath);
        const request = https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow Redirect
                https.get(response.headers.location, (redirectResponse) => {
                    if (redirectResponse.statusCode !== 200) {
                        reject(new Error(`Failed to download: status ${redirectResponse.statusCode}`));
                        return;
                    }
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close(() => resolve(zipPath));
                    });
                }).on('error', (err) => {
                    fs.unlink(zipPath, () => reject(err));
                });
            } else if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                   file.close(() => resolve(zipPath));
                });
            } else {
                reject(new Error(`Failed to download: status ${response.statusCode}`));
            }
        });

        request.on('error', (err) => {
            fs.unlink(zipPath, () => reject(err));
        });

        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('Download timeout'));
        });
    });
}

function unzip(zipPath, targetName) {
    const isWindows = process.platform === 'win32';
    
    try {
        if (isWindows) {
            execSync(`7z e "${zipPath}" -o"${binDir}" -y`);
        } else {
            execSync(`unzip -o "${zipPath}" -d "${binDir}"`);
        }
        
        // ffbinaries zip contains 'ffmpeg.exe' or 'ffmpeg-6.1' or similar
        // We look for any file that starts with the binary name
        const prefix = targetName.split('-')[0];
        const files = fs.readdirSync(binDir);
        const extractedFile = files.find(f => f.startsWith(prefix) && !f.endsWith('.zip') && f !== targetName);
        
        if (extractedFile) {
            const rawPath = path.join(binDir, extractedFile);
            const finalPath = path.join(binDir, targetName);
            
            if (fs.existsSync(finalPath)) {
                fs.unlinkSync(finalPath);
            }
            fs.renameSync(rawPath, finalPath);
            console.log(`Successfully extracted and renamed ${extractedFile} to ${targetName}`);
            
            if (!isWindows) {
                execSync(`chmod +x "${finalPath}"`);
            }
        } else {
            throw new Error(`Extracted file starting with ${prefix} not found!`);
        }
        
        if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
        }
        
    } catch (e) {
        console.error("Error during extraction:", e);
        process.exit(1);
    }
}

async function main() {
    if (!targetTriple) {
        console.error("Usage: node download-ffmpeg.js <target-triple>");
        process.exit(1);
    }

    try {
        for (const bin of binaries) {
            const targetName = getBinaryName(bin, targetTriple);
            const zipPath = await downloadBinary(bin, targetTriple);
            unzip(zipPath, targetName);
        }
        console.log("FFmpeg setup complete!");
    } catch (err) {
        console.error("FFmpeg setup failed:", err);
        process.exit(1);
    }
}

main();
