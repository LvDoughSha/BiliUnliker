// content.js

let isProcessing = false; // Flag to prevent concurrent executions
//const removedVideos = [];

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

const removeVideoCards = (videoCard) => {
    activateHiddenButton(videoCard); // Activate the hidden button
    const popovers = document.querySelectorAll('.vui_popover.vui_popover-is-bottom-end');
    if (popovers.length > 0) {
        popovers.forEach((popover, index) => {
            const ignoreButton = popover.querySelector('.bili-video-card__info--no-interest-panel--item');
            if (ignoreButton) {
                setTimeout(() => {
                    ignoreButton.click(); // Simulate click to remove the video card
                    //console.log('Video card removed');
                }, index * 10); // Stagger clicks to avoid race conditions
            }
        });
    }
};

const checkKeywordsAndCollect = () => {
    if (isProcessing) return; // Prevent concurrent execution
    isProcessing = true; // Set flag to indicate processing

    chrome.storage.local.get('keywords', (data) => {
        const keywords = data.keywords || [];
        const videoCards = document.querySelectorAll('.bili-video-card__wrap');

        videoCards.forEach((videoCard) => {
            const titleElement = videoCard.querySelector('.bili-video-card__info--tit');
            const title = titleElement ? titleElement.title : '';

            const keywordFound = keywords.some(keyword => title.includes(keyword));
            //const removed = removedVideos.includes(title);
            //if (keywordFound && !removed) {
            if (keywordFound) {
                //console.log("Collecting video card for removal:", title);
                //activateHiddenButton(videoCard); // Activate the hidden button
                removeVideoCards(videoCard);
                //removedVideos.push(title);
            }
        });
        //removeVideoCards();
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

const debouncedCheckKeywordsAndCollect = debounce(checkKeywordsAndCollect, 100);

// Set up a global MutationObserver to watch for changes in the video container
const observer = new MutationObserver((mutationsList) => {
    // Call the debounced function on every relevant mutation
    debouncedCheckKeywordsAndCollect();
});

// Start observing the video container for changes
const videoContainer = document.querySelector('.bili-video-card__wrap'); // Replace with the actual selector for the video container
if (videoContainer) {
    observer.observe(videoContainer.parentNode, { childList: true, subtree: true }); // Observe the parent node to catch new video cards
}

checkKeywordsAndCollect(); // Initial check for keywords and video cards