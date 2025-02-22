import * as https from 'node:https'
import * as fs from 'node:fs'
import * as path from 'node:path'

const LAVALINK_API_URL: string =
    'https://api.github.com/repos/lavalink-devs/Lavalink/releases/latest'
const TARGET_FOLDER: string = path.join(__dirname, '..', 'lavalink')
const LAVALINK_JAR: string = path.join(TARGET_FOLDER, 'Lavalink.jar')

interface LavalinkAsset {
    name: string
    browser_download_url: string
}

interface LavalinkReleaseData {
    assets: LavalinkAsset[]
}

function fetch(
    url: string,
    options: https.RequestOptions = {}
): Promise<string> {
    return new Promise((resolve, reject) => {
        https
            .get(
                url,
                { ...options, headers: { 'User-Agent': 'Node.js' } },
                (res) => {
                    if (
                        res.statusCode &&
                        res.statusCode >= 300 &&
                        res.statusCode < 400 &&
                        res.headers.location
                    ) {
                        return resolve(fetch(res.headers.location, options))
                    }

                    if (res.statusCode !== 200) {
                        return reject(
                            new Error(
                                `Request failed with status code ${res.statusCode}`
                            )
                        )
                    }

                    let data = ''
                    res.on('data', (chunk: unknown) => (data += chunk))
                    res.on('end', () => resolve(data))
                }
            )
            .on('error', reject)
    })
}

function downloadFile(url: string, destination: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination)
        https
            .get(url, (res) => {
                if (
                    res.statusCode &&
                    res.statusCode >= 300 &&
                    res.statusCode < 400 &&
                    res.headers.location
                ) {
                    return resolve(
                        downloadFile(res.headers.location, destination)
                    )
                }

                if (res.statusCode !== 200) {
                    return reject(
                        new Error(
                            `Download failed with status code ${res.statusCode}`
                        )
                    )
                }

                res.pipe(file)
                file.on('finish', () => file.close(() => resolve()))
                file.on('error', (err) => {
                    fs.unlink(destination, () => reject(err))
                })
            })
            .on('error', (err) => {
                fs.unlink(destination, () => reject(err))
            })
    })
}

;(async () => {
    try {
        console.log('Fetching latest Lavalink release information...')
        const lavalinkResponse = await fetch(LAVALINK_API_URL)
        const lavalinkReleaseData: LavalinkReleaseData =
            JSON.parse(lavalinkResponse)
        const lavalinkJarAsset = lavalinkReleaseData.assets.find(
            (asset) => asset.name === 'Lavalink.jar'
        )

        if (!lavalinkJarAsset) {
            throw new Error('Lavalink.jar not found in the latest release.')
        }

        console.log(
            `Downloading Lavalink from ${lavalinkJarAsset.browser_download_url}...`
        )

        if (!fs.existsSync(TARGET_FOLDER)) {
            fs.mkdirSync(TARGET_FOLDER, { recursive: true })
        }

        await downloadFile(lavalinkJarAsset.browser_download_url, LAVALINK_JAR)
        console.log(`Lavalink.jar has been downloaded to ${LAVALINK_JAR}`)
    } catch (error) {
        if (error instanceof Error) {
            console.error('An error occurred:', error.message)
        } else {
            console.error('An unknown error occurred.')
        }
    }
})()
