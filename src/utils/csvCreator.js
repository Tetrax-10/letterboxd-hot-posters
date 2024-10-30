import fs from "fs"
import puppeteer from "puppeteer"

import { exec, execSync } from "child_process"

const isManualSelection = process.argv[3] || false ///////////////////////////////////////////////

async function checkIfServerIsRunning() {
    try {
        const res = await fetch("http://localhost:8999/build.js")

        return res.ok
    } catch (error) {
        return false
    }
}

export default async ({ letterboxdPath, weight: weightArgs, isManualSelection } = {}) => {
    const outFolder = `./out/${letterboxdPath.replaceAll("/", "_")}`

    // Check if scraped data exists
    if (!fs.existsSync(`${outFolder}/scraped_data.json`)) {
        console.error(`No scraped data found for ${letterboxdPath}`)
        process.exit(1)
    }

    // Check if classified data exists
    if (!fs.existsSync(`${outFolder}/classified_data.json`)) {
        console.error(`No classified data found for ${letterboxdPath}`)
        process.exit(1)
    }

    // Start manual poster picker server
    let serverProcess = null
    function killServer() {
        serverProcess?.kill()
        setTimeout(() => process.exit(0), 1000)
    }

    if (isManualSelection) {
        try {
            console.log("Building manual poster picker server...")
            execSync("npm run build-selection-server")
            console.log("Hosting server...")
            serverProcess = exec("npm run serve")
        } catch (error) {
            console.error("Failed to start manual poster picker server:", error)
            process.exit(1)
        }
    }

    // Get scraped data
    const scrapedFileContents = fs.readFileSync(`${outFolder}/scraped_data.json`, "utf8")
    const scrapedData = JSON.parse(scrapedFileContents)

    // Get classified data
    const classifiedFileContents = fs.readFileSync(`${outFolder}/classified_data.json`, "utf8")
    const classifiedData = JSON.parse(classifiedFileContents)

    let weightedData = []

    // Collect the filmId and weights
    for (const filmId in classifiedData) {
        const { s: sexy = 0, p: porn = 0 } = classifiedData[filmId]
        const weight = sexy + porn

        if (weight >= weightArgs) {
            weightedData.push({ filmId, weight })
        }
    }

    // Sort the array in descending order based on the weight
    weightedData.sort((a, b) => b.weight - a.weight)

    if (isManualSelection) {
        try {
            while (!(await checkIfServerIsRunning())) {
                await new Promise((resolve) => setTimeout(resolve, 100))
            }

            const browser = await puppeteer.launch({
                headless: false,
                args: ["--start-maximized"],
                defaultViewport: null,
                protocolTimeout: 0,
                timeout: 0,
            })
            const page = await browser.newPage()
            page.setDefaultTimeout(0)

            await page.goto("http://localhost:8999/index.html", { timeout: 0 })
            console.log("Browser launched!")

            weightedData = await page.evaluate(
                async (data) => {
                    while (!window.start) {
                        await new Promise((resolve) => setTimeout(resolve, 100))
                    }
                    return window.start(data)
                },
                [letterboxdPath, weightedData]
            )

            await browser.close()
            killServer()

            // Sort the array in descending order based on the weight
            weightedData.sort((a, b) => b.weight - a.weight)
        } catch (error) {
            if (error.message.includes("Target closed")) {
                console.log("Browser closed unexpectedly!")
            } else {
                console.log(error)
            }
            console.log("Script failed!")
            killServer()
        }
    }

    // If you need only filmIds, extract them
    const csvData = weightedData.map(({ filmId }) => {
        const [filmLink] = scrapedData[filmId].split("|")
        return `https://letterboxd.com/film/${filmLink}/`
    })
    csvData.unshift("URL")

    fs.writeFileSync(`${outFolder}/hot_posters_weight_${weightArgs}.csv`, csvData.join("\n"))
    console.log(`Wrote ${csvData.length - 1} films to hot_posters_weight_${weightArgs}.csv`)
}
