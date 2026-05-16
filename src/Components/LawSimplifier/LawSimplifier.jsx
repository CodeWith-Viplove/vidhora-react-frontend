import React, { useState, useEffect } from "react";
import {
  FileTextOutlined,
  BulbOutlined,
  CopyOutlined,
  CheckCircleTwoTone,
  ThunderboltOutlined,
  FileSearchOutlined,
  LoadingOutlined,
  UploadOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  HistoryOutlined,
  StarOutlined,
  StarFilled,
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
import { lawSimplifier, likeLaw } from "../../api_services/lawAPI";
import { getUserLawSimplificationHistory } from "../../api_services/dashboardAPI";
import { toast } from 'react-toastify';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Document, Packer, Paragraph as DocParagraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const LawSimplifier = () => {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [simplificationScore, setSimplificationScore] = useState(0);
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

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  useEffect(() => {
    if (outputText) {
      let currentIndex = 0;
      setStreamingOutputText("");

      const interval = setInterval(() => {
        if (currentIndex < outputText.length) {
          // Add roughly 3 characters at a time to simulate smooth streaming playback
          // this guarantees preserving exact spacing, newlines, and markdown blocks
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

  // handle law simplification
  const handleSimplify = async () => {
    const userId = localStorage.getItem("user_id");
    if (!inputText.trim() && !file) {
      message.warning("Please provide text or upload a file.");
      return;
    }

    setIsLoading(true);
    setOutputText("");
    setSimplificationScore(0);
    setHallucinationScore(null);
    setConfidenceType("");
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
        // Backend expects `userId` per API_REFERENCE and controller
        formData.append("userId", userId);
      }

      const res = await lawSimplifier(formData);

      setOutputText(res.simplifiedText);
      if (res.hallucinationScore) setHallucinationScore(res.hallucinationScore);
      if (res.confidenceType) setConfidenceType(res.confidenceType);
      if (res.recordId) setRecordId(res.recordId);
      if (typeof res.isLiked !== 'undefined') setIsFavourited(res.isLiked);
      setSimplificationScore(res.hallucinationScore ? Math.round(parseFloat(res.hallucinationScore)) : 0);
      message.success("Law simplified successfully!");
      fetchHistory();
    } catch (error) {
      console.error(error);
      const msg = error?.message || "Something went wrong";
      // If backend guardrail for non-Indian law triggers, show a softer toast
      if (msg.includes("only simplifies Indian law") || msg.includes("only simplifies Indian")) {
        toast.info("This tool currently supports only Indian laws/statutes. Please paste or upload Indian legal provisions.");
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
    setSimplificationScore(0);
    setHallucinationScore(null);
    setConfidenceType("");
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
      await likeLaw(userId, targetId, newStatus);

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
      const res = await getUserLawSimplificationHistory(userId, 1, 100);
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
      // Simple parser for markdown to docx elements
      const lines = outputText.split('\n');
      const docElements = [];

      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          docElements.push(new DocParagraph({ text: "" }));
          return;
        }

        // Handle Headings
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
        }
        // Handle Bullet Points
        else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
          const content = trimmedLine.substring(2);
          docElements.push(new DocParagraph({
            children: parseMarkdownFormatting(content),
            bullet: { level: 0 },
            spacing: { after: 100 }
          }));
        }
        // Regular Paragraph
        else {
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
              text: "JUSTICE BRIDGE - Simplified Legal Analysis",
              heading: HeadingLevel.TITLE,
              spacing: { after: 400 }
            }),
            ...docElements
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "simplified-legal-text.docx");
      message.success("Downloaded as DOCX!");
    } catch (error) {
      console.error("Export failed:", error);
      message.error("Failed to generate DOCX file");
    }
  };

  // Helper to handle bold formatting in markdown
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
                Law Simplifier
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>
                Transform complex legal language into clear, understandable text
                with AI-powered analysis
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

      {/* Info Alert */}
      <Alert
        message="Pro Tip"
        description="For best results, provide complete sections or paragraphs. The AI works better with context."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        closable
        style={{ marginBottom: 24, borderRadius: 6 }}
      />

      {/* Main Content Grid */}
      <Row gutter={[24, 24]}>
        {/* Left Panel - Input */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: "#667eea" }} />
                <span style={{ fontWeight: 600 }}>Input Legal Text</span>
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
                  placeholder="Paste your legal text here... (e.g., contracts, terms, clauses, legal notices)"
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
                    border: file ? "2px dashed #1890ff" : "2px dashed #cbd5e1",
                  }}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined
                      style={{
                        fontSize: 48,
                        color: file ? "#1890ff" : "#667eea",
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
                  isLoading ? <LoadingOutlined /> : <FileSearchOutlined />
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
              >                {isLoading ? "Simplifying..." : "Simplify Law"}
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
              outputText && !isLoading && (
                <Space>
                  {/* <Button
                    type="text"
                    icon={isCopied ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <CopyOutlined />}
                    onClick={handleCopy}
                  >
                    {isCopied ? "Copied!" : "Copy"}
                  </Button> */}
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
                  Simplified text will appear here
                </Title>
                <Text type="secondary">
                  Enter legal text or upload a document to get started
                </Text>
              </div>
            )}

            {isLoading && (
              <div style={{ padding: "20px" }}>
                <Skeleton active paragraph={{ rows: 4 }} />
              </div>
            )}

            {outputText && !isLoading && (
              <Space direction="vertical" style={{ width: "100%" }} size="large">
                {/* Premium Law Analysis Dashboard */}
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  padding: '20px', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  marginBottom: '24px',
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.07)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Decorative background element */}
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '100px',
                    height: '100px',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
                    zIndex: 0
                  }} />

                  <Row gutter={[32, 20]} align="middle">
                    <Col xs={24} sm={8} style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
                      <Progress
                        type="dashboard"
                        percent={hallucinationScore ? parseFloat(hallucinationScore) : 85}
                        size={100}
                        strokeColor={{
                          '0%': '#8b5cf6',
                          '100%': '#10b981',
                        }}
                        format={(percent) => (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{percent}%</span>
                            <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Accuracy</span>
                          </div>
                        )}
                      />
                    </Col>
                    
                    <Col xs={24} sm={16}>
                      <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <div>
                          <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Provision Classification Confidence</Text>
                          <div style={{ marginTop: 4 }}>
                            <Tag color="purple" style={{ 
                              padding: '4px 12px', 
                              borderRadius: '20px', 
                              fontSize: 14, 
                              fontWeight: 600,
                              background: 'rgba(139, 92, 246, 0.1)',
                              color: '#6d28d9',
                              border: '1px solid rgba(139, 92, 246, 0.2)'
                            }}>
                              <ThunderboltOutlined style={{ marginRight: 6 }} />
                              {confidenceType ? confidenceType.toUpperCase() : 'HIGH'}
                            </Tag>
                          </div>
                        </div>
                      </Space>
                    </Col>
                  </Row>
                </div>


                {/* Output Text */}
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
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => <h1 style={{ textAlign: 'left' }} {...props} />,
                      h2: ({ node, ...props }) => <h2 style={{ textAlign: 'left' }} {...props} />,
                      h3: ({ node, ...props }) => <h3 style={{ textAlign: 'left', marginTop: '16px', marginBottom: '4px', marginLeft: '0px', paddingLeft: '0px' }} {...props} />,
                      h4: ({ node, ...props }) => <h4 style={{ textAlign: 'left' }} {...props} />,
                      p: ({ node, ...props }) => <p style={{ textAlign: 'left', marginTop: '4px', marginBottom: '8px' }} {...props} />,
                      ul: ({ node, ...props }) => <ul style={{ marginLeft: '20px', paddingLeft: '0px' }} {...props} />,
                      ol: ({ node, ...props }) => <ol style={{ marginLeft: '20px', paddingLeft: '0px' }} {...props} />,
                      li: ({ node, ...props }) => <li style={{ marginBottom: '4px', paddingLeft: '0px' }} {...props} />,
                    }}
                    style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      margin: 0,
                    }}
                  >
                    {streamingOutputText}
                  </ReactMarkdown>
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
                            h1: ({ node, ...props }) => <h1 style={{ textAlign: 'left', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }} {...props} />,
                            h2: ({ node, ...props }) => <h2 style={{ textAlign: 'left', fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' }} {...props} />,
                            h3: ({ node, ...props }) => <h3 style={{ textAlign: 'left', marginTop: '12px', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }} {...props} />,
                            ul: ({ node, ...props }) => <ul style={{ textAlign: 'left', marginLeft: '20px', paddingLeft: '0px', marginBottom: '8px' }} {...props} />,
                            ol: ({ node, ...props }) => <ol style={{ textAlign: 'left', marginLeft: '20px', paddingLeft: '0px', marginBottom: '8px' }} {...props} />,
                            p: ({ node, ...props }) => <p style={{ textAlign: 'left', marginBottom: '8px', lineHeight: '1.6' }} {...props} />,
                            li: ({ node, ...props }) => <li style={{ textAlign: 'left', marginBottom: '4px' }} {...props} />,
                          }}
                          style={{ fontSize: 13, color: "#475569" }}
                        >
                          {item.aiResponse}
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

export default LawSimplifier;
