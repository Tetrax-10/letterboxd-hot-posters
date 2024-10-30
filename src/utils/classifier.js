import fs from "fs"
import puppeteer from "puppeteer"

import { exec, execSync } from "child_process"

async function checkIfServerIsRunning() {
    try {
        const res = await fetch("http://localhost:8999/build.js")

        return res.ok
    } catch (error) {
        return false
    }
}

export default async (letterboxdPath) => {
    const outFolder = `./out/${letterboxdPath.replaceAll("/", "_")}`

    // Check if scraped data exists
    if (!fs.existsSync(`${outFolder}/scraped_data.json`)) {
        console.error(`No scraped data found for ${letterboxdPath}`)
        process.exit(1)
    }

    // Start Nsfw.js server
    let serverProcess = null
    function killServer() {
        serverProcess?.kill()
        setTimeout(() => process.exit(0), 1000)
    }

    try {
        console.log("Building Nsfw.js model...")
        execSync("npm run build-classify-server")
        console.log("Loading Nsfw.js model...")
        serverProcess = exec("npm run serve")
    } catch (error) {
        console.error("Failed to start Nsfw.js server:", error)
        process.exit(1)
    }

    while (!(await checkIfServerIsRunning())) {
        await new Promise((resolve) => setTimeout(resolve, 100))
    }

    const browser = await puppeteer.launch({ protocolTimeout: 0, timeout: 0 })
    let page = await browser.newPage()
    page.setDefaultTimeout(0)

    await page.goto("http://localhost:8999/index.html", { timeout: 0 })
    console.log("Nsfw.js model loaded\n")

    // Call classify function that runs in the browser
    async function classifyLocalImage(letterboxdPath, filmId) {
        return await page.evaluate(
            async (data) => {
                while (!window.classifyNsfw) {
                    await new Promise((resolve) => setTimeout(resolve, 100))
                }
                return window.classifyNsfw(data)
            },
            [letterboxdPath, filmId]
        )
    }

    // Get scraped data
    const scrapedFileContents = fs.readFileSync(`${outFolder}/scraped_data.json`, "utf8")
    const scrapedData = JSON.parse(scrapedFileContents)

    // Try Getting classified data
    const classifiedFileContents = fs.existsSync(`${outFolder}/classified_data.json`)
        ? fs.readFileSync(`${outFolder}/classified_data.json`, "utf8")
        : null

    // If classified data exists, use it. Otherwise, create an empty object from scraped data
    const classifiedData = classifiedFileContents
        ? JSON.parse(classifiedFileContents)
        : Object.keys(scrapedData).reduce((acc, key) => {
              acc[key] = null
              return acc
          }, {})

    let loopCount = 0
    let failedToClassifyCount = 0
    for (const filmId in scrapedData) {
        // Skip if image already classified
        if (classifiedFileContents !== null && classifiedData[filmId] !== null) continue

        try {
            const classifyResult = await classifyLocalImage(letterboxdPath, filmId)

            if (classifyResult?.length) {
                // Transform classify result
                classifiedData[filmId] = classifyResult.reduce((acc, item) => {
                    const key = item.className.slice(0, 1).toLowerCase() // Get first letter of label
                    const value = Math.round(item.probability * 100) // Convert probability to percentage
                    if (value) acc[key] = value // Only add if value is greater than 0
                    return acc
                }, {})
                console.log(`Classified: ${filmId}.jpg`)
            } else {
                failedToClassifyCount += 1
                console.log(`Failed to classify: ${filmId}.jpg`)
            }
        } catch (error) {
            failedToClassifyCount += 1
            console.log(`Error while classifying ${filmId}.jpg: ${error}`)
        }

        // Open new tab and write classified_data.json every 100 images
        if (loopCount % 100 === 0 && loopCount !== 0) {
            // Writing it every 100 images to avoid data loss due to errors
            writeJson()

            console.log("\nReloading Nsfw.js model...")
            await page.close()
            await new Promise((resolve) => setTimeout(resolve, 5000))
            page = await browser.newPage()
            page.setDefaultTimeout(0)
            await page.goto("http://localhost:8999/index.html", { timeout: 0 })
            console.log("Nsfw.js model reloaded\n")
        }

        loopCount += 1
    }

    await browser.close()
    killServer()

    function writeJson() {
        fs.writeFileSync(`${outFolder}/classified_data.json`, JSON.stringify(classifiedData))
    }

    writeJson()

    console.log(`\nClassified ${loopCount}/${Object.keys(classifiedData).length} images`)

    if (failedToClassifyCount) console.log(`Failed to classify ${failedToClassifyCount} images`)
}
