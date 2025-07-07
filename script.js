const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const newChatButton = document.getElementById("new-chat-button");
const chatMessages = document.querySelector(".chat-messages");
const chatList = document.getElementById("chat-list");

const apiKey = "your-api-key-here";
let conversationHistory = [];
let chats = [];
let currentChatIndex = null;

sendButton.addEventListener("click", sendMessage);
newChatButton.addEventListener("click", startNewChat);
messageInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

function startNewChat() {
  if (conversationHistory.length > 0) {
    const chatName = `Chat ${chats.length + 1}`;
    chats.push({ name: chatName, history: conversationHistory });
    updateChatList();
  }
  chatMessages.innerHTML = "";
  conversationHistory = [];
  currentChatIndex = null;
}

function updateChatList() {
  chatList.innerHTML = "";
  chats.forEach((chat, idx) => {
    const li = document.createElement("li");

    const avatar = document.createElement("div");
    avatar.className = "chat-avatar";
    avatar.textContent = chat.name[0] || "C";
    li.appendChild(avatar);
    const span = document.createElement("span");
    span.textContent = chat.name;
    li.appendChild(span);
    li.className = idx === currentChatIndex ? "active" : "";
    li.onclick = () => loadChat(idx);
    chatList.appendChild(li);
  });
}

function loadChat(idx) {
  currentChatIndex = idx;
  conversationHistory = [...chats[idx].history];
  chatMessages.innerHTML = "";
  conversationHistory.forEach((msg) => {
    if (msg.role === "user") addMessage(msg.content, "user-message");
    else if (msg.role === "assistant") addMessage(msg.content, "bot-message");
  });
  updateChatList();
}

const systemPrompt = {
  role: "system",
  content:
    "You are an AI assistant. Always respect the user's formatting instructions. If they request a specific number of lines (like 2 lines), reply with exactly that number. Avoid extra explanations.",
};

async function sendMessage() {
  const messageText = messageInput.value.trim();
  if (messageText !== "") {
    addMessage(messageText, "user-message");
    messageInput.value = "";

    let prompt = messageText;
    const match = messageText.match(
      /(شرح|explain|describe|summarize|define|عرف|ملخص|ملخص ل|شرح ل|explanation).*?(\d+)\s*(lines|سطر|سطور|أسطر|جمل|sentences|only)/i
    );
    if (match) {
      const lines = match[2];
      // prompt += `\n(Answer in exactly ${lines} lines. Each line must be short and clear.)`;
      prompt = `You are an AI assistant. Your answer MUST be in exactly ${lines} lines. No more, no less. Any extra line is a mistake.\nUser: ${messageText}\nAI:`;
    }

    const currentPrompt = { role: "user", content: prompt };
    conversationHistory.push(currentPrompt);
    showTypingIndicator();

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [systemPrompt, ...conversationHistory],
          }),
        }
      );

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const botResponse = data.choices[0].message.content;
      addMessage(botResponse, "bot-message");
      conversationHistory.push({ role: "assistant", content: botResponse });
    } catch (error) {
      console.error("Error:", error);
      addMessage("Sorry, something went wrong.", "bot-message");
    } finally {
      hideTypingIndicator();
    }
  }
}

function addMessage(text, className) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", className);

  const messageContent = document.createElement("div");
  messageContent.classList.add("message-content");
  messageContent.textContent = text;

  const timestamp = document.createElement("div");
  timestamp.classList.add("timestamp");
  const now = new Date();
  timestamp.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageElement.appendChild(messageContent);
  messageElement.appendChild(timestamp);
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
  const typingIndicator = document.createElement("div");
  typingIndicator.classList.add("message", "bot-message", "typing-indicator");
  typingIndicator.innerHTML = "<span></span><span></span><span></span>";
  chatMessages.appendChild(typingIndicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
  const typingIndicator = document.querySelector(".typing-indicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}
