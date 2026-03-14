import React, { useState, useRef, useEffect } from "react";
import {
  SendOutlined,
  PaperClipOutlined,
  UserOutlined,
  DeleteOutlined,
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
} from "antd";
import { Scale } from "lucide-react";
import { sendChat, getLawQuestionSuggestions } from "../../api_services/chatAPI";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./LexChatbot.css";

const { Paragraph, Text, Title } = Typography;

const LexChatbot = () => {
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm VIDHORA, your AI legal assistant. How can I help you today?",
      sender: "bot",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const chatHistoryRef = useRef(null);

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

  useEffect(() => {
    const fetchSuggestions = async () => {
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

    fetchSuggestions();
  }, []);

  const handleSendMessage = async (directMessage = null) => {
    const textToProcess = typeof directMessage === 'string' ? directMessage : inputText;
    
    if (!textToProcess.trim() && !attachedFile) return;
    if (isTyping) return; // avoid multiple sends while waiting for reply

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const messageToSend = textToProcess.trim();
    const fileToSend = attachedFile;

    const newUserMessages = [];

    if (fileToSend) {
      newUserMessages.push({
        text: `📎 ${fileToSend.name}`,
        sender: "user",
        time,
      });
    }

    if (messageToSend) {
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
      const reply = await sendChat({
        message: messageToSend || undefined,
        file: fileToSend || undefined,
      });

      let cleanedReply = reply || "No reply received from Vidhora.";

      setMessages((prev) => [
        ...prev,
        {
          text: cleanedReply,
          sender: "bot",
          isStreaming: true,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
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
    message.success(`${file.name} attached`);
  };

  const handleClearChat = () => {
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
    message.info("Chat cleared");
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
                  VIDHORA Legal Assistant
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Trusted legal guidance powered by AI
                </Text>
              </div>
            </Space>
            <Button
              danger
              type="text"
              icon={<DeleteOutlined />}
              onClick={handleClearChat}
            // style={{ marginRight: 72 }} // offset so it doesn't sit under floating user avatar
            >
              Clear Chat
            </Button>
          </Row>
        </div>

        {/* CHAT AREA */}
        <div
          ref={chatHistoryRef}
          style={{
            flex: 1,
            padding: "24px",
            overflowY: "auto",
            background: "#f8fafc",
          }}
        >
          <Space direction="vertical" size={18} style={{ width: "100%" }}>
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
                    bodyStyle={{ padding: "12px 16px" }}
                  >
                    {msg.sender === "bot" ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h3: ({ node, ...props }) => (
                            <h3
                              style={{
                                marginTop: "16px",
                                marginBottom: "8px",
                                marginLeft: "0px",
                                paddingLeft: "0px",
                                textAlign: "left",
                                color: "#0f172a",
                              }}
                              {...props}
                            />
                          ),
                          p: ({ node, ...props }) => (
                            <p
                              style={{
                                marginBottom: 0,
                                marginTop: 0,
                                textAlign: "left",
                                color: "#0f172a",
                              }}
                              {...props}
                            />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul
                              style={{
                                marginLeft: "20px",
                                paddingLeft: "0px",
                              }}
                              {...props}
                            />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol
                              style={{
                                marginLeft: "20px",
                                paddingLeft: "0px",
                              }}
                              {...props}
                            />
                          ),
                          li: ({ node, ...props }) => (
                            <li
                              style={{
                                marginBottom: "4px",
                                paddingLeft: "0px",
                              }}
                              {...props}
                            />
                          ),
                        }}
                        style={{
                          fontSize: 15,
                          lineHeight: 1.5715,
                          margin: 0,
                          color: "#0f172a",
                        }}
                      >
                        {msg.isStreaming ? streamingText : msg.text}
                      </ReactMarkdown>
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
    </div>
  );
};

export default LexChatbot;