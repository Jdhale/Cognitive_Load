// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "USER_LOG") {
        let log = message.log;
        let confusionScore = 0;
        
        if (log.hoverCount > 100 && log.scrollDepth < 30) confusionScore += 2;
        if (log.scrollDepth > 90 && log.timeOnPage < 30) confusionScore += 2;
        if (log.clickCount > 50) confusionScore += 1;

        log.confusionScore = confusionScore;
        chrome.storage.local.set({ userLog: log });
        
        if (log.confusionScore >= 3) {
            chrome.notifications.create({
                type: "basic",
                iconUrl: "images/icon48.png",
                title: "Cognitive Load Engine",
                message: "It looks like you're struggling. Try scanning the headings to find what you're looking for.",
                priority: 2
            });
        }
    }

    if (message.type === "SUMMARIZE_REQUEST") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: "SUMMARIZE_THIS",
                    text: message.text
                });
            }
        });
    }

    if (message.type === "USER_FEEDBACK") {
        console.log("User feedback received:", message.feedback);
        chrome.notifications.create({
            type: "basic",
            iconUrl: "images/icon48.png",
            title: "Thank You!",
            message: "Your feedback has been received.",
            priority: 1
        });
    }
    
    // This is the crucial fix for summarization
    if (message.type === "SUMMARIZE_RESPONSE") {
        chrome.runtime.sendMessage(message);
    }
});