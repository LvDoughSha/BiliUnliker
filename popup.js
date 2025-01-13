/**
 * Event listener for DOMContentLoaded event.
 * Sets up the keyword management functionality for the extension's popup.
 * This includes loading saved keywords, saving new keywords, and deleting existing keywords.
 * 
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    const keywordInput = document.getElementById('keywordInput');
    const saveKeywordsButton = document.getElementById('saveKeywords');
    const keywordList = document.getElementById('keywordList');

    const deleteAll = document.getElementById('deleteAll');
    const deleteAll2 = document.getElementById('deleteAll2');

    const keywordInput2 = document.getElementById('keywordInput2');
    const saveKeywordsButton2 = document.getElementById('saveKeywords2');
    const keywordList2 = document.getElementById('keywordList2');

    // For locale
    document.title = chrome.i18n.getMessage("extension_name");
    document.querySelector('h1').textContent = chrome.i18n.getMessage("popup_titles");
    document.querySelector('#keywordInput').placeholder = chrome.i18n.getMessage("enter_keywords");
    document.querySelector('#saveKeywords').textContent = chrome.i18n.getMessage("save_keywords");
    document.querySelector('h2').textContent = chrome.i18n.getMessage("title_keywords");

    document.querySelector('#deleteAll').textContent = chrome.i18n.getMessage("delete_all");
    document.querySelector('#deleteAll2').textContent = chrome.i18n.getMessage("delete_all");

    document.querySelector('#keywordInput2').placeholder = chrome.i18n.getMessage("enter_keywords");
    document.querySelector('#saveKeywords2').textContent = chrome.i18n.getMessage("save_keywords");
    document.querySelector('h3').textContent = chrome.i18n.getMessage("uploader_keywords");

    /**
     * Load and display saved keywords from chrome.storage.local.
     * Create DOM elements for each keyword and attach delete event listeners.
     * 
     * @param {string} storageKey - The key used to store the keywords in chrome.storage.local.
     * @param {HTMLElement} listElement - The DOM element where the keywords will be displayed.
     */
    const loadKeywords = (storageKey, listElement) => {
        chrome.storage.local.get(storageKey, (data) => {
            const keywords = data[storageKey] || [];
            listElement.innerHTML = ''; // Clear the list before displaying
            keywords.forEach(keyword => {
                const keywordItem = document.createElement('div');
                keywordItem.className = 'keywordItem';
                keywordItem.innerHTML = `
                    <span>${keyword}</span>
                    <button class="deleteButton">${chrome.i18n.getMessage("delete")}</button>
                `;
                listElement.appendChild(keywordItem);

                // Add event listener for delete button
                keywordItem.querySelector('.deleteButton').addEventListener('click', () => {
                    deleteKeyword(storageKey, keyword);
                });
            });
        });
    };
    // Save keywords
    const saveKeywords = (storageKey, inputValue, listElement) => {
        // Split the input string into keywords, trim whitespace, and filter out empty strings
        const newKeywords = inputValue.value.split(',').map(k => k.trim()).filter(k => k);

        chrome.storage.local.get(storageKey, (data) => {
            const existingKeywords = data[storageKey] || [];
            const allKeywords = Array.from(new Set([...existingKeywords, ...newKeywords])); // Combine and remove duplicates
            chrome.storage.local.set({ [storageKey]: allKeywords }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error saving keywords:', chrome.runtime.lastError);
                    alert('Failed to save keywords. Please try again.');
                } else {
                    loadKeywords(storageKey, listElement); // Reload keywords after saving
                    inputValue.value = ''; // Clear the input field
                }
            });
        });
    };
    /**
     * Delete a specific keyword from chrome.storage.local.
     * 
     * @param {string} storageKey - The key used to store the keywords in chrome.storage.local.
     * @param {string} keywordToDelete - The keyword to be deleted from storage.
     */
    const deleteKeyword = (storageKey, keywordToDelete) => {
        chrome.storage.local.get(storageKey, (data) => {
            const existingKeywords = data[storageKey] || [];
            const updatedKeywords = existingKeywords.filter(keyword => keyword !== keywordToDelete);
            chrome.storage.local.set({ [storageKey]: updatedKeywords }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error deleting keyword:', chrome.runtime.lastError);
                    alert('Failed to delete keyword. Please try again.');
                } else {
                    loadKeywords(storageKey, storageKey === 'title_keywords' ? keywordList : keywordList2); // Reload keywords after deletion
                }
            });
        });
    };
    /**
     * Delete all keywords for a specific storage key.
     * 
     * @param {string} storageKey - The key used to store the keywords in chrome.storage.local.
     * @param {HTMLElement} listElement - The DOM element where the keywords are displayed.
     */
    const deleteAllKeywords = (storageKey, listElement) => {
        chrome.storage.local.set({ [storageKey]: [] }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error deleting all keywords:', chrome.runtime.lastError);
                alert('Failed to delete all keywords. Please try again.');
            } else {
                loadKeywords(storageKey, listElement); // Reload the empty list
            }
        });
    };
    // Load both sets of keywords on popup open
    loadKeywords('title_keywords', keywordList);
    loadKeywords('uploader_keywords', keywordList2);

    saveKeywordsButton.addEventListener('click', () => {
        saveKeywords('title_keywords', keywordInput, keywordList)
    });
    saveKeywordsButton2.addEventListener('click', () => {
        saveKeywords('uploader_keywords', keywordInput2, keywordList2)
    });

    deleteAll.addEventListener('click', () => {
        if (confirm(chrome.i18n.getMessage("deleting_all"))) {
            deleteAllKeywords('title_keywords', keywordList);
        }
    });
    deleteAll2.addEventListener('click', () => {
        if (confirm(chrome.i18n.getMessage("deleting_all"))) {
            deleteAllKeywords('uploader_keywords', keywordList2);
        }
    });
});
