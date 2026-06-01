import React, { useState, useRef, useEffect } from "react";
import {
  SendOutlined,
  PaperClipOutlined,
  UserOutlined,
  DeleteOutlined,
  HistoryOutlined,
  SolutionOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  DownOutlined,
  UpOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DashboardOutlined,
  CloseCircleOutlined
} from "@ant-design/icons";
import {
  Card,
  Input,
  Button,
  Avatar,
  Space,
  Typography,
  Upload,
  Tag,
  Row,
  Col,
  Divider,
  message,
  Drawer,
  List,
  Collapse,
  Spin,
  Skeleton,
  Tooltip,
  Badge,
  Progress,
  Popover
} from "antd";

const formatDateLabel = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffTime = Math.abs(todayDateOnly - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: "long" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const formatResetTime = (timeStr, type = "time") => {
  if (!timeStr) return "";
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    if (type === "time") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return timeStr;
  }
};

const formatTokenCount = (num) => {
  if (num === null || num === undefined) return "Unlimited";
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + "K";
  }
  return num.toString();
};

const parseTokenCount = (val) => {
  if (val === null || val === undefined) return null;
  let str = val.toString().replace(/,/g, '').trim().toUpperCase();
  let multiplier = 1;
  if (str.endsWith('K')) {
    multiplier = 1000;
    str = str.slice(0, -1);
  } else if (str.endsWith('M')) {
    multiplier = 1000000;
    str = str.slice(0, -1);
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? null : parsed * multiplier;
};

const renderEngineStatus = (modelQuota) => {
  if (!modelQuota) return null;
  
  const remaining = parseTokenCount(modelQuota.remaining?.tokens);
  const isLow = remaining !== null && remaining !== undefined && remaining < 1500;
  
  let statusBg = '#f0fdf4';
  let statusBorder = '#dcfce7';
  let statusIcon = <CheckCircleOutlined style={{ color: '#10b981', fontSize: '18px' }} />;
  let title = 'Systems Operational';
  let description = 'Service is healthy. Ready for your next query.';
  
  if (modelQuota.exhausted) {
    statusBg = '#fef2f2';
    statusBorder = '#fee2e2';
    statusIcon = <CloseCircleOutlined style={{ color: '#ef4444', fontSize: '18px' }} />;
    title = 'Daily Limit Reached';
    description = modelQuota.warningMessage || 'You have exhausted your daily limit. Please try again tomorrow.';
  } else if (isLow || modelQuota.quotaWarning) {
    statusBg = '#fffbeb';
    statusBorder = '#fef3c7';
    statusIcon = <WarningOutlined style={{ color: '#f59e0b', fontSize: '18px' }} />;
    title = 'Quota Running Low';
    description = isLow 
      ? `Token count is extremely low (${formatTokenCount(remaining)} left). Next request may be blocked.` 
      : (modelQuota.warningMessage || 'You are approaching your daily request limit.');
  } else if (!modelQuota.canMakeNextRequest) {
    statusBg = '#fff7ed';
    statusBorder = '#ffedd5';
    statusIcon = <WarningOutlined style={{ color: '#f97316', fontSize: '18px' }} />;
    title = 'Cooling Down';
    description = 'API rate limit exceeded. Please wait a moment before sending another query.';
  }

  return (
    <div 
      style={{
        borderRadius: '8px', 
        border: `1px solid ${statusBorder}`, 
        background: statusBg, 
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '4px',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
      }}
    >
      {statusIcon}
      <div style={{ fontWeight: 600, fontSize: '11px', color: '#1e293b' }}>
        {title}
      </div>
      <div style={{ fontSize: '9px', color: '#64748b', lineHeight: '1.4' }}>
        {description}
      </div>
    </div>
  );
};


import { Scale } from "lucide-react";
import { sendChat, getLawQuestionSuggestions, fetchChatHistory } from "../../api_services/chatAPI";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./LexChatbot.css";

const { Paragraph, Text, Title } = Typography;

const formatMarkdownText = (text) => {
  if (!text) return "";
  
  let formatted = text;
  
  // 1) Replace known section headers with clean markdown headings and proper spacing
  const headers = [
    "Brief Summary",
    "Facts",
    "Evidence Submitted",
    "Issues",
    "Reasoning",
    "Ruling",
    "Simplified Hindi"
  ];
  
  headers.forEach(header => {
    const regex = new RegExp(`(?:\\*\\*)?\\b${header}\\b(?:\\*\\*)?\\s*[:\\-]?\\s*`, 'gi');
    formatted = formatted.replace(regex, `\n\n### ${header}\n\n`);
  });
  
  // 2) Replace circular bullets (and other bullet chars) with a newline and markdown list item syntax (* )
  formatted = formatted.replace(/[\u25CF\u2022\u26AB\u26AA\u25E6]/g, "\n* ");
  
  // 3) Split the text by newline to clean up spacing and construct the final markdown
  const lines = formatted.split('\n');
  const processed = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      processed.push(line);
    }
  }
  
  // 4) Intelligently join lines: single newline for consecutive list items (for tight list style),
  // and double newlines for other blocks/paragraphs.
  let finalMarkdown = "";
  for (let i = 0; i < processed.length; i++) {
    const current = processed[i];
    const prev = i > 0 ? processed[i - 1] : "";
    
    if (i === 0) {
      finalMarkdown += current;
    } else {
      const isCurrentListItem = current.startsWith('*') || /^\d+\./.test(current);
      const isPrevListItem = prev.startsWith('*') || /^\d+\./.test(prev);
      
      if (isCurrentListItem && isPrevListItem) {
        finalMarkdown += "\n" + current;
      } else {
        finalMarkdown += "\n\n" + current;
      }
    }
  }
  
  return finalMarkdown.trim();
};

