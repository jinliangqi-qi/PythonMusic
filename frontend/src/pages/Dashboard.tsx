import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space, Typography, Progress, Button, Avatar, Divider } from 'antd';
import { 
  PackageOutlined, 
  TeamOutlined, 
  UserOutlined,
  StockOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  AlertCircleOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  ZapOutlined,
  TargetOutlined,
  ActivityOutlined,
  RefreshOutlined,
} from '@ant-design/icons';
import { getDashboardStats } from '../api/dashboard';
import { getLowStockProducts } from '../api/product';

const { Title, Text, Paragraph } = Typography;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadStats();
    loadLowStockProducts();
  }, [refreshKey]);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadLowStockProducts = async () => {
    try {
      const data = await getLowStockProducts();
      setLowStockProducts((data as any) || []);
    } catch (error) {
      console.error('Failed to load low stock products:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const columns = [
    {
      title: '产品',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text: string, record: any) => (
        <Space>
          {record.image ? (
            <Avatar 
              src={record.image} 
              size={44}
              style={{ borderRadius: 8, objectFit: 'cover' }}
            />
          ) : (
            <Avatar 
              icon={<PackageOutlined />} 
              size={44}
              style={{ 
                borderRadius: 8, 
                background: '#e0e7ff', 
                color: '#6366f1' 
              }}
            />
          )}
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{record.sku}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '当前库存',
      dataIndex: 'stock_qty',
      key: 'stock_qty',
      width: 120,
      render: (text: number, record: any) => (
        <div>
          <Tag color={text <= record.min_stock ? 'error' : 'warning'} style={{ fontSize: 14, padding: '4px 14px' }}>
            {text} {record.unit || ''}
          </Tag>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>最低: {record.min_stock}</div>
        </div>
      ),
    },
    {
      title: '库存预警',
      dataIndex: 'stock_qty',
      key: 'stock_ratio',
      width: 180,
      render: (text: number, record: any) => {
        const ratio = Math.min((text / record.min_stock) * 100, 100);
        return (
          <div>
            <Progress 
              percent={Math.round(ratio)} 
              size="default" 
              strokeColor={ratio <= 30 ? '#ef4444' : ratio <= 60 ? '#f59e0b' : '#10b981'}
              strokeWidth={8}
              format={(percent) => `${percent}%`}
            />
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
              {ratio <= 30 ? '紧急补货' : ratio <= 60 ? '即将缺货' : '库存正常'}
            </div>
          </div>
        );
      },
    },
  ];

  const statCards = [
    {
      title: '产品总数',
      value: stats.product_count || 0,
      icon: <PackageOutlined />,
      color: '#6366f1',
      bgColor: '#e0e7ff',
      trend: '+12%',
      trendType: 'up',
    },
    {
      title: '供应商数量',
      value: stats.supplier_count || 0,
      icon: <TeamOutlined />,
      color: '#10b981',
      bgColor: '#d1fae5',
      trend: '+5%',
      trendType: 'up',
    },
    {
      title: '客户数量',
      value: stats.customer_count || 0,
      icon: <UserOutlined />,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      trend: '+8%',
      trendType: 'up',
    },
    {
      title: '总库存',
      value: stats.total_stock || 0,
      icon: <StockOutlined />,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      trend: '-3%',
      trendType: 'down',
    },
    {
      title: '采购总额',
      value: stats.purchase_total || 0,
      icon: <ShoppingCartOutlined />,
      color: '#ef4444',
      bgColor: '#fee2e2',
      formatter: (v: number) => `¥${Number(v).toLocaleString()}`,
      trend: '+25%',
      trendType: 'up',
    },
    {
      title: '销售总额',
      value: stats.sales_total || 0,
      icon: <DollarOutlined />,
      color: '#3b82f6',
      bgColor: '#dbeafe',
      formatter: (v: number) => `¥${Number(v).toLocaleString()}`,
      trend: '+18%',
      trendType: 'up',
    },
  ];

  const recentActivities = [
    { id: 1, type: 'sale', icon: <DollarOutlined />, title: '销售订单完成', desc: '订单 SO20240115003 已完成', time: '5分钟前', color: '#10b981' },
    { id: 2, type: 'purchase', icon: <ShoppingCartOutlined />, title: '采购订单到货', desc: '订单 PO20240115008 已到货', time: '15分钟前', color: '#3b82f6' },
    { id: 3, type: 'stock', icon: <StockOutlined />, title: '库存预警', desc: '3个产品库存低于预警值', time: '30分钟前', color: '#f59e0b' },
    { id: 4, type: 'approve', icon: <ClockCircleOutlined />, title: '订单待审核', desc: '1笔销售订单待审核', time: '1小时前', color: '#ef4444' },
    { id: 5, type: 'customer', icon: <UserOutlined />, title: '新客户注册', desc: '客户 张三 已注册', time: '2小时前', color: '#8b5cf6' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>数据看板</Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <CalendarOutlined style={{ color: '#94a3b8', fontSize: 14 }} />
            <Text type="secondary" style={{ fontSize: 14 }}>
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </Text>
          </div>
        </div>
        <Space>
          <Tag color="success" style={{ fontSize: 13, padding: '5px 14px' }}>
            <CheckCircleOutlined style={{ marginRight: 6, fontSize: 14 }} />
            系统运行正常
          </Tag>
          <Button 
            type="primary" 
            icon={<RefreshOutlined />} 
            onClick={handleRefresh}
            ghost
            style={{ borderRadius: 8 }}
          >
            刷新数据
          </Button>
        </Space>
      </div>
      
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {statCards.map((stat, index) => (
          <Col span={8} key={index}>
            <Card 
              hoverable
              style={{ 
                border: 'none',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: 16,
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div 
                  style={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: 16, 
                    background: stat.bgColor,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${stat.color}20`,
                  }}
                >
                  {React.cloneElement(stat.icon, { style: { fontSize: 28, color: stat.color } })}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{stat.title}</Text>
                    <Tag 
                      color={stat.trendType === 'up' ? 'success' : 'error'} 
                      style={{ fontSize: 11, padding: '2px 8px' }}
                    >
                      {stat.trendType === 'up' ? <ArrowUpOutlined style={{ fontSize: 10, marginRight: 2 }} /> : <ArrowDownOutlined style={{ fontSize: 10, marginRight: 2 }} />}
                      {stat.trend}
                    </Tag>
                  </div>
                  <Statistic 
                    value={stat.value} 
                    formatter={stat.formatter}
                    valueStyle={{ fontSize: 32, fontWeight: 700, color: '#1e293b' }}
                    style={{ margin: 0 }}
                  />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={20}>
        <Col span={17}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 4,
                  height: 20,
                  borderRadius: 2,
                  background: '#ef4444',
                }} />
                <span style={{ fontWeight: 600, fontSize: 16 }}>低库存预警</span>
                <Tag color="error" style={{ fontSize: 12, padding: '3px 10px', marginLeft: 'auto' }}>
                  <AlertCircleOutlined style={{ marginRight: 4 }} />
                  {lowStockProducts.length} 个产品需补货
                </Tag>
              </div>
            }
            style={{ 
              border: 'none', 
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
              borderRadius: 16,
            }}
            bodyStyle={{ padding: '0' }}
          >
            {lowStockProducts.length > 0 ? (
              <Table
                dataSource={lowStockProducts}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 4 }}
                size="middle"
                style={{ margin: 0 }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                <div style={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  background: '#d1fae5',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <CheckCircleOutlined style={{ fontSize: 40, color: '#10b981' }} />
                </div>
                <Title level={4} style={{ marginBottom: 8, color: '#334155' }}>暂无低库存产品</Title>
                <Paragraph style={{ margin: 0, fontSize: 14 }}>所有产品库存充足，请继续保持</Paragraph>
              </div>
            )}
          </Card>
        </Col>
        
        <Col span={7}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 4,
                  height: 20,
                  borderRadius: 2,
                  background: '#6366f1',
                }} />
                <span style={{ fontWeight: 600, fontSize: 16 }}>库存概览</span>
              </div>
            }
            style={{ 
              border: 'none', 
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
              borderRadius: 16,
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ space: 16 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ActivityOutlined style={{ color: '#6366f1' }} />
                    <Text style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>库存周转率</Text>
                  </div>
                  <Text style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>68%</Text>
                </div>
                <Progress 
                  percent={68} 
                  strokeColor={{
                    '0%': '#6366f1',
                    '100%': '#8b5cf6',
                  }}
                  size="default"
                  strokeWidth={10}
                  format={() => ''}
                />
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircleOutlined style={{ color: '#ef4444' }} />
                    <Text style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>缺货率</Text>
                  </div>
                  <Text style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>3%</Text>
                </div>
                <Progress 
                  percent={3} 
                  strokeColor="#ef4444"
                  size="default"
                  strokeWidth={10}
                  format={() => ''}
                />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TargetOutlined style={{ color: '#10b981' }} />
                    <Text style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>安全库存达标率</Text>
                  </div>
                  <Text style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>95%</Text>
                </div>
                <Progress 
                  percent={95} 
                  strokeColor={{
                    '0%': '#10b981',
                    '100%': '#34d399',
                  }}
                  size="default"
                  strokeWidth={10}
                  format={() => ''}
                />
              </div>
            </div>
          </Card>
          
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 4,
                  height: 20,
                  borderRadius: 2,
                  background: '#f59e0b',
                }} />
                <span style={{ fontWeight: 600, fontSize: 16 }}>今日动态</span>
              </div>
            }
            style={{ 
              border: 'none', 
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
              borderRadius: 16,
              marginTop: 20,
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Space direction="vertical" style={{ width: '100%', gap: 0 }}>
              {recentActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12,
                    padding: '12px 0',
                    borderBottom: activity.id !== recentActivities.length ? '1px solid #f1f5f9' : 'none',
                    transition: 'all 0.2s',
                    hover: { background: '#f8fafc', paddingLeft: 8 },
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${activity.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {React.cloneElement(activity.icon, { style: { fontSize: 16, color: activity.color } })}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>{activity.title}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activity.desc}
                    </div>
                  </div>
                  <Text style={{ fontSize: 11, color: '#cbd5e1', flexShrink: 0 }}>{activity.time}</Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={20} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 4,
                  height: 20,
                  borderRadius: 2,
                  background: '#10b981',
                }} />
                <span style={{ fontWeight: 600, fontSize: 16 }}>采购待办</span>
              </div>
            }
            style={{ 
              border: 'none', 
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
              borderRadius: 16,
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: '#ef4444' }}>{stats.pending_purchases || 0}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>待审核</div>
              </div>
              <Divider type="vertical" style={{ height: 60 }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: '#f59e0b' }}>{stats.pending_purchases || 0}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>待入库</div>
              </div>
              <Divider type="vertical" style={{ height: 60 }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: '#3b82f6' }}>{stats.pending_purchases || 0}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>待付款</div>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 4,
                  height: 20,
                  borderRadius: 2,
                  background: '#3b82f6',
                }} />
                <span style={{ fontWeight: 600, fontSize: 16 }}>销售待办</span>
              </div>
            }
            style={{ 
              border: 'none', 
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
              borderRadius: 16,
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: '#ef4444' }}>{stats.pending_sales || 0}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>待审核</div>
              </div>
              <Divider type="vertical" style={{ height: 60 }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: '#f59e0b' }}>{stats.pending_sales || 0}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>待发货</div>
              </div>
              <Divider type="vertical" style={{ height: 60 }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: '#f59e0b' }}>{stats.pending_sales || 0}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>待收款</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;