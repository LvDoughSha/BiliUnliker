// content.js

let isProcessing = false; // Flag for video titles
let isProcessing2 = false; // Flag for video authors
const ignoredVideos = new Set(); // Track ignored videos

// Activate the hidden button to show the popover
const activateHiddenButton = (videoCard) => {
    const hiddenButton = videoCard.querySelector('.bili-video-card__info--no-interest');
    if (hiddenButton) {
        hiddenButton.style.display = 'block';
        const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true, cancelable: true, view: window });
        hiddenButton.dispatchEvent(mouseEnterEvent);
    }
};

// Wait for an element(video) to appear in the DOM
const waitForElement = (selector, timeout = 1000) => {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(interval);
                resolve(null);
            }
        }, 100);
    });
};

// Ignore a video or uploader
const ignore = async (videoCard, type) => {
    activateHiddenButton(videoCard);
    const popover = await waitForElement('.vui_popover.vui_popover-is-bottom-end');
    if (popover) {
        const ignoreItems = popover.querySelectorAll('.bili-video-card__info--no-interest-panel--item');
        if (ignoreItems) {
            switch (type) {
                case 'video':
                    ignoreItems[0].click();
                    break;
                case 'up':
                    ignoreItems[1].click();
                    break;
                // default:
                //     videoCard.remove();
            }
            ignoredVideos.add(videoCard);
        }
    }
};

// Check for matching keywords and perform ignore
const checkAndIgnore = (type, keyword_type, selector, process_flag) => {
    if (process_flag) return;
    process_flag = true;

    chrome.storage.local.get(keyword_type, (data) => {
        const keywords = data[keyword_type] || [];
        const videoCards = document.querySelectorAll('.bili-video-card__wrap');

        videoCards.forEach((videoCard) => {
            if (ignoredVideos.has(videoCard)) return;

            const element = videoCard.querySelector(selector);
            const text = element ? element.getAttribute('title').trim() : '';
            const keywordFound = keywords.some(keyword => 
                text.toLowerCase().includes(keyword.trim().toLowerCase()));

            if (keywordFound) {
                ignore(videoCard, type);
            }
        });
        process_flag = false;
    });
};

// Check for videos
const checkAndIgnoreVideo = () => {
    checkAndIgnore('video', 'title_keywords', '.bili-video-card__info--tit', isProcessing);
};

// Check for uploaders
const checkAndIgnoreUp = () => {
    checkAndIgnore('up', 'uploader_keywords', '.bili-video-card__info--author', isProcessing2);
};

// Debounce function
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const debouncedCheckAndIgnoreVideo = debounce(checkAndIgnoreVideo, 500);
const debouncedCheckAndIgnoreUp = debounce(checkAndIgnoreUp, 500);

// MutationObserver
const observer = new MutationObserver(() => {
    debouncedCheckAndIgnoreVideo();
    debouncedCheckAndIgnoreUp();
});

const videoContainer = document.querySelector('.bili-video-card__wrap');
if (videoContainer) {
    observer.observe(videoContainer.parentNode, { childList: true, subtree: true });
}

checkAndIgnoreVideo();
checkAndIgnoreUp();