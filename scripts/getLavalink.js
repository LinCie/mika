const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LAVALINK_API_URL = 'https://api.github.com/repos/lavalink-devs/Lavalink/releases/latest';
const YOUTUBE_PLUGIN_API_URL = 'https://api.github.com/repos/lavalink-devs/youtube-source/releases/latest';
const TARGET_FOLDER = path.join(__dirname, '..', 'lavalink');
const PLUGIN_FOLDER = path.join(TARGET_FOLDER, 'plugins');
const LAVALINK_JAR = path.join(TARGET_FOLDER, 'Lavalink.jar');
const YOUTUBE_PLUGIN_JAR = path.join(PLUGIN_FOLDER, 'youtube-plugin.jar');

// Function to make an HTTPS request and return a Promise
function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        https.get(url, { ...options, headers: { 'User-Agent': 'Node.js' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(fetch(res.headers.location, options));
            }

            if (res.statusCode !== 200) {
                return reject(new Error(`Request failed with status code ${res.statusCode}`));
            }

            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

// Function to download a file
function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);
        https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(downloadFile(res.headers.location, destination));
            }

            if (res.statusCode !== 200) {
                return reject(new Error(`Download failed with status code ${res.statusCode}`));
            }

            res.pipe(file);
            file.on('finish', () => file.close(resolve));
            file.on('error', (err) => {
                fs.unlink(destination, () => reject(err));
            });
        }).on('error', (err) => {
            fs.unlink(destination, () => reject(err));
        });
    });
}

(async () => {
    try {
        console.log('Fetching latest Lavalink release information...');
        const lavalinkResponse = await fetch(LAVALINK_API_URL);
        const lavalinkReleaseData = JSON.parse(lavalinkResponse);
        const lavalinkJarAsset = lavalinkReleaseData.assets.find((asset) => asset.name === 'Lavalink.jar');

        if (!lavalinkJarAsset) {
            throw new Error('Lavalink.jar not found in the latest release.');
        }

        console.log(`Downloading Lavalink from ${lavalinkJarAsset.browser_download_url}...`);

        // Ensure the target folder exists
        if (!fs.existsSync(TARGET_FOLDER)) {
            fs.mkdirSync(TARGET_FOLDER, { recursive: true });
        }

        await downloadFile(lavalinkJarAsset.browser_download_url, LAVALINK_JAR);
        console.log(`Lavalink.jar has been downloaded to ${LAVALINK_JAR}`);

        console.log('Fetching latest YouTube plugin release information...');
        const youtubeResponse = await fetch(YOUTUBE_PLUGIN_API_URL);
        const youtubeReleaseData = JSON.parse(youtubeResponse);
        const youtubePluginAsset = youtubeReleaseData.assets.find((asset) => asset.name.endsWith('.jar'));

        if (!youtubePluginAsset) {
            throw new Error('YouTube plugin JAR not found in the latest release.');
        }

        console.log(`Downloading YouTube plugin from ${youtubePluginAsset.browser_download_url}...`);

        // Ensure the plugin folder exists
        if (!fs.existsSync(PLUGIN_FOLDER)) {
            fs.mkdirSync(PLUGIN_FOLDER, { recursive: true });
        }

        await downloadFile(youtubePluginAsset.browser_download_url, YOUTUBE_PLUGIN_JAR);
        console.log(`YouTube plugin has been downloaded to ${YOUTUBE_PLUGIN_JAR}`);
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
})();
