;(async () => {
    // input variables
    let letterboxdPath = null
    let weightedData = null

    // tracking variables
    const batchSize = 100
    let currentBatchIndexPos = 0
    const selectedFilms = new Set()

    // preserve originals
    let originalWeightedData = []
    let currentUnfilteredBatchIndexPos = 0

    function updateSelectedFilmsCounter() {
        document.getElementById("num-of-images").textContent = `${selectedFilms.size}/${weightedData.length} images`
    }

    // when slected a poster, don't make it red immediately, wait for the mouse to leave
    function onmouseleaveEvent(event) {
        event.target.classList.add("red")
        event.target.removeEventListener("mouseleave", onmouseleaveEvent)
    }

    function createImageElement(film) {
        const container = document.createElement("div")
        container.classList.add("film-item")
        container.dataset.id = film.filmId
        container.dataset.weight = film.weight

        if (selectedFilms.has(film.filmId)) {
            container.classList.add("selected", "red")
        }

        const img = document.createElement("img")
        img.src = `http://localhost:8999/out/${letterboxdPath.replaceAll("/", "_")}/posters/${film.filmId}.jpg`
        img.alt = `${film.filmId}.jpg`

        container.appendChild(img)

        container.addEventListener("click", () => {
            if (container.classList.contains("selected")) {
                container.classList.remove("selected", "red")
                selectedFilms.delete(film.filmId)
            } else {
                container.classList.add("selected")
                container.addEventListener("mouseleave", onmouseleaveEvent)
                selectedFilms.add(film.filmId)
            }
            updateSelectedFilmsCounter()
        })

        return container
    }

    function displayImages() {
        const filmGrid = document.getElementById("film-grid")
        // Clear previous images
        filmGrid.innerHTML = ""

        // get current batch images
        const start = currentBatchIndexPos * batchSize
        const end = Math.min(start + batchSize, weightedData.length)
        const batchFilms = weightedData.slice(start, end)

        batchFilms.forEach((film) => {
            const imageElement = createImageElement(film)
            filmGrid.appendChild(imageElement)
        })

        updateUi(batchFilms.length)
    }

    function updateUi(currentBatchLength) {
        const buttonContainers = document.querySelectorAll(".button-container")
        const noPostersElement = document.getElementById("no-posters")
        const prevButton = document.querySelectorAll("#prev-button-top, #prev-button-bottom")
        const nextButton = document.querySelectorAll("#next-button-top, #next-button-bottom")

        if (currentBatchLength) {
            buttonContainers.forEach((container) => {
                container.classList.remove("hidden")
            })
            noPostersElement.classList.add("hidden")
        } else {
            buttonContainers.forEach((container) => {
                container.classList.add("hidden")
            })
            noPostersElement.classList.remove("hidden")
        }

        // Show/hide previous/next button's state
        prevButton.forEach((btn) => {
            if (currentBatchIndexPos === 0 || !currentBatchLength) {
                btn.classList.add("visibility-hidden")
            } else {
                btn.classList.remove("visibility-hidden")
            }
        })
        nextButton.forEach((btn) => {
            if ((currentBatchIndexPos + 1) * batchSize >= weightedData.length || !currentBatchLength) {
                btn.classList.add("visibility-hidden")
            } else {
                btn.classList.remove("visibility-hidden")
            }
        })

        // Update page indicator
        const currentPage = currentBatchIndexPos + 1
        const totalPages = Math.ceil(weightedData.length / batchSize)
        document.getElementById("page-number").value = currentPage
        changePageNumberFieldLength(currentPage)
        document.getElementById("total-page-number").textContent = `/${totalPages} pages`
    }

    ////////// handles previous/next button //////////

    function handleNavigation(direction) {
        currentBatchIndexPos += direction
        displayImages()
        window.scrollTo(0, 0)
    }

    document.querySelectorAll("#next-button-top, #next-button-bottom").forEach((button) => {
        button.addEventListener("click", () => handleNavigation(1))
    })

    document.querySelectorAll("#prev-button-top, #prev-button-bottom").forEach((button) => {
        button.addEventListener("click", () => handleNavigation(-1))
    })

    ////////// handles previous/next button //////////

    ////////// handles menu and filtering //////////

    function filterImages(type) {
        currentUnfilteredBatchIndexPos = currentBatchIndexPos
        if (type === "selected") {
            const selectedFilmsArray = Array.from(selectedFilms)
            weightedData = weightedData.filter((film) => selectedFilmsArray.includes(film.filmId))
        } else if (type === "unselected") {
            const selectedFilmsArray = Array.from(selectedFilms)
            weightedData = weightedData.filter((film) => !selectedFilmsArray.includes(film.filmId))
        }
        currentBatchIndexPos = 0
        displayImages()
        updateSelectedFilmsCounter()
    }

    function resetFilters() {
        weightedData = originalWeightedData.slice()
        currentBatchIndexPos = currentUnfilteredBatchIndexPos
        displayImages()
        updateSelectedFilmsCounter()
    }

    function handleOptionClick(optionId, callbackOn, callbackOff, callback) {
        document.getElementById(optionId).addEventListener("click", (event) => {
            toggleMenu()

            if (!event.target.classList.contains("menu-option-selected") && callbackOn) {
                callbackOn(...arguments)
                event.target.classList.add("menu-option-selected")
            } else if (event.target.classList.contains("menu-option-selected") && callbackOff) {
                callbackOff(...arguments)
                event.target.classList.remove("menu-option-selected")
            }
            if (callback) callback(...arguments)
        })
    }

    function toggleMenu() {
        const menuOptions = document.getElementById("menu-options")
        menuOptions.classList.toggle("hidden")

        const overlay = document.getElementById("overlay")
        overlay.classList.toggle("hidden")

        document.body.classList.toggle("no-scroll")
    }

    document.getElementById("menu-icon").addEventListener("click", toggleMenu)
    document.getElementById("overlay").addEventListener("click", toggleMenu)

    handleOptionClick(
        "option-1",
        () => filterImages("selected"),
        () => resetFilters(),
        () => document.getElementById("option-2").classList.toggle("hidden")
    )
    handleOptionClick(
        "option-2",
        () => filterImages("unselected"),
        () => resetFilters(),
        () => document.getElementById("option-1").classList.toggle("hidden")
    )

    ////////// handles menu and filtering //////////

    ////////// handles page number input //////////

    function changePageNumberFieldLength(event) {
        if (typeof event === "object") {
            const inputLength = event.target.value?.length
            if (inputLength) {
                event.target.style.width = `${inputLength}ch`
            }
        } else if (typeof event === "number") {
            document.getElementById("page-number").style.width = `${String(event).length}ch`
        }
    }

    document.getElementById("page-number").oninput = (event) => {
        event.target.value = event.target.value.replace(/[^0-9]/g, "")
        changePageNumberFieldLength(event)
    }

    document.getElementById("page-indicator").addEventListener("click", () => {
        const pageNumberInput = document.getElementById("page-number")
        pageNumberInput.focus()
        pageNumberInput.setSelectionRange(-1, -1)
        pageNumberInput.select()
    })

    function jumpToPage(event) {
        const totalPages = Math.ceil(weightedData.length / batchSize)
        const pageNumber = parseInt(event.target.value, 10)

        if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentBatchIndexPos + 1) {
            currentBatchIndexPos = pageNumber - 1
            displayImages()
            window.scrollTo(0, 0)
        } else {
            event.target.value = currentBatchIndexPos + 1 // Reset to current page if invalid
            changePageNumberFieldLength(event)
        }

        event.target.blur()
    }

    document.getElementById("page-number").onchange = jumpToPage

    ////////// handles page number input //////////

    ////////// handles user selection //////////

    document.addEventListener("DOMContentLoaded", () => {
        let isSelecting = false
        let startX, startY
        let selectedElements = new Set()
        let filmItems = []
        let animationFrameId

        const selectionBox = document.createElement("div")
        selectionBox.style.position = "absolute"
        selectionBox.style.border = "2px dashed #3498db"
        selectionBox.style.backgroundColor = "rgba(52, 152, 219, 0.2)"
        selectionBox.style.pointerEvents = "none"
        selectionBox.style.display = "none"
        selectionBox.style.zIndex = "3"
        document.body.appendChild(selectionBox)

        // Utility to update selected items based on selection box dimensions
        const updateSelectedItems = () => {
            const boxRect = selectionBox.getBoundingClientRect()

            for (const item of filmItems) {
                const itemRect = item.getBoundingClientRect()
                const isIntersecting =
                    itemRect.left < boxRect.right && itemRect.right > boxRect.left && itemRect.top < boxRect.bottom && itemRect.bottom > boxRect.top

                if (isIntersecting && !selectedElements.has(item)) {
                    selectedElements.add(item)
                    item.classList.add("selected")
                    item.addEventListener("mouseleave", onmouseleaveEvent)
                } else if (!isIntersecting && selectedElements.has(item)) {
                    selectedElements.delete(item)
                    item.classList.remove("selected")
                }
            }
        }

        document.addEventListener("mousedown", (e) => {
            if (e.target.closest(".film-item") || isSelecting) return

            isSelecting = true
            startX = e.pageX
            startY = e.pageY
            selectedElements.clear()

            // Cache all .film-item elements on mousedown
            filmItems = Array.from(document.querySelectorAll("#film-grid .film-item:not(.selected)"))

            selectionBox.style.left = `${startX}px`
            selectionBox.style.top = `${startY}px`
            selectionBox.style.width = "0px"
            selectionBox.style.height = "0px"
            selectionBox.style.display = "block"
        })

        document.addEventListener("mousemove", (e) => {
            if (!isSelecting) return

            // Throttle the intersection check to the next animation frame
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
            }

            animationFrameId = requestAnimationFrame(() => {
                const currentX = e.pageX
                const currentY = e.pageY

                selectionBox.style.left = `${Math.min(startX, currentX)}px`
                selectionBox.style.top = `${Math.min(startY, currentY)}px`
                selectionBox.style.width = `${Math.abs(currentX - startX)}px`
                selectionBox.style.height = `${Math.abs(currentY - startY)}px`

                // Update selected items based on the current selection box position
                updateSelectedItems()
            })
        })

        document.addEventListener("mouseup", () => {
            if (!isSelecting) return

            isSelecting = false
            selectionBox.style.display = "none"

            // Cancel any pending animation frame
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
            }

            // Final selected elements list
            for (const item of Array.from(selectedElements)) {
                selectedFilms.add(item.dataset.id)
            }

            updateSelectedFilmsCounter()
        })
    })

    ////////// handles user selection //////////

    // Main
    window.start = async (data) => {
        ;[letterboxdPath, weightedData] = data
        // Save a copy of the original data
        originalWeightedData = weightedData.slice()
        displayImages()
        updateSelectedFilmsCounter()

        return new Promise((resolve) => {
            document.querySelector(".submit-button").addEventListener("click", () => {
                const selectedArray = Array.from(selectedFilms).map((filmId) => {
                    const film = originalWeightedData.find((film) => film.filmId === filmId)
                    console.log("film", film)
                    return film
                })

                resolve(selectedArray)
            })
        })
    }
})()
