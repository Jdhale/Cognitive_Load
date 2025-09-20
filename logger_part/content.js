// content.js

let logData = {
    scrollDepth: 0,
    hoverCount: 0,
    clickCount: 0,
    timeOnPage: 0,
    confusionScore: 0
};
let startTime = Date.now();
let confusionAlertSent = false;

chrome.runtime.sendMessage({
    type: "USER_LOG",
    log: logData
});

const handleScroll = () => {
    let scrolled = window.scrollY + window.innerHeight;
    let totalHeight = document.body.scrollHeight;
    logData.scrollDepth = Math.max(logData.scrollDepth, (scrolled / totalHeight) * 100);
};

const handleMouseover = () => {
    logData.hoverCount++;
};

const handleClick = () => {
    logData.clickCount++;
};

window.addEventListener("scroll", handleScroll);
document.addEventListener("mouseover", handleMouseover);
document.addEventListener("click", handleClick);

const logInterval = setInterval(() => {
    logData.timeOnPage = Math.floor((Date.now() - startTime) / 1000);
    chrome.runtime.sendMessage({
        type: "USER_LOG",
        log: logData
    });
    if (logData.timeOnPage > 60 && logData.scrollDepth < 20 && !confusionAlertSent) { 
        chrome.runtime.sendMessage({
            type: "CONFUSION_ALERT"
        });
        confusionAlertSent = true;
    }
}, 5000);

window.addEventListener("beforeunload", () => {
    clearInterval(logInterval);
    window.removeEventListener("scroll", handleScroll);
    document.removeEventListener("mouseover", handleMouseover);
    document.removeEventListener("click", handleClick);
    chrome.runtime.sendMessage({
        type: "USER_LOG",
        log: logData
    });
});

function summarizeText(text) {
    const sentences = text.match(/[^.!?]+[.!?]/g) || [];
    if (sentences.length <= 1) return text;
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'am', 'are', 'was', 'were', 'be', 'of', 'in', 'at', 'on', 'with', 'for', 'from', 'to', 'as', 'it', 'its', 'he', 'she', 'they', 'you', 'i', 'we', 'my', 'your', 'his', 'her', 'their', 'our']);
    const wordFrequency = {};
    words.forEach(word => {
        if (!stopWords.has(word)) {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
    });
    const sentenceScores = {};
    sentences.forEach((sentence, index) => {
        const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
        let score = 0;
        sentenceWords.forEach(word => {
            if (wordFrequency[word]) {
                score += wordFrequency[word];
            }
        });
        sentenceScores[index] = score;
    });
    const sortedSentences = Object.keys(sentenceScores).sort((a, b) => sentenceScores[b] - sentenceScores[a]);
    const summarySentences = sortedSentences.slice(0, Math.min(3, sentences.length));
    summarySentences.sort((a, b) => a - b);
    const summary = summarySentences.map(index => sentences[index]).join(' ');
    return summary.trim();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SUMMARIZE_THIS") {
        const text = message.text;
        const summary = summarizeText(text);
        chrome.runtime.sendMessage({
            type: "SUMMARIZE_RESPONSE",
            summary: summary
        });
    }
});