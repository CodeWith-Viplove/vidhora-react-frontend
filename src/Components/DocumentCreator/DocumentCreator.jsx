import React, { useState, useEffect } from "react";
import {
  FileTextOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  CheckCircleTwoTone,
} from "@ant-design/icons";
import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Button,
  Spin,
  message,
  Space,
  Divider,
  Tag,
  Tooltip,
  Alert,
  Progress,
  Select,
  Form,
  DatePicker,
  InputNumber,
} from "antd";
import ReactMarkdown from "react-markdown";

const { Title, Text } = Typography;
const { Option } = Select;

// Mock data for templates
const MOCK_TEMPLATES = [
  { id: "legal_agreement", title: "Legal Agreement" },
  { id: "cease_desist", title: "Cease and Desist Letter" },
  { id: "nda", title: "Non-Disclosure Agreement (NDA)" },
  { id: "terms_of_service", title: "Terms of Service" },
  { id: "privacy_policy", title: "Privacy Policy" },
];

// Mock data for template fields
const MOCK_TEMPLATE_FIELDS = {
  legal_agreement: [
    { name: "partyA", label: "Party A Name", type: "text", required: true },
    { name: "partyB", label: "Party B Name", type: "text", required: true },
    { name: "agreement_date", label: "Agreement Date", type: "date", required: true },
    { name: "terms", label: "Terms of Agreement", type: "textarea", required: true },
  ],
  cease_desist: [
    { name: "recipient_name", label: "Recipient Name", type: "text", required: true },
    { name: "recipient_address", label: "Recipient Address", type: "textarea", required: true },
    { name: "violation_date", label: "Date of Violation", type: "date", required: true },
    { name: "details", label: "Details of Violation", type: "textarea", required: true },
  ],
  nda: [
    { name: "disclosing_party", label: "Disclosing Party", type: "text", required: true },
    { name: "receiving_party", label: "Receiving Party", type: "text", required: true },
    { name: "effective_date", label: "Effective Date", type: "date", required: true },
    { name: "confidential_info", label: "Definition of Confidential Information", type: "textarea", required: true },
  ],
  terms_of_service: [
    { name: "company_name", label: "Company Name", type: "text", required: true },
    { name: "effective_date_tos", label: "Effective Date", type: "date", required: true },
    { name: "user_obligations", label: "User Obligations", type: "textarea", required: true },
    { name: "disclaimers", label: "Disclaimers", type: "textarea", required: false },
  ],
  privacy_policy: [
    { name: "company_name_pp", label: "Company Name", type: "text", required: true },
    { name: "effective_date_pp", label: "Effective Date", type: "date", required: true },
    { name: "data_collected", label: "Data Collected", type: "textarea", required: true },
    { name: "data_usage", label: "How Data is Used", type: "textarea", required: true },
  ],
};

