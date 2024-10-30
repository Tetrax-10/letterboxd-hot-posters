import * as nsfwjs from "nsfwjs"

// main
;(async () => {
    const model = await nsfwjs.load("InceptionV3")

    window.classifyNsfw = async ([letterboxdPath, filmId]) => {
        try {
            const img = document.querySelector("img")
            img.src = `http://localhost:8999/out/${letterboxdPath.replaceAll("/", "_")}/posters/${filmId}.jpg`

            await new Promise((resolve) => {
                img.onload = resolve
            })

            const predictions = await model.classify(img)
            return predictions
        } catch (error) {
            console.error("Error classifying image:", error)
            return null
        }
    }
})()
