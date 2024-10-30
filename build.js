import esbuild from "esbuild"

const file = process.argv[2]

esbuild
    .build({
        entryPoints: [`./server/${file}.js`],
        bundle: true,
        outfile: "./dist/server.js",
        minify: true,
        sourcemap: false,
        platform: "browser",
        target: ["es6"],
    })
    .catch(() => {
        console.error("Failed to build classifyServer.js")
        process.exit(1)
    })
