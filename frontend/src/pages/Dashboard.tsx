import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space } from 'antd';
import { 
  ShoppingCartOutlined, 
  DollarOutlined, 
  PackageOutlined, 
  UsersOutlined,
  AlertOutlined,
  TrendingUpOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { getDashboardStats } from '../api/dashboard';
import { getLowStockProducts } from '../api/product';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadLowStockProducts();
  }, []);

  const loadStats = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadLowStockProducts = async () => {
    try {
      const response = await getLowStockProducts();
      setLowStockProducts(response.data || []);
    } catch (error) {
      console.error('Failed to load low stock products:', error);
    }
  };

  const columns = [
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 150,
    },
    {
      title: '当前库存',
      dataIndex: 'stock_qty',
      key: 'stock_qty',
      width: 100,
      render: (text: number, record: any) => (
        <Tag color={text <= record.min_stock ? 'red' : 'orange'}>
          {text}
        </Tag>
      ),
    },
    {
      title: '最低库存',
      dataIndex: 'min_stock',
      key: 'min_stock',
      width: 100,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>仪表盘</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="产品总数"
              value={stats.product_count || 0}
              prefix={<PackageOutlined />}
              valueStyle={{ color: '#0071e3' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="供应商数量"
              value={stats.supplier_count || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#34c759' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="客户数量"
              value={stats.customer_count || 0}
              prefix={<UsersOutlined />}
              valueStyle={{ color: '#5856d6' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="总库存"
              value={stats.total_stock || 0}
              prefix={<PackageOutlined />}
              valueStyle={{ color: '#ff9500' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="采购总额"
              value={stats.purchase_total || 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#ff3b30' }}
              formatter={(value: number) => `¥${value.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="销售总额"
              value={stats.sales_total || 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#34c759' }}
              formatter={(value: number) => `¥${value.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="待审核采购"
              value={stats.pending_purchases || 0}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#ffcc00' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic
              title="待审核销售"
              value={stats.pending_sales || 0}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#ff9500' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title={`低库存预警 (${lowStockProducts.length})`} hoverable>
        {lowStockProducts.length > 0 ? (
          <Table
            dataSource={lowStockProducts}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#86868b' }}>
            <PackageOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>暂无低库存产品</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;