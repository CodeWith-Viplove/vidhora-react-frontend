// This file is responsible for making API calls related to LexAI chat.

const base_url = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Helper to clean verbose prefixes / greetings from the LLM reply
// so the user only sees the actual legal answer in markdown.
const cleanReply = (raw) => {
  if (!raw || typeof raw !== "string") return raw;

  let text = raw.replace(/\r\n/g, "\n").trim();

  // 1) Find the "official" start of the answer if markers like "**Answer:**" or "Response:" exist.
  // We look for these markers early in the text.
  const AnswerMarkers = [
    /\*\*Answer\s*:\*\*/i,
    /\*\*Response\s*:\*\*/i,
    /Answer\s*:/i,
    /Response\s*:/i,
    /\*\*Providing Information Based on CONTEXT\s*:\*\*/i,
  ];

  let highestIndex = -1;
  let markerLength = 0;

  for (const marker of AnswerMarkers) {
    const match = text.match(marker);
    if (match && match.index < 400) { // Only if it appears in the intro
      if (highestIndex === -1 || match.index > highestIndex) {
        highestIndex = match.index;
        markerLength = match[0].length;
      }
    }
  }

  // If we found a marker, strip everything before and including it
  if (highestIndex !== -1) {
    text = text.slice(highestIndex + markerLength).trim();
  }

  // 2) Split into lines and filter out remaining introductory or meta sentences
  let lines = text.split("\n");
  const filteredLines = lines.map((line) => {
    let l = line.trim();
    const lower = l.toLowerCase();

    // Remove common LLM conversational filler/prefixes
    if (
      lower.startsWith("based on the context") ||
      lower.startsWith("using the context") ||
      lower.startsWith("using the **context**") ||
      lower.startsWith("according to the provided") ||
      lower.startsWith("i see that the user asked") ||
      lower.startsWith("hello!") ||
      lower.startsWith("as an ai") ||
      lower.startsWith("lexai response") ||
      lower.startsWith("lex ai response") ||
      lower.includes("i'm lexai") ||
      lower.includes("i'm vidhora")
    ) {
      return "";
    }

    return l;
  });

  text = filteredLines.join("\n").trim();

  // 3) Concluding Meta-Text Removal
  // We remove trailing context sections or helpful closings that user doesn't want.
  const concludingMarkers = [
    /\n\s*\*\*Providing Context\s*:\*\*/i,
    /\n\s*Providing Context\s*:/i,
    /\n\s*I hope this information is helpful/i,
    /\n\s*Please let me know if you have any further questions/i,
    /\n\s*Please consult with an attorney/i
  ];

  for (const marker of concludingMarkers) {
    const match = text.match(marker);
    if (match) {
      text = text.slice(0, match.index).trim();
    }
  }

  // 4) Final cleanup: 
  // - Convert setext headings "**Title**\n======" → "## Title"
  // - Strip trailing ** leaked at end of any line
  // - Remove leading stray * or **
  // - Remove redundant empty lines

  // Convert setext-style "**Title**\n======" into "## Title"
  text = text.replace(/\*\*(.+?)\*\*\s*\n[=\-]{2,}/g, (_, title) => `## ${title}`);

  // Strip trailing ** at the end of ANY line (global + multiline)
  text = text.replace(/\*{1,2}\s*$/gm, "");

  // Strip leading stray * or **
  text = text.replace(/^(\*\*|\*)\s*\n*/, "");
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return text;
};

// Chat API: send message (and optional PDF file) to RAG chat backend
// Endpoint: POST /api/chat/
// Payload: multipart/form-data with fields:
//   - message (string, required)
//   - file (PDF file, optional)
// Returns: reply text from backend (may contain markdown)
export const sendChat = async ({ message, file, userId, sessionId }) => {
  if (!message && !file) {
    throw new Error("Message or file is required");
  }

  const formData = new FormData();

  if (message) {
    formData.append("message", message);
  }

  if (file) {
    formData.append("file", file);
  }

  if (userId) {
    formData.append("userId", userId);
  }

  if (sessionId) {
    formData.append("sessionId", sessionId);
  }

  const authToken = localStorage.getItem("authToken");

  const response = await fetch(`${base_url}/api/chat/`, {
    method: "POST",
    headers: {
      "Authorization": authToken ? `Bearer ${authToken}` : "",
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Chat request failed");
  }

  if (typeof data.reply === "string") {
    return {
      ...data,
      reply: cleanReply(data.reply)
    };
  }

  throw new Error("Invalid response from chat server");
};

export const fetchChatHistory = async (userId) => {
  const authToken = localStorage.getItem("authToken");
  const response = await fetch(`${base_url}/api/chat/history/${userId}`, {
    method: "GET",
    headers: {
      "Authorization": authToken ? `Bearer ${authToken}` : "",
    },
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Failed to fetch chat history");
  }

  return data;
};

// Chat API: get law question suggestions
// Endpoint: GET /api/chat/lawQuestionSuggestion
// Returns: array of suggestion strings (split from backend "questions" field)
export const getLawQuestionSuggestions = async () => {
  const response = await fetch(`${base_url}/api/chat/lawQuestionSuggestion`, {
    method: "GET",
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Failed to fetch suggestions");
  }

  if (typeof data.questions === "string") {
    // Backend returns a single string with 5 questions, often newline separated
    return data.questions
      .split(/\r?\n/)
      .map((q) => q.trim())
      .filter(Boolean);
  }

  return [];
};