import { program } from "commander"
import scraper from "./utils/scraper.js"
import downloader from "./utils/downloader.js"
import classifier from "./utils/classifier.js"
import csvCreator from "./utils/csvCreator.js"

program
    // basics
    .option("-s, --scrape", "Scrapes data from letterboxd")
    .option("-d, --download", "Downloads posters from scraped data")
    .option("-c, --classify", "Classifies downloaded posters")
    .option("-csv, --create-csv", "Creates CSV from classified data")
    .option("-u, --url <path>", 'Which page to perform actions on.\nEg: "https://letterboxd.com/films/country/philippines/"')
    .option("-m, --manual", "Used with -csv to manually select posters")
    .option("-w, --weight <number>", "Used with -csv to filter posters about a certain weight (1 to 100)", 30)
    .parse(process.argv)

if (process.argv.length <= 2) {
    program.help() // display help and exit if no arguments provided
}

const args = program.opts()

const letterboxdPath =
    (args.url &&
        (args.url.match(/letterboxd\.com\/(films\/[a-zA-Z0-9_\-/]+?)(?:\/page\/\d+)?\/?$/)?.[1] ||
            args.url.match(/letterboxd\.com\/([a-zA-Z0-9_\-/]+\/list\/[a-zA-Z0-9_\-/]+?)(?:\/page\/\d+)?\/?$/)?.[1])) ||
    null

if (!letterboxdPath) {
    console.log("Please specify a valid URL with -u or --url")
    process.exit(1)
}

if (args.scrape) {
    scraper(letterboxdPath)
} else if (args.download) {
    downloader(letterboxdPath)
} else if (args.classify) {
    classifier(letterboxdPath)
} else if (args.createCsv) {
    csvCreator({
        letterboxdPath,
        isManualSelection: args.manual || false,
        weight: args.weight || false,
    })
}
