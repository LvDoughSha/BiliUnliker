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

// Check for videos matching keywords
const checkAndIgnore = () => {
    if (isProcessing) return;
    isProcessing = true;

    chrome.storage.local.get('title_keywords', (data) => {
        const keywords = data.title_keywords || [];
        const videoCards = document.querySelectorAll('.bili-video-card__wrap');

        videoCards.forEach((videoCard) => {
            if (ignoredVideos.has(videoCard)) return;

            const titleElement = videoCard.querySelector('.bili-video-card__info--tit');
            const title = titleElement ? titleElement.title : '';
            const keywordFound = keywords.some(keyword => title.includes(keyword));

            if (keywordFound) {
                ignore(videoCard, 'video');
            }
        });
        isProcessing = false;
    });
};

// Check for uploaders matching keywords
const checkAndIgnoreUp = () => {
    if (isProcessing2) return;
    isProcessing2 = true;

    chrome.storage.local.get('uploader_keywords', (data) => {
        const keywords = data.uploader_keywords || [];
        const videoCards = document.querySelectorAll('.bili-video-card__wrap');

        videoCards.forEach((videoCard) => {
            if (ignoredVideos.has(videoCard)) return;

            const uploaderElement = videoCard.querySelector('.bili-video-card__info--author');
            const uploader = uploaderElement ? uploaderElement.getAttribute('title').trim() : '';
            const keywordFound = keywords.some(keyword => 
                uploader.toLowerCase().includes(keyword.trim().toLowerCase()));

            if (keywordFound) {
                ignore(videoCard, 'up');
            }
        });
        isProcessing2 = false;
    });
};

// Debounce function
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const debouncedCheckAndIgnore = debounce(checkAndIgnore, 500);
const debouncedCheckAndIgnoreUp = debounce(checkAndIgnoreUp, 500);

// MutationObserver
const observer = new MutationObserver(() => {
    debouncedCheckAndIgnore();
    debouncedCheckAndIgnoreUp();
});

const videoContainer = document.querySelector('.bili-video-card__wrap');
if (videoContainer) {
    observer.observe(videoContainer.parentNode, { childList: true, subtree: true });
}

checkAndIgnore();
checkAndIgnoreUp();