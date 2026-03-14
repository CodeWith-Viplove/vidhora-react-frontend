import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Button,
  Avatar,
  Badge,
  Dropdown,
  Space,
  Typography,
  Tag,
  List,
  Progress,
  Modal,
} from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import {
  SearchOutlined,
  BellOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  RiseOutlined,
  FileTextOutlined,
  SafetyOutlined,
  FileAddOutlined,
  MessageOutlined,
  PlusOutlined,
  DownloadOutlined,
  ArrowRightOutlined,
  DashboardOutlined,
  StarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { getUserSimplificationStats, getUserAllSimplifications } from '../../api_services/dashboardAPI';

const { Header, Content } = Layout;
const { Title: AntTitle, Text, Paragraph } = Typography;

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = ({ onNavigate }) => {
  const [simplificationStats, setSimplificationStats] = useState({
    totalSimplifications: 0,
    lawSimplified: 0,
    judgmentSimplified: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const handleActivityClick = (item) => {
    setSelectedActivity(item);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedActivity(null);
  };

  useEffect(() => {
    const fetchStats = async () => {
      const userId = localStorage.getItem("user_id");
      if (userId) {
        try {
          const [stats, activities] = await Promise.all([
            getUserSimplificationStats(userId),
            getUserAllSimplifications(userId)
          ]);
          setSimplificationStats(stats);
          setRecentActivities(activities?.items || []);
        } catch (error) {
          console.error("Failed to fetch dashboard data:", error);
        }
      }
    };
    fetchStats();
  }, []);

  // Get user initials
  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Get user display info
  const getUserDisplayInfo = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const name = userInfo ? (userInfo.name) : null;
    if (userInfo) {
      return {
        name: userInfo.name || userInfo.displayName || 'User',
        initials: getUserInitials(name)
      };
    }
    return {
      name: 'User',
      photo: null,
      initials: 'U'
    };
  };

  const user = getUserDisplayInfo();

  const lawCount = simplificationStats.lawSimplified || 0;
  const judgmentCount = simplificationStats.judgmentSimplified || 0;
  const totalSimplifications =
    (simplificationStats.totalSimplifications || lawCount + judgmentCount) || 0;

  // Stats cards
  const stats = [
    {
      title: 'Laws Simplified',
      value: lawCount,
      prefix: <RiseOutlined style={{ color: '#10b981' }} />,
      suffix: '',
      valueStyle: { color: '#1e293b' },
    },
    {
      title: 'Judgments Processed',
      value: judgmentCount,
      prefix: <SafetyOutlined style={{ color: '#f59e0b' }} />,
      suffix: '',
      valueStyle: { color: '#1e293b' },
    },
    {
      title: 'Total Simplifications',
      value: totalSimplifications,
      prefix: <TeamOutlined style={{ color: '#8bbc5e' }} />,
      suffix: '',
      valueStyle: { color: '#1e293b' },
    },
  ];

  // Bar Chart Data (Module Usage Analytics) based on real counts
  const barChartData = {
    labels: ['Law Simplifier', 'Judgment Simplifier'],
    datasets: [
      {
        label: 'Usage Count',
        data: [lawCount, judgmentCount],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: ['#3b82f6', '#f59e0b'],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 },
        }
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
      }
    }
  };

  // Pie Chart Data
  // Pie Chart Data (Module Usage Distribution) based on real counts
  const pieChartData = {
    labels: ['Law Simplifier', 'Judgment Simplifier'],
    datasets: [
      {
        data: [lawCount, judgmentCount],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: ['#3b82f6', '#f59e0b'],
        borderWidth: 3,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12 },
        }
      },
    }
  };

  // Main modules
  const mainModules = [
    {
      title: 'Law Simplifier',
      description: 'Convert complex legal text into simple language',
      icon: <RiseOutlined style={{ fontSize: 24, color: '#3b82f6' }} />,
      action: () => onNavigate && onNavigate('Law Simplifier')
    },
    {
      title: 'Judgment Simplifier',
      description: 'Get clear summaries of court decisions',
      icon: <SafetyOutlined style={{ fontSize: 24, color: '#f59e0b' }} />,
      action: () => onNavigate && onNavigate('Judgment Simplifier')
    }
  ];
  // Real activities fetched from API
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Distribution stats based on real counts
  const distributionTotal = lawCount + judgmentCount;
  const toPercent = (count) =>
    distributionTotal > 0 ? `${Math.round((count / distributionTotal) * 100)}%` : '0%';

  const distributionStats = [
    {
      label: 'Law Simplifier',
      value: `${lawCount} simplifications`,
      percentage: toPercent(lawCount),
      color: '#3b82f6',
    },
    {
      label: 'Judgment Simplifier',
      value: `${judgmentCount} simplifications`,
      percentage: toPercent(judgmentCount),
      color: '#10b981',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* Header */}



      {/* Main Content */}
      <Content style={{ padding: '2px', background: '#ffffff' }}>
        {/* Welcome Banner */}
        <Card
          style={{
            marginBottom: 24,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.08))',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 8,
          }}
        >
          <AntTitle level={2} style={{ margin: '0 0 8px 0', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Welcome to VIDHORA Dashboard{user.name && `, ${user.name.split(' ')[0]}`}
          </AntTitle>
          <Text style={{ fontSize: 16, color: '#1d4ed8' }}>
            Transform complex legal language into simple, understandable text with AI-powered tools
          </Text>
        </Card>

        {/* Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card
                hoverable
                style={{
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                }}
              >
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={<Text type="success" style={{ fontSize: 14 }}>{stat.suffix}</Text>}
                  valueStyle={stat.valueStyle}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* Charts Section */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* Bar Chart */}
          <Col xs={24} lg={24}>
            <Card
              title={<AntTitle level={4} style={{ margin: 0 }}>Module Usage Analytics</AntTitle>}
              style={{
                borderRadius: 8,
                border: '1px solid #cbd5e1',
              }}
            >
              <div style={{ height: 350, padding: 16, background: '#fafafa', borderRadius: 6 }}>
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </Card>
          </Col>
        </Row>

        {/* Distribution Chart */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card
              title={<AntTitle level={4} style={{ margin: 0 }}>Module Usage Distribution</AntTitle>}
              style={{
                borderRadius: 8,
                border: '1px solid #cbd5e1',
              }}
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <div style={{ height: 400, padding: 16, background: '#fafafa', borderRadius: 6 }}>
                    <Pie data={pieChartData} options={pieChartOptions} />
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {distributionStats.map((item, index) => (
                      <Card
                        key={index}
                        size="small"
                        style={{
                          background: '#fafafa',
                          border: '1px solid #cbd5e1',
                          borderRadius: 6,
                        }}
                      >
                        <Row align="middle" justify="space-between">
                          <Col>
                            <Space>
                              <div
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  background: item.color,
                                }}
                              />
                              <div>
                                <Text strong>{item.label}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>{item.value}</Text>
                              </div>
                            </Space>
                          </Col>
                          <Col>
                            <AntTitle level={4} style={{ margin: 0 }}>{item.percentage}</AntTitle>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Main Modules */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card
              title={<AntTitle level={4} style={{ margin: 0 }}>Main Modules</AntTitle>}
              style={{
                borderRadius: 8,
                border: '1px solid #cbd5e1',
              }}
            >
              <Row gutter={[16, 16]}>
                {mainModules.map((module, index) => (
                  <Col xs={24} md={12} key={index}>
                    <Card
                      hoverable
                      onClick={module.action}
                      style={{
                        background: '#fafafa',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          {module.icon}
                          <div>
                            <Text strong style={{ display: 'block' }}>{module.title}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>{module.description}</Text>
                          </div>
                        </Space>
                        <ArrowRightOutlined />
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Quick Actions */}
            </Card>
          </Col>
        </Row>

        {/* Recent Activity */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card
              title={<AntTitle level={4} style={{ margin: 0 }}>Recent Activity</AntTitle>}
              style={{
                borderRadius: 8,
                border: '1px solid #cbd5e1',
              }}
            >
              <List
                itemLayout="horizontal"
                dataSource={recentActivities}
                renderItem={(item) => (
                  <List.Item
                    onClick={() => handleActivityClick(item)}
                    style={{
                      background: '#fafafa',
                      padding: 16,
                      marginBottom: 12,
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.1)';
                      e.currentTarget.style.borderColor = '#94a3b8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ background: item.type === 'law' ? 'linear-gradient(135deg, #3b82f6, #1e3a8a)' : 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                          {item.type === 'law' ? <RiseOutlined /> : <SafetyOutlined />}
                        </Avatar>
                      }
                      title={
                        <Text strong>
                          {item.userQuery
                            ? item.userQuery.split(/\s+/).length > 20
                              ? item.userQuery.split(/\s+/).slice(0, 20).join(' ') + '...'
                              : item.userQuery
                            : "Document Uploaded"}
                        </Text>
                      }
                      description={
                        <>
                          <Text type="secondary" style={{ fontSize: 12 }}>{formatTime(item.createdAt)}</Text>
                        </>
                      }
                    />
                    <Tag color={item.type === 'law' ? 'processing' : 'warning'}>
                      {item.type === 'law' ? 'Law' : 'Judgment'}
                    </Tag>
                  </List.Item>
                )}
                locale={{ emptyText: "No recent activity found." }}
              />
            </Card>
          </Col>
        </Row>

        {/* Disclaimer */}
        <Card
          style={{
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderLeft: '4px solid #3b82f6',
            borderRadius: 6,
          }}
        >
          <Paragraph style={{ margin: 0, color: '#64748b' }}>
            <Text strong>Disclaimer:</Text> <b>VIDHORA</b> is a legal assistance tool and is not a replacement for professional legal advice. Always consult with a qualified attorney for important legal matters.
          </Paragraph>
        </Card>
      </Content>
      <Modal
        title={
          <Space>
            {selectedActivity?.type === 'law' ? <RiseOutlined style={{ color: '#3b82f6' }} /> : <SafetyOutlined style={{ color: '#f59e0b' }} />}
            <span style={{ fontWeight: 600 }}>{selectedActivity?.type === 'law' ? 'Law Simplifier' : 'Judgment Simplifier'} Details</span>
          </Space>
        }
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={[
          <Button key="close" type="primary" onClick={handleCloseModal}>
            Close
          </Button>,
        ]}
        width={700}
        bodyStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
        className="hide-scrollbar-modal"
        style={{ top: 20 }}
      >
        {selectedActivity && (
          <Space direction="vertical" style={{ width: '100%', marginTop: 16 }} size="large">
            <Card size="small" style={{ background: '#f8fafc', borderRadius: 8, border: 'none' }}>
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>Original Input</Text>
              </div>
              <Text strong style={{ fontSize: 15 }}>{selectedActivity.userQuery || 'Document Uploaded'}</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color="blue">{formatTime(selectedActivity.createdAt)}</Tag>
              </div>
            </Card>

            <div>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>Simplified Output</Text>
              </div>
              <Card
                size="small"
                style={{
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: 6,
                }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => <h1 style={{ textAlign: 'left', color: '#0f172a' }} {...props} />,
                    h2: ({ node, ...props }) => <h2 style={{ textAlign: 'left', color: '#0f172a' }} {...props} />,
                    h3: ({ node, ...props }) => <h3 style={{ textAlign: 'left', marginTop: '16px', marginBottom: '8px', color: '#0f172a' }} {...props} />,
                    h4: ({ node, ...props }) => <h4 style={{ textAlign: 'left', color: '#0f172a' }} {...props} />,
                    p: ({ node, ...props }) => <p style={{ textAlign: 'left', marginBottom: '8px', marginTop: 0, color: '#0f172a' }} {...props} />,
                    ul: ({ node, ...props }) => <ul style={{ marginLeft: '20px', paddingLeft: '0px' }} {...props} />,
                    ol: ({ node, ...props }) => <ol style={{ marginLeft: '20px', paddingLeft: '0px' }} {...props} />,
                    li: ({ node, ...props }) => <li style={{ marginBottom: '4px', paddingLeft: '0px' }} {...props} />,
                  }}
                  style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}
                >
                  {selectedActivity.aiResponse}
                </ReactMarkdown>
              </Card>
            </div>
          </Space>
        )}
      </Modal>

    </Layout>
  );
};

export default Dashboard;
