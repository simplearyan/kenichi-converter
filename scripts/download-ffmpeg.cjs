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
    const url = `https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v6.1/${name}-${platform}.zip`;
    const zipPath = path.join(binDir, `${name}-${platform}.zip`);
    
    console.log(`Downloading ${name} for ${triple} (${platform}) from ${url}...`);

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(zipPath);
        https.get(url, (response) => {
            if (response.statusCode === 302) {
                // Redirect
                https.get(response.headers.location, (redirectResponse) => {
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close(() => resolve(zipPath));
                    });
                }).on('error', (err) => {
                    fs.unlink(zipPath, () => reject(err));
                });
            } else {
                response.pipe(file);
                file.on('finish', () => {
                   file.close(() => resolve(zipPath));
                });
            }
        }).on('error', (err) => {
            fs.unlink(zipPath, () => reject(err));
        });
    });
}

function unzip(zipPath, targetName) {
    // Quick and dirty unzip using 'unzip' on *nix or powershell on windows if needed
    // Actually, safer to rely on 'adm-zip' dependency if we add it, but attempting native command first to avoid deps.
    // Given user wants CI, I'll rely on the platform provided 'unzip' or '7z'.
    
    // Windows GitHub runner has 7z
    // macOS/Linux has unzip
    
    const isWindows = process.platform === 'win32';
    const unzippedName = isWindows ? targetName.replace('.exe', '') : targetName; // Original filename inside zip usually matches binary name
    
    // Just extract specifically
    try {
        if (isWindows) {
            execSync(`7z e "${zipPath}" -o"${binDir}" -y`);
        } else {
            execSync(`unzip -o "${zipPath}" -d "${binDir}"`);
        }
        
        // Rename if the extracted file isn't already the final name
        // ffbinaries zip usually contains 'ffmpeg.exe' or 'ffmpeg'
        const rawName = targetName.split('-')[0] + (isWindows ? '.exe' : '');
        const rawPath = path.join(binDir, rawName);
        const finalPath = path.join(binDir, targetName);
        
        if (fs.existsSync(rawPath)) {
             fs.renameSync(rawPath, finalPath);
             console.log(`Renamed ${rawName} to ${targetName}`);
             
             if (!isWindows) {
                 execSync(`chmod +x "${finalPath}"`);
             }
        } else {
            console.error(`Extracted file ${rawName} not found!`);
        }
        
        fs.unlinkSync(zipPath); // Cleanup zip
        
    } catch (e) {
        console.error("Error during extraction:", e);
    }
}

async function main() {
    if (!targetTriple) {
        console.error("Usage: node download-ffmpeg.js <target-triple>");
        process.exit(1);
    }

    for (const bin of binaries) {
        const targetName = getBinaryName(bin, targetTriple);
        const zipPath = await downloadBinary(bin, targetTriple);
        unzip(zipPath, targetName);
    }
    
    console.log("FFmpeg setup complete!");
}

main();