const DEFAULT_QUOTA = {
  quota: {
    limits: { perDay: 50, perMinute: 5 },
    used: { perDay: 0, perMinute: 0 },
    remaining: { perDay: 50, perMinute: 5 }
  },
  modelQuota: {
    provider: "gemini",
    model: "gemini-3.5-flash",
    exhausted: false,
    quotaWarning: false,
    canMakeNextRequest: true,
    limits: {
      requests: 50,
      tokens: 1000000,
      perMinute: 5,
      perDay: 50,
      tokensPerMinute: 1000000,
      tokensPerDay: 1000000
    },
    remaining: {
      requests: 50,
      tokens: 1000000
    }
  }
};

const LexChatbot = () => {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        return parsed.map(msg => {
          if (msg.sender === "user" && msg.text && msg.text.startsWith("📎 ")) {
            return {
              ...msg,
              text: msg.text.substring(2),
              isFile: true
            };
          }
          return msg;
        });
      } catch (e) {
        console.error("Error parsing saved messages", e);
      }
    }
    return [
      {
        text: "Hello! I'm VIDHORA your AI legal assistant. How can I help you today?",
        sender: "bot",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);
  const [inputText, setInputText] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [chatHistory, setChatHistory] = useState({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const chatHistoryRef = useRef(null);
  const [expandedQuotas, setExpandedQuotas] = useState({});
  const [lastKnownQuota, setLastKnownQuota] = useState(() => {
    try {
      const saved = localStorage.getItem("lastKnownQuota");
      return saved ? JSON.parse(saved) : DEFAULT_QUOTA;
    } catch (e) {
      return DEFAULT_QUOTA;
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lastKnownQuota");
      if (saved) {
        setLastKnownQuota(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);


  const toggleQuota = (index) => {
    setExpandedQuotas((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop =
        chatHistoryRef.current.scrollHeight;
    }
  }, [messages, isTyping, streamingText]);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.sender === "bot" && lastMsg.isStreaming) {
      const words = lastMsg.text.split(" ");
      let currentText = "";
      let wordIndex = 0;
      setStreamingText("");

      const interval = setInterval(() => {
        if (wordIndex < words.length) {
          currentText += (wordIndex > 0 ? " " : "") + words[wordIndex];
          setStreamingText(currentText);
          wordIndex++;
        } else {
          clearInterval(interval);
          setMessages((prev) => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], isStreaming: false };
            return newMsgs;
          });
        }
      }, 30); // 30ms per word

      return () => clearInterval(interval);
    }
  }, [messages.length]);

  const fetchSuggestions = async () => {
    if (localStorage.getItem("lex_chatbot_suggestions_hidden") === "true") {
      setSuggestions([]);
      return;
    }
    setIsLoadingSuggestions(true);
    try {
      const qs = await getLawQuestionSuggestions();
      setSuggestions(qs || []);
    } catch (error) {
      console.error("Failed to fetch law question suggestions", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleSendMessage = async (directMessage = null) => {
    const textToProcess = typeof directMessage === 'string' ? directMessage : inputText;
    
    if (!textToProcess.trim() && !attachedFile) return;
    if (isTyping) return; // avoid multiple sends while waiting for reply

    // Hide suggested questions once conversation starts and store in localStorage
    setSuggestions([]);
    localStorage.setItem("lex_chatbot_suggestions_hidden", "true");

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const messageToSend = textToProcess.trim();
    const fileToSend = attachedFile;

    const newUserMessages = [];

    if (fileToSend) {
      newUserMessages.push({
        text: messageToSend || "",
        isFile: true,
        fileName: fileToSend.name,
        sender: "user",
        time,
      });
    } else if (messageToSend) {
      newUserMessages.push({
        text: messageToSend,
        sender: "user",
        time,
      });
    }

    // Add user messages immediately
    setMessages((prev) => [...prev, ...newUserMessages]);
    setInputText("");
    setAttachedFile(null);
    setIsTyping(true);

    try {
      const userInfoStr = localStorage.getItem("userInfo");
      let userId = null;
      if (userInfoStr) {
        userId = JSON.parse(userInfoStr).id;
      } else {
        userId = localStorage.getItem("user_id");
      }

      const currentSessionId = localStorage.getItem("chatSessionId");

      const response = await sendChat({
        message: messageToSend || undefined,
        file: fileToSend || undefined,
        userId: userId,
        sessionId: currentSessionId
      });

      if (response.sessionId) {
        localStorage.setItem("chatSessionId", response.sessionId);
      }

      let cleanedReply = formatMarkdownText(response.reply || "No reply received from Vidhora.");

      setMessages((prev) => [
        ...prev,
        {
          text: cleanedReply,
          sender: "bot",
          isStreaming: true,
          bertScore: response.bertScore,
          hallucinationScore: response.hallucinationScore,
          confidence_score: response.hallucinationScore ? parseFloat(response.hallucinationScore) / 100 : null,
          type: response.intent || response.confidenceType,
          quota: response.quota,
          modelQuota: response.modelQuota,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      if (response.quota || response.modelQuota) {
        const quotaInfo = { quota: response.quota, modelQuota: response.modelQuota };
        setLastKnownQuota(quotaInfo);
        localStorage.setItem("lastKnownQuota", JSON.stringify(quotaInfo));
      }
    } catch (error) {
      console.error(error);
      message.error(error?.message || "Failed to get response from Vidhora");
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileChange = (info) => {
    const file = info.file.originFileObj || info.file;
    setAttachedFile(file);
    // Hide suggested questions on file upload
    setSuggestions([]);
    localStorage.setItem("lex_chatbot_suggestions_hidden", "true");
    message.success(`${file.name} attached`);
  };

  const handleClearChat = () => {
    localStorage.removeItem("chatSessionId");
    localStorage.removeItem("lex_chatbot_suggestions_hidden");
    setMessages([
      {
        text: "Hello! I'm VIDHORA your AI legal assistant. How can I help you today?",
        sender: "bot",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    fetchSuggestions();
    message.info("Chat cleared");
  };

  const showHistory = async () => {
    setIsHistoryVisible(true);
    setIsLoadingHistory(true);
    try {
      const userInfoStr = localStorage.getItem("userInfo");
      let userId = null;
      if (userInfoStr) {
        userId = JSON.parse(userInfoStr).id;
      } else {
        userId = localStorage.getItem("user_id");
      }

      if (!userId) {
        message.error("User ID not found");
        setIsLoadingHistory(false);
        return;
      }

      const data = await fetchChatHistory(userId);
      setChatHistory(data.history || {});
    } catch (error) {
      console.error(error);
      message.error("Failed to load history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadSession = (session) => {
    localStorage.setItem("chatSessionId", session.sessionId);
    const loadedMessages = [];
    session.conversations.forEach(conv => {
      const isFileQuery = conv.query && conv.query.startsWith("📎 ");
      loadedMessages.push({
        text: isFileQuery ? conv.query.substring(2) : conv.query,
        isFile: isFileQuery,
        sender: "user",
        time: new Date(conv.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });
      loadedMessages.push({
        text: formatMarkdownText(conv.response),
        sender: "bot",
        bertScore: conv.bertScore,
        hallucinationScore: conv.hallucinationScore,
        quota: conv.quota,
        modelQuota: conv.modelQuota,
        time: new Date(conv.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });
    });



    setMessages(loadedMessages);
    setIsHistoryVisible(false);
    message.success("Chat session loaded");
  };

  return (
    <div
      style={{
        height: "calc(100vh - 112px)", // 64px navbar + 48px content padding
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#ffffff",
        borderRadius: "12px",
      }}
    >
      <Card
        style={{
          height: "100%",
          width: "100%",
          borderRadius: 0,
          boxShadow: "none",
          display: "flex",
          flexDirection: "column",
        }}
        bodyStyle={{
          padding: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e2e8f0",
            background: "white",
            borderRadius: "18px 18px 0 0",
          }}
        >
          <Row align="middle" justify="space-between">
            <Space>
              <Avatar
                icon={<Scale size={18} />}
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                }}
              />
              <div>
                <Title level={5} style={{ margin: 0 }}>
                  Vidhora AI Assistant
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Trusted legal guidance powered by AI
                </Text>
              </div>
            </Space>
            <Space>

              <Button
                type="default"
                icon={<HistoryOutlined />}
                onClick={showHistory}
              >
                History
              </Button>
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                onClick={handleClearChat}
                style={{ backgroundColor: "#fff1f0", color: "#ff4d4f" }}
              >
                Clear Chat
              </Button>
            </Space>
          </Row>
        </div>

        {/* COMPACT USAGE & LIMITS PANEL */}
        {lastKnownQuota && (
          <div style={{ padding: "12px 24px 0 24px", background: "#f8fafc" }}>
            {(() => {
              const limit = lastKnownQuota.modelQuota?.limits?.tokensPerDay || lastKnownQuota.modelQuota?.limits?.tokens;
              const remaining = lastKnownQuota.modelQuota?.remaining?.tokens;

              const parsedLimit = parseTokenCount(limit) ?? 6000;
              const parsedRemaining = parseTokenCount(remaining) ?? 0;
              const isLow = parsedRemaining !== null && parsedRemaining !== undefined && parsedRemaining < 1500;

              const limitDailyRequests = lastKnownQuota.quota?.limits?.perDay ?? 50;
              const remainingDailyRequests = lastKnownQuota.quota?.remaining?.perDay ?? 0;

              return (
                <Card
                  style={{
                    marginBottom: 0,
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.01)',
                  }}
                  bodyStyle={{ padding: '10px 16px' }}
                >
                  <Row align="middle" justify="space-between" gutter={[16, 8]}>
                    {/* Label / Dashboard Icon */}
                    <Col xs={24} sm={6} md={5}>
                      <Space size={8}>
                        <DashboardOutlined style={{ color: '#1d4ed8', fontSize: '14px' }} />
                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#1e293b' }}>
                          Usage & Limits
                        </span>
                      </Space>
                    </Col>

                    {/* Daily Requests */}
                    <Col xs={12} sm={6} md={5}>
                      <Space size={6}>
                        <ThunderboltOutlined style={{ color: '#3b82f6', fontSize: '12px' }} />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Requests:</span>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#1e293b' }}>
                          {remainingDailyRequests} / {limitDailyRequests} left
                        </span>
                      </Space>
                    </Col>

                    {/* Tokens Remaining */}
                    <Col xs={12} sm={6} md={5}>
                      <Space size={6}>
                        <DatabaseOutlined style={{ color: '#10b981', fontSize: '12px' }} />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Tokens:</span>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: isLow ? '#ef4444' : '#10b981' }}>
                          {formatTokenCount(parsedRemaining)} / {formatTokenCount(parsedLimit)} left
                        </span>
                      </Space>
                    </Col>

                    {/* Reset Time */}
                    {lastKnownQuota.quota?.resetAt?.perDay && (
                      <Col xs={12} sm={6} md={5}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Resets: </span>
                        <span style={{ fontWeight: 600, fontSize: '11px', color: '#475569' }}>
                          {formatResetTime(lastKnownQuota.quota.resetAt.perDay, 'time')}
                        </span>
                      </Col>
                    )}

                    {/* Health Status Badge */}
                    <Col xs={12} sm={6} md={4} style={{ textAlign: 'right' }}>
                      {(() => {
                        let badgeStatus = "success";
                        let badgeText = "Systems Operational";
                        if (lastKnownQuota.modelQuota?.exhausted) {
                          badgeStatus = "error";
                          badgeText = "Limit Reached";
                        } else if (isLow || lastKnownQuota.modelQuota?.quotaWarning) {
                          badgeStatus = "warning";
                          badgeText = "Quota Low";
                        } else if (!lastKnownQuota.modelQuota?.canMakeNextRequest) {
                          badgeStatus = "warning";
                          badgeText = "Cooling Down";
                        }
                        return (
                          <Badge 
                            status={badgeStatus} 
                            text={
                              <span style={{ fontWeight: 600, fontSize: '11px', color: '#334155' }}>
                                {badgeText}
                              </span>
                            } 
                          />
                        );
                      })()}
                    </Col>
                  </Row>
                </Card>
              );
            })()}
          </div>
        )}

        {/* CHAT AREA */}
        <div
          ref={chatHistoryRef}
          style={{
            flex: 1,
            padding: "16px 20px",
            overflowY: "auto",
            background: "#f8fafc",
          }}
        >
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.sender === "user"
                      ? "flex-end"
                      : "flex-start",
                  gap: 12,
                }}
              >
                {msg.sender === "bot" && (
                  <Avatar
                    icon={<Scale size={18} />}
                    style={{
                      background:
                        "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                    }}
                  />
                )}

                <div style={{ maxWidth: "70%" }}>
                  <Card
                    size="small"
                    style={{
                      background:
                        msg.sender === "user"
                          ? "#3b82f6"
                          : "#ffffff",
                      color:
                        msg.sender === "user"
                          ? "#ffffff"
                          : "#0f172a",
                      borderRadius:
                        msg.sender === "user"
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                      border: "none",
                      boxShadow:
                        msg.sender === "user"
                          ? "0 6px 18px rgba(59, 130, 246, 0.35)"
                          : "0 4px 12px rgba(15, 23, 42, 0.08)",
                      textAlign: "left", // ensure markdown text is left aligned
                    }}
                    styles={{ body: { padding: "12px 16px" } }}
                  >
                    {msg.sender === "bot" ? (
                      <div className="chat-markdown">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({node, ...props}) => <h3 className="chat-md-h1" {...props} />,
                            h2: ({node, ...props}) => <h4 className="chat-md-h2" {...props} />,
                            h3: ({node, ...props}) => <h5 className="chat-md-h3" {...props} />,
                            strong: ({node, ...props}) => <strong className="chat-md-strong" {...props} />,
                            code: ({node, inline, ...props}) => (
                              inline 
                                ? <code className="chat-md-code-inline" {...props} />
                                : <pre className="chat-md-pre"><code {...props} /></pre>
                            )
                          }}
                        >
                          {msg.isStreaming ? streamingText : msg.text}
                        </ReactMarkdown>

                        {/* AI Evaluation Metrics inside Bot response */}
                        {!msg.isStreaming && (msg.bertScore || msg.hallucinationScore) && (
                          <div style={{
                            marginTop: '12px',
                            paddingTop: '12px',
                            borderTop: '1px dashed #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                          }}>
                            <div style={{
                              display: 'flex',
                              gap: '8px',
                              flexWrap: 'wrap',
                              alignItems: 'center'
                            }}>
                              <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                AI Metrics:
                              </span>
                              {msg.bertScore && (
                                <Tag color="geekblue" style={{ borderRadius: '12px', padding: '2px 8px', fontSize: '11px', border: '1px solid rgba(47, 84, 235, 0.15)', margin: 0 }}>
                                  <ThunderboltOutlined style={{ marginRight: '4px' }} />
                                  BERT Score: <strong>{msg.bertScore}</strong>
                                </Tag>
                              )}
                              {msg.hallucinationScore && (
                                <Tag color="volcano" style={{ borderRadius: '12px', padding: '2px 8px', fontSize: '11px', border: '1px solid rgba(245, 34, 45, 0.15)', margin: 0 }}>
                                  <InfoCircleOutlined style={{ marginRight: '4px' }} />
                                  Confidence Score: <strong>{msg.hallucinationScore}</strong>
                                </Tag>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : msg.isFile ? (
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        textAlign: "left"
                      }}>
                        {/* File Card UI */}
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "4px 0",
                        }}>
                          <div style={{
                            background: "rgba(255, 255, 255, 0.2)",
                            borderRadius: "8px",
                            width: "40px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}>
                            {(msg.fileName && msg.fileName.toLowerCase().endsWith(".pdf")) || (!msg.fileName && msg.text && msg.text.toLowerCase().endsWith(".pdf")) ? (
                              <FilePdfOutlined style={{ fontSize: "22px", color: "#ffffff" }} />
                            ) : (msg.fileName && (msg.fileName.toLowerCase().endsWith(".doc") || msg.fileName.toLowerCase().endsWith(".docx"))) || (!msg.fileName && msg.text && (msg.text.toLowerCase().endsWith(".doc") || msg.text.toLowerCase().endsWith(".docx"))) ? (
                              <FileWordOutlined style={{ fontSize: "22px", color: "#ffffff" }} />
                            ) : (
                              <FileTextOutlined style={{ fontSize: "22px", color: "#ffffff" }} />
                            )}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                            <Text style={{ margin: 0, color: "#ffffff", fontWeight: 600, fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
                              {msg.fileName || msg.text}
                            </Text>
                            <Text style={{ margin: 0, color: "rgba(255, 255, 255, 0.75)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>
                              Uploaded Document
                            </Text>
                          </div>
                        </div>

                        {/* Combined Text Message underneath if present */}
                        {msg.fileName && msg.text && (
                          <div style={{ 
                            marginTop: "4px", 
                            color: "#ffffff",
                            fontSize: "14px",
                            lineHeight: "1.5"
                          }}>
                            {msg.text}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Paragraph
                        style={{
                          margin: 0,
                          color:
                            msg.sender === "user"
                              ? "#ffffff"
                              : "#0f172a",
                        }}
                      >
                        {msg.text}
                      </Paragraph>
                    )}


                  </Card>
                  <Text
                    type="secondary"
                    style={{ fontSize: 11 }}
                  >
                    {msg.time}
                  </Text>
                </div>

                {msg.sender === "user" && (
                  <Avatar icon={<UserOutlined />} />
                )}
              </div>
            ))}

            {isTyping && (
              <Space>
                <Avatar
                  icon={<Scale size={18} />}
                  style={{
                    background:
                      "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  }}
                />
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </Space>
            )}
          </Space>
        </div>

        {/* INPUT */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e2e8f0",
            background: "#ffffff",
          }}
        >
          {attachedFile && (
            <Tag
              closable
              onClose={() => setAttachedFile(null)}
              style={{ marginBottom: 8 }}
            >
              {attachedFile.name}
            </Tag>
          )}

          {/* Suggested questions from backend (now above input) */}
          {suggestions.length > 0 && (
            <div className="lex-suggestions">
              {suggestions.map((q, idx) => (
                <Button
                  key={idx}
                  size="small"
                  type="default"
                  className="lex-suggestion-btn"
                  onClick={() => {
                    const cleanQ = q.replace(/^\d+\.\s*/, '');
                    handleSendMessage(cleanQ);
                  }}
                  loading={isLoadingSuggestions && idx === 0}
                >
                  {q}
                </Button>
              ))}
            </div>
          )}

          <div className="lex-input-bar">
            <div className="lex-input-main">
              <Upload
                beforeUpload={() => false}
                showUploadList={false}
                onChange={handleFileChange}
              >
                <Button icon={<PaperClipOutlined />} type="text" />
              </Upload>

              <Input
                placeholder="Ask your legal question…"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onPressEnter={handleSendMessage}
                bordered={false}
              />
            </div>

            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              className="lex-input-send"
              style={{ background: "#1d4ed8", border: "none", color: "white" }}
            />
          </div>
        </div>
      </Card>

      <Drawer
        title="Chat History"
        placement="right"
        onClose={() => setIsHistoryVisible(false)}
        open={isHistoryVisible}
        width={350}
      >
        {isLoadingHistory ? (
          <div style={{ padding: "16px 8px" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ marginBottom: 24 }}>
                <Skeleton.Input active size="small" style={{ width: 80, height: 16, marginBottom: 16 }} />
                <Skeleton active paragraph={{ rows: 1, width: ['100%'] }} title={{ width: '80%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "8px" }}>
            {Object.keys(chatHistory).sort((a, b) => new Date(b) - new Date(a)).map(date => {
              const dayData = chatHistory[date];
              return (
                <div key={date} style={{ marginBottom: "24px" }}>
                  <Text type="secondary" strong style={{ fontSize: "12px", marginLeft: "8px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b" }}>
                    {formatDateLabel(date)}
                  </Text>
                  <List
                    itemLayout="horizontal"
                    dataSource={dayData.sessions}
                    style={{ marginTop: "8px" }}
                    renderItem={(session) => (
                      <List.Item
                        style={{ cursor: "pointer", padding: "10px 12px", borderRadius: "8px", transition: "all 0.2s", borderBottom: "none" }}
                        className="history-list-item"
                        onClick={() => loadSession(session)}
                      >
                        <List.Item.Meta
                          title={<Text ellipsis style={{ fontSize: "14px", color: "#334155", fontWeight: 500, display: "block", maxWidth: 280 }}>{session.title || "New Conversation"}</Text>}
                          description={<Text type="secondary" ellipsis style={{ fontSize: "12px", display: "block", maxWidth: 280 }}>{session.lastMessage}</Text>}
                        />
                      </List.Item>
                    )}
                  />
                </div>
              );
            })}
            {Object.keys(chatHistory).length === 0 && (
              <Text type="secondary" style={{ display: "block", textAlign: "center", marginTop: "40px" }}>
                No chat history found.
              </Text>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default LexChatbot;