const DocumentCreator = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateFields, setTemplateFields] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewContent, setPreviewContent] = useState(null); // New state for preview content
  const [form] = Form.useForm();

  useEffect(() => {
    // Simulate fetching templates
    setTemplates(MOCK_TEMPLATES);
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      setTemplateFields(MOCK_TEMPLATE_FIELDS[selectedTemplate] || []);
      form.resetFields(); // Reset form when template changes
      setPreviewContent(null);
    } else {
      setTemplateFields([]);
      form.resetFields();
      setPreviewContent(null);
    }
  }, [selectedTemplate, form]);

  const handleGenerateDocument = async (values) => {
    setIsGenerating(true);
    setPreviewContent(null); // Clear previous preview
    try {
      // Simulate API call
      await new Promise((r) => setTimeout(r, 2000));

      // Generate mock content for preview
      const generatedMockContent = `### Generated Document: ${selectedTemplate.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}

Here is the content of your document based on the provided details:

${Object.entries(values).map(([key, value]) => {
        const fieldLabel = templateFields.find(field => field.name === key)?.label || key;
        return `**${fieldLabel}:** ${value instanceof Date ? value.toLocaleDateString() : value}`;
      }).join('\n')}

---
*This is a mock preview of your generated document.*`;

      setPreviewContent(generatedMockContent);
      message.success("Document preview generated successfully!");
    } catch (error) {
      message.error("Failed to generate document (mock).");
    }
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (!previewContent) {
      message.error("No document to download.");
      return;
    }
    const mockFileName = `${selectedTemplate || "document"}_${Date.now()}.md`;
    const blob = new Blob([previewContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mockFileName;
    a.click();
    URL.revokeObjectURL(url);
    message.success("Mock document downloaded successfully!");
  };

  const handleClear = () => {
    form.resetFields();
    setPreviewContent(null);
    setSelectedTemplate(null);
    message.info("Form cleared");
  };

  const renderField = (field) => {
    const rules = [{ required: field.required, message: `Please input ${field.label}!` }];
    switch (field.type) {
      case "textarea":
        return (
          <Form.Item label={field.label} name={field.name} rules={rules} key={field.name}>
            <Input.TextArea rows={4} />
          </Form.Item>
        );
      case "number":
        return (
          <Form.Item label={field.label} name={field.name} rules={rules} key={field.name}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        );
      case "date":
        return (
          <Form.Item label={field.label} name={field.name} rules={rules} key={field.name}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        );
      case "text":
      default:
        return (
          <Form.Item label={field.label} name={field.name} rules={rules} key={field.name}>
            <Input />
          </Form.Item>
        );
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1600px",
        margin: "0 auto",
        background: "#ffffff",
        minHeight: "100vh",
      }}
    >
      <Card
        style={{
          marginBottom: 24,
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          border: "none",
          borderRadius: 16,
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
                <EditOutlined /> Create Legal Documents
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>
                Select a template, fill in the details, and generate a
                professional legal document.
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: "right" }}>
            <Space>
              <Tooltip title="Clear Form">
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleClear}
                >
                  Clear
                </Button>
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      <Alert
        message="Instructions"
        description="Start by selecting a document template from the dropdown menu. Then, fill out the required fields to generate your document."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        closable
        style={{ marginBottom: 24, borderRadius: 8 }}
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: "#3b82f6" }} />
                <span style={{ fontWeight: 600 }}>Document Details</span>
              </Space>
            }
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              height: "100%",
            }}
          >
            <Spin spinning={templates.length === 0}>
              <Space direction="vertical" style={{ width: "100%" }} size="large">
                <Select
                  showSearch
                  placeholder="Select a document template"
                  onChange={(value) => setSelectedTemplate(value)}
                  value={selectedTemplate}
                  style={{ width: "100%" }}
                  loading={templates.length === 0}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {templates.map((template) => (
                    <Option key={template.id} value={template.id}>
                      {template.title}
                    </Option>
                  ))}
                </Select>

                {selectedTemplate && templateFields.length > 0 && (
                  <>
                    <Divider />
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleGenerateDocument}
                    >
                      {templateFields.map((field) => (
                        renderField(field)
                      ))}
                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          size="large"
                          block
                          loading={isGenerating}
                          icon={<ThunderboltOutlined />}
                          style={{
                            height: 56,
                            fontSize: 16,
                            fontWeight: 600,
                            borderRadius: 8,
                            background:
                              "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            border: "none",
                          }}
                        >
                          {isGenerating ? "Generating..." : "Generate Document"}
                        </Button>
                      </Form.Item>
                    </Form>
                  </>
                )}
                {selectedTemplate && templateFields.length === 0 && !templates.length === 0 && (
                  <Alert message="No fields available for this template." type="warning" showIcon />
                )}
              </Space>
            </Spin>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BulbOutlined style={{ color: "#52c41a" }} />
                <span style={{ fontWeight: 600 }}>Generated Document</span>
              </Space>
            }
            extra={
              previewContent &&
              !isGenerating && (
                <Space>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                  >
                    Download
                  </Button>
                </Space>
              )
            }
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              height: "100%",
            }}
          >
            {isGenerating && (
              <div style={{ textAlign: "center", padding: "80px 20px" }}>
                <Spin size="large" />
                <div style={{ marginTop: 24 }}>
                  <Title level={4}>Generating Document Preview</Title>
                  <Text type="secondary">
                    Preparing your document for review...
                  </Text>
                  <Progress
                    percent={75}
                    status="active"
                    showInfo={false}
                    style={{ marginTop: 16 }}
                  />
                </div>
              </div>
            )}

            {!isGenerating && previewContent && (
              <div
                style={{
                  padding: "0px 20px",
                }}
              >
                <Title level={4}>Document Preview</Title>
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e8e8e8",
                    borderRadius: 8,
                    padding: 16,
                    maxHeight: "calc(100vh - 400px)",
                    overflowY: "auto",
                    textAlign: "left",
                  }}
                >
                  <ReactMarkdown>{previewContent}</ReactMarkdown>
                </div>
              </div>
            )}

            {!isGenerating && !previewContent && (
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
                  Your generated document preview will appear here
                </Title>
                <Text type="secondary">
                  Complete the form on the left to generate a document preview.
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DocumentCreator;