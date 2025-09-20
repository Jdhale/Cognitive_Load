// popup.js

document.addEventListener("DOMContentLoaded", () => {
    const timeOnPageEl = document.getElementById("time-on-page");
    const scrollDepthEl = document.getElementById("scroll-depth");
    const hoverCountEl = document.getElementById("hover-count");
    const clickCountEl = document.getElementById("click-count");
    const confusionScoreEl = document.getElementById("confusion-score");
    const helpMessageEl = document.getElementById("help-message");
    const ctx = document.getElementById('myChart').getContext('2d');
    let myChart;

    const summarizeBtn = document.getElementById("process-summary-btn");
    const downloadLogsBtn = document.getElementById("download-logs-btn");
    const feedbackBtn = document.getElementById("feedback-btn");
    
    const textToSummarize = document.getElementById("text-to-summarize");
    const summarizedOutput = document.getElementById("summarized-output");

    // Display initial log data
    chrome.storage.local.get("userLog", (data) => {
        const log = data.userLog || { scrollDepth: 0, hoverCount: 0, clickCount: 0, timeOnPage: 0, confusionScore: 0 };
        updatePopupUI(log);
        updateChart(log);
    });

    // Listen for summarization response from background.js
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "SUMMARIZE_RESPONSE") {
            summarizedOutput.textContent = message.summary;
        }
    });

    function updatePopupUI(log) {
        timeOnPageEl.textContent = `${log.timeOnPage}s`;
        scrollDepthEl.textContent = `${log.scrollDepth.toFixed(1)}%`;
        hoverCountEl.textContent = log.hoverCount;
        clickCountEl.textContent = log.clickCount;
        confusionScoreEl.textContent = log.confusionScore;
        if (log.confusionScore >= 2) {
            helpMessageEl.style.display = 'block';
            helpMessageEl.innerHTML = `<strong>Need help?</strong> It looks like you might be confused.`;
        } else {
            helpMessageEl.style.display = 'none';
        }
    }

    function updateChart(log) {
        const data = [log.timeOnPage, log.scrollDepth.toFixed(1), log.hoverCount, log.clickCount];
        if (myChart) {
            myChart.data.datasets[0].data = data;
            myChart.update();
        } else {
            myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Time (s)', 'Scroll (%)', 'Hovers', 'Clicks'],
                    datasets: [{
                        label: 'User Activity',
                        data: data,
                        backgroundColor: [
                            'rgba(52, 152, 219, 0.5)',
                            'rgba(46, 204, 113, 0.5)',
                            'rgba(241, 196, 15, 0.5)',
                            'rgba(231, 76, 60, 0.5)'
                        ],
                        borderColor: [
                            'rgba(52, 152, 219, 1)',
                            'rgba(46, 204, 113, 1)',
                            'rgba(241, 196, 15, 1)',
                            'rgba(231, 76, 60, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }

    summarizeBtn.addEventListener("click", () => {
        if (textToSummarize.value.trim() === "") {
            summarizedOutput.textContent = "Please paste some text to summarize.";
            return;
        }
        chrome.runtime.sendMessage({
            type: "SUMMARIZE_REQUEST",
            text: textToSummarize.value
        });
    });

    downloadLogsBtn.addEventListener("click", () => {
        chrome.storage.local.get("userLog", (data) => {
            const log = data.userLog;
            if (log) {
                const logContent = `User Interaction Report
--------------------------------------
Time on Page: ${log.timeOnPage}s
Scroll Depth: ${log.scrollDepth.toFixed(1)}%
Hovers: ${log.hoverCount}
Clicks: ${log.clickCount}
Confusion Score: ${log.confusionScore}
--------------------------------------
This report was generated on ${new Date().toLocaleString()}.
`;
                const blob = new Blob([logContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cognitive_load_logs_${Date.now()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                alert("No log data to download.");
            }
        });
    });
    
    feedbackBtn.addEventListener("click", () => {
        const feedback = prompt("How easy was it to understand this page? (1-5)");
        if (feedback) {
            chrome.runtime.sendMessage({
                type: "USER_FEEDBACK",
                feedback: feedback
            });
        }
    });
});