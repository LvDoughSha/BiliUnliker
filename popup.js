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

    // For locale
    document.title = chrome.i18n.getMessage("extension_name");
    document.querySelector('h1').textContent = chrome.i18n.getMessage("popup_titles");
    document.querySelector('#keywordInput').placeholder = chrome.i18n.getMessage("enter_keywords");
    document.querySelector('#saveKeywords').textContent = chrome.i18n.getMessage("save_keywords");
    document.querySelector('h2').textContent = chrome.i18n.getMessage("keywords");

    /**
     * Loads and displays saved keywords from chrome.storage.local.
     * Creates DOM elements for each keyword and attaches delete event listeners.
     */
    const loadKeywords = () => {
        chrome.storage.local.get('keywords', (data) => {
            const keywords = data.keywords || [];
            keywordList.innerHTML = ''; // Clear the list before displaying
            keywords.forEach(keyword => {
                const keywordItem = document.createElement('div');
                keywordItem.className = 'keywordItem';
                keywordItem.innerHTML = `
                    <span>${keyword}</span>
                    <button class="deleteButton">${chrome.i18n.getMessage("delete")}</button>
                `;
                keywordList.appendChild(keywordItem);

                // Add event listener for delete button
                keywordItem.querySelector('.deleteButton').addEventListener('click', () => {
                    deleteKeyword(keyword);
                });
            });
        });
    };

    loadKeywords(); // Load keywords on popup open

    // Save keywords
    saveKeywordsButton.addEventListener('click', () => {
        const newKeywords = keywordInput.value.split(',').map(k => k.trim()).filter(k => k);
        chrome.storage.local.get('keywords', (data) => {
            const existingKeywords = data.keywords || [];
            const allKeywords = Array.from(new Set([...existingKeywords, ...newKeywords])); // Combine and remove duplicates
            chrome.storage.local.set({ keywords: allKeywords }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error saving keywords:', chrome.runtime.lastError);
                    alert('Failed to save keywords. Please try again.');
                } else {
                    loadKeywords(); // Reload keywords after saving
                    keywordInput.value = ''; // Clear the input field
                }
            });
        });
    });

    /**
     * Deletes a specific keyword from chrome.storage.local.
     * 
     * @param {string} keywordToDelete - The keyword to be deleted from storage.
     */
    const deleteKeyword = (keywordToDelete) => {
        chrome.storage.local.get('keywords', (data) => {
            const existingKeywords = data.keywords || [];
            const updatedKeywords = existingKeywords.filter(keyword => keyword !== keywordToDelete);
            chrome.storage.local.set({ keywords: updatedKeywords }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error deleting keyword:', chrome.runtime.lastError);
                    alert('Failed to delete keyword. Please try again.');
                } else {
                    loadKeywords(); // Reload keywords after deletion
                }
            });
        });
    };
});

