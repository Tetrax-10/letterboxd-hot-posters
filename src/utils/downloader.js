import fs from "fs"
import path from "path"
import https from "https"

// Generates poster url from poster key
function generatePosterUrl(filmId, value) {
    let [filmLink, posterKey = ""] = value.split("|")

    if (posterKey.startsWith("https://")) {
        return posterKey
    }

    const filmIdDigits = filmId.split("")
    const startLink = "https://a.ltrbxd.com/resized/film-poster/"
    const endLink = "-0-300-0-450-crop.jpg"

    if (posterKey) filmLink = posterKey

    return `${startLink}${filmIdDigits.join("/")}/${filmId}-${filmLink}${endLink}`
}

async function downloadImage(posterUrl, filmId, outFolder) {
    const outputPath = path.join(outFolder, `${filmId}.jpg`)

    const options = {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        },
    }

    return new Promise((resolve, reject) => {
        https
            .get(posterUrl, options, (response) => {
                if (response.statusCode === 200) {
                    const file = fs.createWriteStream(outputPath)
                    response.pipe(file)

                    file.on("finish", () => {
                        file.close()
                        resolve(true)
                    })

                    file.on("error", (err) => {
                        console.log(`File write error ${filmId}: ${err.message}`)
                        reject(false)
                    })
                } else {
                    console.log(`Failed to download image ${filmId}. Status code: ${response.statusCode}`)
                    reject(false)
                }
            })
            .on("error", (err) => {
                console.log(`Error downloading image ${filmId}: ${err.message}`)
                reject(false)
            })
    })
}

export default async (letterboxdPath) => {
    const outFolder = `./out/${letterboxdPath.replaceAll("/", "_")}`

    // Check if scraped data exists
    if (!fs.existsSync(`${outFolder}/scraped_data.json`)) {
        console.error(`No scraped data found for ${letterboxdPath}`)
        process.exit(1)
    }

    // Create posters folder to store downloaded images
    const postersFolder = `${outFolder}/posters`
    if (!fs.existsSync(postersFolder)) {
        fs.mkdirSync(postersFolder, { recursive: true })
    }

    // Get scraped data
    const scrapedFileContents = fs.readFileSync(`${outFolder}/scraped_data.json`, "utf8")
    const scrapedData = JSON.parse(scrapedFileContents)

    let loopCount = 0
    let failedToDownload = 0
    for (const filmId in scrapedData) {
        // Skip if image already exists
        if (fs.existsSync(`${postersFolder}/${filmId}.jpg`)) continue

        const posterUrl = generatePosterUrl(filmId, scrapedData[filmId])

        const isSuccess = await downloadImage(posterUrl, filmId, postersFolder)

        if (isSuccess) {
            console.log(`Downloaded image: ${filmId}.jpg`)
        } else {
            failedToDownload += 1
        }

        loopCount += 1
    }

    console.log(`\nDownloaded ${loopCount}/${Object.keys(scrapedData).length} images`)

    if (failedToDownload) console.log(`Failed to download ${failedToDownload} images`)
}
