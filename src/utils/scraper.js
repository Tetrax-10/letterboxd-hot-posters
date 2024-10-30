import puppeteer from "puppeteer"
import fs from "fs"
import path from "path"

// gives a posterKey by analyzing filmId, filmLink and posterUrl which can be used to generate posterUrl
// thus taking less space in the database
function getPosterKey(filmId, filmLink, posterUrl) {
    // abcdefghijk, cde, hij => fg
    function getStringBetween(str, start, end) {
        const startIndex = str.indexOf(start)
        const endIndex = str.indexOf(end, startIndex + start.length)

        if (startIndex === -1 || endIndex === -1) return ""
        return str.substring(startIndex + start.length, endIndex)
    }

    // remove version nums
    posterUrl = posterUrl.match(/^(.*?)(?=\?v=)/)?.[0] || posterUrl

    const filmIdDigits = filmId.split("")
    const startLink = "https://a.ltrbxd.com/resized/film-poster/"
    const endLink = "-0-70-0-105-crop.jpg"
    const generatedPosterUrl = `${startLink}${filmIdDigits.join("/")}/${filmId}-${filmLink}${endLink}`

    // if filmLink is enough to generate posterUrl then return posterKey = ""
    if (posterUrl === generatedPosterUrl) {
        return ""
    } else {
        const filmLinkFromUrl = getStringBetween(posterUrl, `${startLink}${filmIdDigits.join("/")}/${filmId}-`, endLink)
        const generatedPosterUrl = `${startLink}${filmIdDigits.join("/")}/${filmId}-${filmLinkFromUrl}${endLink}`
        // if filmLink from posterUrl is enough to generate posterUrl then return filmLinkFromUrl
        if (filmLinkFromUrl && posterUrl === generatedPosterUrl) {
            return filmLinkFromUrl
        } else {
            // else return originalPosterUrl
            return posterUrl.replace("70-0-105", "300-0-450")
        }
    }
}

export default async (letterboxdPath) => {
    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch()
    // const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()

    // Set screen size
    await page.setViewport({ width: 1920, height: 1080 })

    // Navigate to page and extract film data
    async function getFilmDataByPage(pageNo) {
        try {
            await page.goto(`https://letterboxd.com/${letterboxdPath}/page/${pageNo}/`)

            // Wait for the posters to load
            await page.waitForSelector("li.poster-container, body.error", { timeout: 10000 })

            // Get film poster data
            return await page.evaluate(() => {
                // Triggers elements in the middle of the page to load
                setTimeout(() => {
                    window.scrollTo(0, document.body.scrollHeight / 2)
                }, 500)

                // Triggers elements at the bottom of the page to load
                setTimeout(() => {
                    window.scrollTo(0, document.body.scrollHeight)
                }, 1000)

                return new Promise((resolve) => {
                    setTimeout(() => {
                        const filmData = {}
                        // Extract film poster data
                        document.querySelectorAll("li.poster-container > div").forEach((el) => {
                            const filmId = el.dataset?.filmId || null
                            const filmLink = el.dataset?.filmLink?.match(/\/film\/([^\/]+)/)?.[1] || null
                            const posterUrl = el.querySelector(`img.image:not([src*="empty-poster"])`)?.src || null

                            if (filmId && filmLink && /0-\d+-0-\d+-crop\.jpg/.test(posterUrl)) {
                                filmData[filmId] = [filmLink, posterUrl.replace(/(0-)\d+(-0-)\d+(-crop\.jpg)/, `$170$2105$3`)]
                            }
                        })

                        // Check if there is next page
                        const isNextPageAvailable = document.querySelector("a.next") ? true : false

                        resolve([filmData, isNextPageAvailable])
                    }, 1500)
                })
            })
        } catch (error) {
            console.log(`Error scraping https://letterboxd.com/${letterboxdPath}/page/${pageNo}/`)
            return [{}, false]
        }
    }

    let AllFilmData = {}

    let AllFilmDataLength = 0
    let pageNo = 1
    // Loop until there is no next page
    while (pageNo) {
        console.log(`Scraping page ${pageNo}...`)
        const [filmData, isNextPageAvailable] = await getFilmDataByPage(pageNo)
        const filmDataLength = Object.keys(filmData).length
        AllFilmDataLength += filmDataLength

        if (filmDataLength) {
            AllFilmData = { ...AllFilmData, ...filmData }
            console.log(`Scraped ${filmDataLength} films on page ${pageNo}\n`)
            pageNo += 1
        }

        if (!isNextPageAvailable) {
            pageNo = 0
        }
    }

    // Transform scraped data
    const transformedData = {}
    for (const filmId in AllFilmData) {
        if (AllFilmData.hasOwnProperty(filmId)) {
            const [filmLink, posterUrl] = AllFilmData[filmId]
            const posterKey = getPosterKey(filmId, filmLink, posterUrl)
            if (posterKey) {
                transformedData[filmId] = `${filmLink}|${posterKey}`
            } else {
                transformedData[filmId] = filmLink
            }
        }
    }

    // Create output folder
    const outFolder = `./out/${letterboxdPath.replaceAll("/", "_")}`
    if (!fs.existsSync(outFolder)) {
        fs.mkdirSync(outFolder, { recursive: true })
    }

    // Write scraped data
    fs.writeFileSync(path.join(outFolder, `scraped_data.json`), JSON.stringify(transformedData, null, 2))
    console.log(`Wrote ${AllFilmDataLength} films to ${outFolder}/scraped_data.json`)

    await browser.close()
}
