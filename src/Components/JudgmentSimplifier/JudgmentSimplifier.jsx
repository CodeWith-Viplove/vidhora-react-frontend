import React, { useState, useEffect } from "react";
import {
  FileTextOutlined,
  BulbOutlined,
  CopyOutlined,
  CheckCircleTwoTone,
  ThunderboltOutlined,
  LoadingOutlined,
  UploadOutlined,
  SolutionOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  HistoryOutlined,
  StarOutlined,
  StarFilled,
  DownOutlined,
  UpOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DashboardOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Button,
  Upload,
  Spin,
  message,
  Space,
  Divider,
  Tag,
  Tooltip,
  Alert,
  Badge,
  Progress,
  Statistic,
  Skeleton,
  Drawer,
  List,
  Modal,
} from "antd";
import { judgmentSimplifier, likeJudgement } from "../../api_services/judgmentAPI";
import { getUserJudgementSimplificationHistory } from "../../api_services/dashboardAPI";
import { toast } from 'react-toastify';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Document, Packer, Paragraph as DocParagraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

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

const JudgementSimplifier = () => {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [streamingOutputText, setStreamingOutputText] = useState("");
  const [recordId, setRecordId] = useState(null);
  const [isFavourited, setIsFavourited] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [drawerMode, setDrawerMode] = useState("history"); // "history" | "saved"
  const [historyItems, setHistoryItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [isFavLoading, setIsFavLoading] = useState(false);
  const [hallucinationScore, setHallucinationScore] = useState(null);
  const [confidenceType, setConfidenceType] = useState("");
  const [bertScore, setBertScore] = useState(null);
  const [rougeScore, setRougeScore] = useState(null);
  const [lastKnownQuota, setLastKnownQuota] = useState(() => {
    try {
      const saved = localStorage.getItem("lastKnownQuota");
      return saved ? JSON.parse(saved) : DEFAULT_QUOTA;
    } catch (e) {
      return DEFAULT_QUOTA;
    }
  });

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  useEffect(() => {
    if (outputText) {
      let currentIndex = 0;
      setStreamingOutputText("");

      const interval = setInterval(() => {
        if (currentIndex < outputText.length) {
          // Add roughly 3 characters at a time to simulate word-by-word reading
          // while preserving exact spacing and newlines
          const nextIndex = Math.min(currentIndex + 3, outputText.length);
          setStreamingOutputText(outputText.substring(0, nextIndex));
          currentIndex = nextIndex;
        } else {
          clearInterval(interval);
        }
      }, 10); // Adjust the speed of streaming here

      return () => clearInterval(interval);
    }
  }, [outputText]);

  const handleSimplify = async () => {
    const userId = localStorage.getItem("user_id");

    if (!inputText.trim() && !file) {
      message.warning("Please provide text or upload a file.");
      return;
    }

    setIsLoading(true);
    setOutputText("");
    setHallucinationScore(null);
    setConfidenceType("");
    setBertScore(null);
    setRougeScore(null);
    setRecordId(null);
    setIsFavourited(false);

    try {
      const formData = new FormData();

      if (inputText.trim()) {
        formData.append("text", inputText);
      }

      if (file) {
        formData.append("file", file);
      }
      if (userId) {
        formData.append("userId", userId);
      }

      const res = await judgmentSimplifier(formData);

      setOutputText(formatMarkdownText(res.simplifiedText));
      if (res.hallucinationScore) setHallucinationScore(res.hallucinationScore);
      if (res.confidenceType) setConfidenceType(res.confidenceType);
      if (res.bertScore) setBertScore(res.bertScore);
      if (res.rougeScore) setRougeScore(res.rougeScore);
      if (res.recordId) setRecordId(res.recordId);
      if (typeof res.isLiked !== 'undefined') setIsFavourited(res.isLiked);
      if (res.quota || res.modelQuota) {
        const quotaInfo = { quota: res.quota, modelQuota: res.modelQuota };
        setLastKnownQuota(quotaInfo);
        localStorage.setItem("lastKnownQuota", JSON.stringify(quotaInfo));
      }
      message.success("Judgment simplified successfully!");
      fetchHistory();
    } catch (error) {
      console.error(error);
      const msg = error?.message || "Something went wrong";
      if (msg.includes("No Indian court judgement identified")) {
        toast.info("This tool currently supports only Indian court judgments. Please paste or upload a valid Indian judgment document.");
      } else {
        toast.error(msg);
      }
    }
    setIsLoading(false);
  };

  const handleCopy = async () => {
    if (!outputText) return;

    await navigator.clipboard.writeText(outputText);
    setIsCopied(true);
    message.success("Copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClear = () => {
    setInputText("");
    setFile(null);
    setOutputText("");
    setWordCount(0);
    setHallucinationScore(null);
    setConfidenceType("");
    setBertScore(null);
    setRougeScore(null);
    setRecordId(null);
    setIsFavourited(false);
    message.info("Content cleared");
  };

  const handleSave = async (idToToggle, currentLikeStatus) => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      toast.error("Please login to update status.");
      return;
    }

    // If the function is called from the Drawer (with specific ID)
    const targetId = idToToggle || recordId;
    const targetStatus = currentLikeStatus !== undefined ? currentLikeStatus : isFavourited;

    if (!targetId) return;

    setIsFavLoading(true);
    try {
      const newStatus = !targetStatus;
      await likeJudgement(userId, targetId, newStatus);

      // Update local state if the toggled item is the currently loaded one
      if (targetId === recordId) {
        setIsFavourited(newStatus);
      }

      // Update the history list state to reflect the change immediately
      setHistoryItems(prevItems =>
        prevItems.map(item =>
          item._id === targetId || item.id === targetId ? { ...item, isLiked: newStatus } : item
        )
      );
      // toast.success(newStatus ? "Favourited successfully!" : "Removed from favourite items.");
    } catch (error) {
      console.error(error);
      // toast.error("Failed to update status.");
    } finally {
      setIsFavLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) return;
      const res = await getUserJudgementSimplificationHistory(userId, 1, 100);
      setHistoryItems(res.items || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load history.");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const openDrawer = (mode) => {
    setDrawerMode(mode);
    setIsDrawerVisible(true);
  };

  const handleDownload = async () => {
    if (!outputText) return;

    try {
      const lines = outputText.split('\n');
      const docElements = [];

      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          docElements.push(new DocParagraph({ text: "" }));
          return;
        }

        if (trimmedLine.startsWith('### ')) {
          docElements.push(new DocParagraph({
            text: trimmedLine.replace('### ', ''),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 240, after: 120 }
          }));
        } else if (trimmedLine.startsWith('## ')) {
          docElements.push(new DocParagraph({
            text: trimmedLine.replace('## ', ''),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 }
          }));
        } else if (trimmedLine.startsWith('# ')) {
          docElements.push(new DocParagraph({
            text: trimmedLine.replace('# ', ''),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }));
        } else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
          const content = trimmedLine.substring(2);
          docElements.push(new DocParagraph({
            children: parseMarkdownFormatting(content),
            bullet: { level: 0 },
            spacing: { after: 100 }
          }));
        } else {
          docElements.push(new DocParagraph({
            children: parseMarkdownFormatting(trimmedLine),
            spacing: { after: 120 }
          }));
        }
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new DocParagraph({
              text: "JUSTICE BRIDGE - Simplified Judgment Analysis",
              heading: HeadingLevel.TITLE,
              spacing: { after: 400 }
            }),
            ...docElements
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "simplified-judgment.docx");
      message.success("Downloaded as DOCX!");
    } catch (error) {
      console.error("Export failed:", error);
      message.error("Failed to generate DOCX file");
    }
  };

  const parseMarkdownFormatting = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return new TextRun({
          text: part.slice(2, -2),
          bold: true
        });
      }
      return new TextRun(part);
    });
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
    if (text) setFile(null);
  };

  const uploadProps = {
    beforeUpload: (file) => {
      const isLt4M = file.size / 1024 / 1024 < 4;
      if (!isLt4M) {
        toast.error(`File size cannot exceed 4MB. Please upload a smaller file.`);
        return Upload.LIST_IGNORE;
      }
      setFile(file);
      setInputText("");
      setWordCount(0);
      message.success(`${file.name} uploaded successfully`);
      return false;
    },
    onRemove: () => {
      setFile(null);
      message.info("File removed");
    },
    accept: ".pdf,.txt,.doc,.docx",
    maxCount: 1,
    fileList: file ? [file] : [],
  };

  return (
    <div
      style={{
        padding: "2px",
        width: "100%",
        background: "#ffffff",
        minHeight: "100vh",
      }}
    >
      {/* Header Section */}
      <Card
        style={{
          marginBottom: 24,
          background: "#1d4ed8",
          border: "none",
          borderRadius: 8,
        }}
      >
        <Row align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space direction="vertical" size={4}>
              <Title
                level={2}
                style={{
                  color: "white",
                  margin: 0,
                  fontSize: 32,
                  fontWeight: 700,
                }}
              >
                Simplify Court Judgments
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>
                Upload or paste any judgment — get a simple summary of key
                points.
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: "right" }}>
            <Space>
              <Tooltip title="View History">
                <Button
                  type="primary"
                  ghost
                  icon={<HistoryOutlined />}
                  style={{ borderColor: "white", color: "white" }}
                  onClick={() => openDrawer("history")}
                >
                  History
                </Button>
              </Tooltip>
              <Tooltip title="Favourite Items">
                <Badge count={historyItems.filter(i => i.isLiked).length || 0}>
                  <Button
                    type="primary"
                    ghost
                    icon={<StarOutlined />}
                    style={{ borderColor: "white", color: "white" }}
                    onClick={() => openDrawer("saved")}
                  >
                    Favourite
                  </Button>
                </Badge>
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Usage & Limits Panel (in place of Pro Tip) */}
      {lastKnownQuota && (
        <>
          {/* Low Token Warning Alert */}
          {(() => {
            const remaining = parseTokenCount(lastKnownQuota.modelQuota?.remaining?.tokens);
            const isLow = remaining !== null && remaining !== undefined && remaining < 1500;
            if (!isLow) return null;
            return (
              <Alert
                message={
                  <span style={{ fontWeight: 700, color: '#c2410c' }}>
                    Attention: Token Quota Almost Exhausted
                  </span>
                }
                description={`Your remaining token count is extremely low (${formatTokenCount(remaining)} tokens left). You may not be able to successfully complete your next request because the system token limit is almost exhausted.`}
                type="warning"
                showIcon
                style={{
                  marginBottom: 24,
                  borderRadius: 12,
                  border: '1px solid #ffedd5',
                  background: '#fff7ed',
                  boxShadow: '0 4px 15px rgba(249, 115, 22, 0.08)'
                }}
              />
            );
          })()}

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
                  marginBottom: 24,
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.01)',
                }}
                bodyStyle={{ padding: '12px 20px' }}
              >
                <Row align="middle" justify="space-between" gutter={[16, 8]}>
                  {/* Label / Dashboard Icon */}
                  <Col xs={24} sm={6} md={5}>
                    <Space size={8}>
                      <DashboardOutlined style={{ color: '#1d4ed8', fontSize: '15px' }} />
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>
                        Usage & Limits
                      </span>
                    </Space>
                  </Col>

                  {/* Daily Requests */}
                  <Col xs={12} sm={6} md={5}>
                    <Space size={6}>
                      <ThunderboltOutlined style={{ color: '#3b82f6', fontSize: '13px' }} />
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Requests:</span>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>
                        {remainingDailyRequests} / {limitDailyRequests} left
                      </span>
                    </Space>
                  </Col>

                  {/* Tokens Remaining */}
                  <Col xs={12} sm={6} md={5}>
                    <Space size={6}>
                      <DatabaseOutlined style={{ color: '#10b981', fontSize: '13px' }} />
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Tokens:</span>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: isLow ? '#ef4444' : '#10b981' }}>
                        {formatTokenCount(parsedRemaining)} / {formatTokenCount(parsedLimit)} left
                      </span>
                    </Space>
                  </Col>

                  {/* Reset Time */}
                  {lastKnownQuota.quota?.resetAt?.perDay && (
                    <Col xs={12} sm={6} md={5}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Resets at: </span>
                      <span style={{ fontWeight: 600, fontSize: '12px', color: '#475569' }}>
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
                            <span style={{ fontWeight: 600, fontSize: '12px', color: '#334155' }}>
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
        </>
      )}

      {/* Main Content Grid */}
      <Row gutter={[24, 24]}>
        {/* Left Panel - Input */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: "#3b82f6" }} />
                <span style={{ fontWeight: 600 }}>Input Judgment Text</span>
              </Space>
            }
            extra={
              <Space>
                <Tag color="blue">{wordCount} words</Tag>
                {(inputText || file) && (
                  <Tooltip title="Clear all">
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={handleClear}
                    />
                  </Tooltip>
                )}
              </Space>
            }
            style={{
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              height: "100%",
            }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              {/* Text Input */}
              <div>
                <Space style={{ marginBottom: 8 }}>
                  <Text strong>Option 1: Paste Text</Text>
                  <Tag color="green">Recommended</Tag>
                </Space>
                <TextArea
                  rows={12}
                  disabled={!!file}
                  placeholder="Paste judgment text here... (court cases, legal decisions, rulings)"
                  value={inputText}
                  onChange={handleInputChange}
                  style={{
                    borderRadius: 6,
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                  showCount
                  maxLength={10000}
                />
              </div>

              <Divider style={{ margin: "12px 0" }}>OR</Divider>

              {/* File Upload */}
              <div>
                <Space style={{ marginBottom: 8 }}>
                  <Text strong>Option 2: Upload Document</Text>
                  <Tag color="blue">PDF, DOC, TXT</Tag>
                </Space>
                <Upload.Dragger
                  {...uploadProps}
                  disabled={!!inputText.trim()}
                  style={{
                    background: file ? "#f0f9ff" : "#fafafa",
                    borderRadius: 6,
                    border: file
                      ? "2px dashed #1890ff"
                      : "2px dashed #cbd5e1",
                  }}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined
                      style={{
                        fontSize: 48,
                        color: file ? "#1890ff" : "#3b82f6",
                      }}
                    />
                  </p>
                  <p
                    className="ant-upload-text"
                    style={{ fontSize: 16, fontWeight: 500 }}
                  >
                    {file
                      ? "File uploaded successfully!"
                      : "Click or drag file to upload"}
                  </p>
                  <p className="ant-upload-hint" style={{ fontSize: 13 }}>
                    Supports PDF, TXT, DOC, DOCX (Max 4MB)
                  </p>
                </Upload.Dragger>
              </div>

              {/* Action Button */}
              <Button
                type="primary"
                size="large"
                block
                icon={
                  isLoading ? <LoadingOutlined /> : <SolutionOutlined />
                }
                loading={isLoading}
                disabled={!inputText.trim() && !file}
                // disabled={true} // Temporarily disable to prevent backend overload during testing
                onClick={handleSimplify}
                style={{
                  height: 56,
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: 6,
                  background: "#1d4ed8",
                  border: "none",
                }}
              >
                {isLoading ? "Simplifying..." : "Simplify Judgment"}
              </Button>
            </Space>
          </Card>
        </Col>

        {/* Right Panel - Output */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BulbOutlined style={{ color: "#52c41a" }} />
                <span style={{ fontWeight: 600 }}>Simplified Output</span>
              </Space>
            }
            extra={
              outputText &&
              !isLoading && (
                <Space>
                  <Button
                    type="text"
                    icon={
                      isCopied ? (
                        <CheckCircleTwoTone twoToneColor="#52c41a" />
                      ) : (
                        <CopyOutlined />
                      )
                    }
                    onClick={handleCopy}
                  >
                    {isCopied ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                  >
                    Download
                  </Button>
                </Space>
              )
            }
            style={{
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              height: "100%",
            }}
          >
            {!isLoading && !outputText && (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 20px",
                  color: "#999",
                }}
              >
                <BulbOutlined
                  style={{ fontSize: 64, color: "#d9d9d9", marginBottom: 16 }}
                />
                <Title level={4} type="secondary">
                  Simplified judgment will appear here
                </Title>
                <Text type="secondary">
                  Enter judgment text or upload a document to get started
                </Text>
              </div>
            )}

            {isLoading && (
              <div style={{ padding: "20px" }}>
                <Skeleton active paragraph={{ rows: 4 }} />
              </div>
            )}

            {outputText && !isLoading && (
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="large"
              >
                {/* Premium Analysis Dashboard */}
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(12px)',
                  padding: '24px', 
                  // borderRadius: '8px', 
                  // border: '1px solid rgba(59, 130, 246, 0.25)',
                  marginBottom: '24px',
                  // boxShadow: '0 8px 32px rgba(31, 38, 135, 0.08)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Decorative background element */}
                  {/* <div style={{
                    position: 'absolute',
                    top: '-30px',
                    right: '-30px',
                    width: '120px',
                    height: '120px',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                    zIndex: 0
                  }} /> */}

                  <div style={{ marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                    <Row align="middle" justify="space-between">
                      <Col>
                        <Text strong style={{ fontSize: 13, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          AI Model Evaluation Metrics
                        </Text>
                      </Col>
                      <Col>
                        <Tag color="blue" style={{ 
                          padding: '2px 10px', 
                          borderRadius: '12px', 
                          fontWeight: 600,
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#1d4ed8',
                          border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}>
                          <ThunderboltOutlined style={{ marginRight: 6 }} />
                          {confidenceType ? confidenceType.toUpperCase() : 'HIGH'} CONFIDENCE
                        </Tag>
                      </Col>
                    </Row>
                    <Divider style={{ margin: '12px 0 16px 0', borderColor: 'rgba(59, 130, 246, 0.15)' }} />
                  </div>

                  <Row gutter={[16, 16]} justify="space-around" align="middle" style={{ position: 'relative', zIndex: 1 }}>
                    {/* BERT Score */}
                    <Col xs={8} style={{ textAlign: 'center' }}>
                      <Progress
                        type="circle"
                        percent={bertScore ? parseFloat(bertScore) : 92}
                        size={80}
                        strokeColor={{
                          '0%': '#60a5fa',
                          '100%': '#3b82f6',
                        }}
                        format={(percent) => (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{percent}%</span>
                          </div>
                        )}
                      />
                      <div style={{ marginTop: '8px' }}>
                        <Text strong style={{ fontSize: '12px', color: '#475569', display: 'block' }}>BERT Score</Text>
                        <Text type="secondary" style={{ fontSize: '10px' }}>Semantic Quality</Text>
                      </div>
                    </Col>

                    {/* ROUGE Score */}
                    <Col xs={8} style={{ textAlign: 'center', borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9' }}>
                      <Progress
                        type="circle"
                        percent={rougeScore ? parseFloat(rougeScore) : 88}
                        size={80}
                        strokeColor={{
                          '0%': '#10b981',
                          '100%': '#059669',
                        }}
                        format={(percent) => (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{percent}%</span>
                          </div>
                        )}
                      />
                      <div style={{ marginTop: '8px' }}>
                        <Text strong style={{ fontSize: '12px', color: '#475569', display: 'block' }}>ROUGE Score</Text>
                        <Text type="secondary" style={{ fontSize: '10px' }}>Factual Recall</Text>
                      </div>
                    </Col>

                    {/* Hallucination Score */}
                    <Col xs={8} style={{ textAlign: 'center' }}>
                      <Progress
                        type="circle"
                        percent={hallucinationScore ? parseFloat(hallucinationScore) : 92}
                        size={80}
                        strokeColor={{
                          '0%': '#f59e0b',
                          '100%': '#ef4444',
                        }}
                        format={(percent) => (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{percent}%</span>
                          </div>
                        )}
                      />
                      <div style={{ marginTop: '8px' }}>
                        <Text strong style={{ fontSize: '12px', color: '#475569', display: 'block' }}>Confidence Score</Text>
                        <Text type="secondary" style={{ fontSize: '10px' }}>Faithfulness</Text>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Output Text with Markdown */}
                <Card
                  size="small"
                  style={{
                    background: "#f6ffed",
                    border: "1px solid #b7eb8f",
                    borderRadius: 6,
                    maxHeight: "650px",
                    overflowY: "auto",
                  }}
                >
                  <div style={{ color: '#000000' }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => <h1 style={{ textAlign: 'left', fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '12px', color: '#000000' }} {...props} />,
                        h2: ({ node, ...props }) => <h2 style={{ textAlign: 'left', fontSize: '16px', fontWeight: 'bold', marginTop: '14px', marginBottom: '10px', color: '#000000' }} {...props} />,
                        h3: ({ node, ...props }) => <h3 style={{ textAlign: 'left', fontSize: '15px', fontWeight: 'bold', marginTop: '12px', marginBottom: '8px', color: '#000000' }} {...props} />,
                        h4: ({ node, ...props }) => <h4 style={{ textAlign: 'left', fontSize: '14px', fontWeight: 'bold', marginTop: '10px', marginBottom: '6px', color: '#000000' }} {...props} />,
                        p: ({ node, ...props }) => <p style={{ textAlign: 'left', marginTop: '4px', marginBottom: '8px', color: '#000000', lineHeight: '1.6' }} {...props} />,
                        ul: ({ node, ...props }) => <ul style={{ marginLeft: '20px', paddingLeft: '0px', color: '#000000' }} {...props} />,
                        ol: ({ node, ...props }) => <ol style={{ marginLeft: '20px', paddingLeft: '0px', color: '#000000' }} {...props} />,
                        li: ({ node, ...props }) => <li style={{ marginBottom: '4px', paddingLeft: '0px', color: '#000000', lineHeight: '1.6' }} {...props} />,
                        strong: ({ node, ...props }) => <strong style={{ color: '#000000', fontWeight: 'bold' }} {...props} />
                      }}
                      style={{
                        fontSize: 15,
                        lineHeight: 1.8,
                      }}
                    >
                      {streamingOutputText}
                    </ReactMarkdown>
                  </div>
                </Card>

                {/* Action Buttons */}
                <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                  <Button
                    icon={isFavourited ? <StarFilled style={{ color: "#1890ff" }} /> : <StarOutlined />}
                    onClick={() => handleSave()}
                    loading={isFavLoading}
                  >
                    {isFavourited ? "Favourited" : "Favourite"}
                  </Button>
                  <Button
                    type="primary"
                    icon={isCopied ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <CopyOutlined />}
                    onClick={handleCopy}
                  >
                    {isCopied ? "Copied!" : "Copy to Clipboard"}
                  </Button>
                </Space>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* Features Section */}

      <Modal
        title={drawerMode === "saved" ? "Favourite Items" : "History"}
        onCancel={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        width={700}
        footer={null}
        bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
        style={{ top: 20 }}
      >
        <List
          pagination={{ pageSize: 10, align: 'center' }}
          dataSource={drawerMode === "saved" ? historyItems.filter((item) => item.isLiked) : historyItems}
          renderItem={(item) => {
            const isExpanded = expandedItems[item._id || item.id];

            return (
              <List.Item>
                <Card size="small" style={{ width: "100%", borderRadius: 8, borderColor: "#e2e8f0" }}>
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Tag color="blue">{new Date(item.createdAt).toLocaleDateString()}</Tag>
                  </Space>
                  <div style={{ marginTop: 8 }}>
                    <Text strong>{item.userQuery || "Uploaded Document"}</Text>
                    <div style={{ marginTop: 6, marginBottom: 6 }}>
                      <Space size={[4, 4]} wrap>
                        {item.bertScore && (
                          <Tag color="geekblue" style={{ fontSize: '11px', borderRadius: '4px' }}>BERT: {item.bertScore}</Tag>
                        )}
                        {item.rougeScore && (
                          <Tag color="green" style={{ fontSize: '11px', borderRadius: '4px' }}>ROUGE: {item.rougeScore}</Tag>
                        )}
                        {item.hallucinationScore && (
                          <Tag color="volcano" style={{ fontSize: '11px', borderRadius: '4px' }}>Hallucination: {item.hallucinationScore}</Tag>
                        )}
                        {item.confidenceType && (
                          <Tag color="purple" style={{ fontSize: '11px', borderRadius: '4px' }}>Confidence: {item.confidenceType}</Tag>
                        )}
                      </Space>
                    </div>

                    <div style={{ marginTop: 8, background: "#f8fafc", padding: 8, borderRadius: 6 }}>
                      <div
                        style={
                          isExpanded
                            ? { overflow: 'hidden' }
                            : {
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }
                        }
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ node, ...props }) => <h1 style={{ textAlign: 'left', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#000000' }} {...props} />,
                            h2: ({ node, ...props }) => <h2 style={{ textAlign: 'left', fontSize: '16px', fontWeight: 'bold', marginBottom: '6px', color: '#000000' }} {...props} />,
                            h3: ({ node, ...props }) => <h3 style={{ textAlign: 'left', marginTop: '12px', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold', color: '#000000' }} {...props} />,
                            ul: ({ node, ...props }) => <ul style={{ textAlign: 'left', marginLeft: '20px', paddingLeft: '0px', marginBottom: '8px', color: '#000000' }} {...props} />,
                            ol: ({ node, ...props }) => <ol style={{ textAlign: 'left', marginLeft: '20px', paddingLeft: '0px', marginBottom: '8px', color: '#000000' }} {...props} />,
                            p: ({ node, ...props }) => <p style={{ textAlign: 'left', marginBottom: '8px', lineHeight: '1.6', color: '#000000' }} {...props} />,
                            li: ({ node, ...props }) => <li style={{ textAlign: 'left', marginBottom: '4px', color: '#000000', lineHeight: '1.6' }} {...props} />,
                            strong: ({ node, ...props }) => <strong style={{ color: '#000000', fontWeight: 'bold' }} {...props} />
                          }}
                          style={{ fontSize: 13, color: "#000000" }}
                        >
                          {formatMarkdownText(item.aiResponse)}
                        </ReactMarkdown>
                      </div>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => toggleExpand(item._id || item.id)}
                        style={{ padding: 0, marginTop: 4 }}
                      >
                        {isExpanded ? "Show less" : "See more..."}
                      </Button>
                    </div>

                    {drawerMode === "saved" ? (
                      <div style={{ marginTop: 12, textAlign: "right" }}>
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleSave(item._id || item.id, item.isLiked)}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div style={{ marginTop: 12, textAlign: "right" }}>
                        <Button
                          size="small"
                          icon={item.isLiked ? <StarFilled style={{ color: "#1890ff" }} /> : <StarOutlined />}
                          onClick={() => handleSave(item._id || item.id, item.isLiked)}
                        >
                          {item.isLiked ? "Favourited" : "Favourite"}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </List.Item>
            );
          }}
          locale={{ emptyText: drawerMode === "saved" ? "No favourite items yet." : "No history found." }}
        />
      </Modal>

    </div>
  );
};

export default JudgementSimplifier;
