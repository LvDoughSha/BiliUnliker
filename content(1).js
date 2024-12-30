// content(1).js
// This version leaves the popover (with ignore function) visible until new videos show up

let isProcessing = false; // Flag to prevent concurrent executions
const ignoredVideos = [];


// A hidden button is requied to be activated to tell the website
// to create a popover that contains ignore option for the specific video
const activateHiddenButton = (videoCard) => {
    const hiddenButton = videoCard.querySelector('.bili-video-card__info--no-interest');
    if (hiddenButton) {
        hiddenButton.style.display = 'block'; // Activate the hidden button
        const mouseEnterEvent = new MouseEvent('mouseenter', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        hiddenButton.dispatchEvent(mouseEnterEvent);
    }
};

const ignoreVideo = (videoCard) => {
    activateHiddenButton(videoCard); // Activate the hidden button
    // Find the popovers
    const popovers = document.querySelectorAll('.vui_popover.vui_popover-is-bottom-end');
    if (popovers.length > 0) {
        popovers.forEach((popover, index) => {
            const ignoreButton = popover.querySelector('.bili-video-card__info--no-interest-panel--item');
            if (ignoreButton) {
                setTimeout(() => {
                    ignoreButton.click(); // Simulate click to remove the video card
                    //console.log('Video ignored');
                }, index * 10); // Stagger clicks to avoid race conditions
            }
        });
    }
};

const checkAndIgnore = () => {
    if (isProcessing) return; // Prevent concurrent execution
    isProcessing = true; // Set flag to indicate processing

    chrome.storage.local.get('keywords', (data) => {
        const keywords = data.keywords || [];
        const videoCards = document.querySelectorAll('.bili-video-card__wrap');

        videoCards.forEach((videoCard) => {
            // Because the video card still exits after ignored
            // Check for ignored video to prevent repeated executions
            const ignored = ignoredVideos.includes(videoCard);
            if (ignored) { return; }

            const titleElement = videoCard.querySelector('.bili-video-card__info--tit');
            const title = titleElement ? titleElement.title : '';
            const keywordFound = keywords.some(keyword => title.includes(keyword));
            if (keywordFound) {
                ignoreVideo(videoCard);
                ignoredVideos.push(videoCard);  // Add current video to ignored list
            }
        });
        isProcessing = false; // Reset flag after processing
    });
};

// Debounce function to limit how often the function can be called
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
};

const debouncedCheckAndIgnore = debounce(checkAndIgnore, 100);

// Set up a global MutationObserver to watch for changes in the video container
const observer = new MutationObserver((mutationsList) => {
    // Call the debounced function on every relevant mutation
    debouncedCheckAndIgnore();
});

// Start observing the video container for changes
const videoContainer = document.querySelector('.bili-video-card__wrap'); // Replace with the actual selector for the video container
if (videoContainer) {
    observer.observe(videoContainer.parentNode, { childList: true, subtree: true }); // Observe the parent node to catch new video cards
}

checkAndIgnore(); // Initial check for keywords and video cards