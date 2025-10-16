// ============================
//  GEMINI CHATBOT INJECTION (FIXED)
// ============================

// ⚠️ Replace with your Gemini API key
const GEMINI_API_KEY = "AIzaSyA3AVKvl0UtczVRUiPb5I9Hm9Tgaf5t0Pc";

// Create chatbot container dynamically
const chatbotContainer = document.createElement("div");
chatbotContainer.innerHTML = `
    <div id="chatbot-box">
        <div class="chat-header">
            <i class="fas fa-robot"></i>
            <span>Your Helper Buddy</span>
            <button id="close-chatbot">&times;</button>
        </div>
        <div class="chat-body" id="chat-body">
            <div class="bot-msg">👋 Hi! I'm your Assistant. How can I help you today?</div>
        </div>
        <div class="chat-footer">
            <input type="text" id="user-input" placeholder="Type a message...">
            <button id="send-btn"><i class="fas fa-paper-plane"></i></button>
        </div>
    </div>
`;

const style = document.createElement("style");
style.textContent = `
    #chatbot-box {
        position: fixed;
        bottom: 20px;
        right: 20px;
        height: 450px;
        width: 340px;
        background-color: #ffffff;
        border-radius: 14px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        overflow: hidden;
        font-family: 'Poppins', sans-serif;
        z-index: 999999;
        display: flex;
        flex-direction: column;
    }
    .chat-header {
        background: linear-gradient(90deg, #4a6cf7, #6f86ff);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 15px;
        font-weight: 600;
        letter-spacing: 0.5px;
    }
    #close-chatbot {
        background: transparent;
        border: none;
        color: #fff;
        font-size: 20px;
        cursor: pointer;
    }
    .chat-body {
        flex: 1;
        padding: 10px;
        overflow-y: auto;
        background-color: #f3f5f9;
        display: flex;
        flex-direction: column;
    }
    .chat-body::-webkit-scrollbar {
        width: 8px;
    }
    .chat-body::-webkit-scrollbar-thumb {
        background-color: #aab2f6;
        border-radius: 10px;
    }
    .chat-body::-webkit-scrollbar-thumb:hover {
        background-color: #4a6cf7;
    }
    .chat-footer {
        display: flex;
        border-top: 1px solid #ddd;
    }
    .chat-footer input {
        flex: 1;
        padding: 10px;
        border: none;
        outline: none;
        font-size: 14px;
        background-color: #1e1d1dff;
    }
    .chat-footer button {
        background-color: #4a6cf7;
        color: white;
        border: none;
        padding: 10px 15px;
        cursor: pointer;
        transition: 0.3s;
    }
    .chat-footer button:hover {
        background-color: #3d5fe0;
    }
    .bot-msg, .user-msg {
        padding: 8px 12px;
        border-radius: 15px;
        margin: 6px 0;
        max-width: 80%;
        line-height: 1.4;
        font-size: 14px;
        white-space: pre-wrap;
    }
    .bot-msg {
        background-color: #e0e6ff;
        color: #000;
        align-self: flex-start;
    }
    .user-msg {
        background-color: #4a6cf7;
        color: white;
        align-self: flex-end;
        margin-left: auto;
    }
`;
document.head.appendChild(style);
document.body.appendChild(chatbotContainer);

// Get elements
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const chatBody = document.getElementById("chat-body");
const closeBtn = document.getElementById("close-chatbot");

// Add message
function addMessage(msg, type) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add(type === "user" ? "user-msg" : "bot-msg");
    msgDiv.textContent = msg;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Gemini API Call
async function getGeminiReply(userMsg) {
    try {
        const pageText = document.body.innerText.slice(0, 2000);
        const contextPrompt = `
You are a helpful assistant on a webpage. 
You can see this content snippet:
"${pageText}"
The user said: "${userMsg}"
Respond clearly and naturally.
        `;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: contextPrompt }] }]
                })
            }
        );

        const data = await response.json();

        if (data?.candidates?.length) {
            return data.candidates[0].content.parts[0].text;
        } else if (data?.error) {
            console.error("API error:", data.error.message);
            return "⚠️ API Error: " + data.error.message;
        } else {
            console.warn("Unexpected response:", data);
            return "Sorry, I couldn't process that.";
        }

    } catch (err) {
        console.error("Chatbot Fetch Error:", err);
        return "⚠️ Failed to connect to the API.";
    }
}

// Send message handler
sendBtn.addEventListener("click", async () => {
    const userMsg = input.value.trim();
    if (!userMsg) return;
    addMessage(userMsg, "user");
    input.value = "";

    const thinkingMsg = document.createElement("div");
    thinkingMsg.classList.add("bot-msg");
    thinkingMsg.textContent = "Thinking...";
    chatBody.appendChild(thinkingMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    const reply = await getGeminiReply(userMsg);

    thinkingMsg.remove();
    addMessage(reply, "bot");
});

input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
});

closeBtn.addEventListener("click", () => {
    chatbotContainer.remove();
});
