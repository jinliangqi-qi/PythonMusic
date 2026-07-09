import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message, Card, Typography, Statistic, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, PackageOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { getInventory, adjustInventory } from '../../api/inventory';
import { getProducts } from '../../api/product';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const InventoryList: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [changeTypeFilter, setChangeTypeFilter] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInventory();
    loadProducts();
  }, [page, size, changeTypeFilter]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const params: any = { page, size };
      if (changeTypeFilter) params.change_type = changeTypeFilter;
      const response: any = await getInventory(params);
      setInventory(response.list || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response: any = await getProducts({ page: 1, size: 100 });
      setProducts(response.list || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleAdjust = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await adjustInventory(values);
      message.success('调整成功');
      setModalVisible(false);
      loadInventory();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleReset = () => {
    setChangeTypeFilter(undefined);
    setPage(1);
  };

  const getChangeTypeTag = (type: string) => {
    const colors: Record<string, string> = {
      'purchase': 'success',
      'sale': 'error',
      'adjust': 'purple',
      'inventory': 'warning',
    };
    const labels: Record<string, string> = {
      'purchase': '采购入库',
      'sale': '销售出库',
      'adjust': '库存调整',
      'inventory': '盘点',
    };
    return <Tag color={colors[type]} style={{ padding: '4px 12px', fontSize: 13 }}>{labels[type]}</Tag>;
  };

  const stats = {
    totalIn: inventory.filter(i => i.change_qty > 0).reduce((sum, i) => sum + i.change_qty, 0),
    totalOut: inventory.filter(i => i.change_qty < 0).reduce((sum, i) => sum + Math.abs(i.change_qty), 0),
  };

  const columns = [
    { 
      title: '产品', 
      dataIndex: 'product', 
      key: 'product', 
      width: 200,
      render: (val: any) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>{val?.name}</Text>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{val?.sku}</div>
        </div>
      ),
    },
    { 
      title: '变动类型', 
      dataIndex: 'change_type', 
      key: 'change_type', 
      width: 120, 
      render: (val: string) => getChangeTypeTag(val) 
    },
    { 
      title: '变动数量', 
      dataIndex: 'change_qty', 
      key: 'change_qty', 
      width: 140,
      render: (val: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {val > 0 ? <ArrowUpOutlined style={{ color: '#10b981' }} /> : <ArrowDownOutlined style={{ color: '#ef4444' }} />}
          <Text strong style={{ color: val > 0 ? '#10b981' : '#ef4444', fontSize: 15 }}>
            {val > 0 ? `+${val}` : val}
          </Text>
        </div>
      ),
    },
    { 
      title: '变动后库存', 
      dataIndex: 'after_qty', 
      key: 'after_qty', 
      width: 140,
      render: (val: number) => <Text strong style={{ fontSize: 14 }}>{val}</Text>
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 200, ellipsis: true },
    { title: '操作时间', dataIndex: 'created_at', key: 'created_at', width: 180, render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm') },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>库存管理</Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 6, display: 'block' }}>查看库存变动记录、进行库存调整</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdjust}
          size="large"
          style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
        >
          库存调整
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card style={{ border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: '#d1fae5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ArrowUpOutlined style={{ fontSize: 24, color: '#10b981' }} />
              </div>
              <div>
                <Text style={{ fontSize: 13, color: '#64748b' }}>本期入库</Text>
                <Statistic value={stats.totalIn} valueStyle={{ fontSize: 28, fontWeight: 700, color: '#10b981' }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ArrowDownOutlined style={{ fontSize: 24, color: '#ef4444' }} />
              </div>
              <div>
                <Text style={{ fontSize: 13, color: '#64748b' }}>本期出库</Text>
                <Statistic value={stats.totalOut} valueStyle={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: '#e0e7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <PackageOutlined style={{ fontSize: 24, color: '#6366f1' }} />
              </div>
              <div>
                <Text style={{ fontSize: 13, color: '#64748b' }}>变动记录</Text>
                <Statistic value={total} valueStyle={{ fontSize: 28, fontWeight: 700, color: '#6366f1' }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      
      <Card style={{ marginBottom: 24, border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)', borderRadius: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select
            placeholder="变动类型"
            value={changeTypeFilter}
            onChange={(v) => { setChangeTypeFilter(v); setPage(1); }}
            style={{ width: 180 }}
            allowClear
            bordered={false}
            size="large"
          >
            <Select.Option value="purchase">采购入库</Select.Option>
            <Select.Option value="sale">销售出库</Select.Option>
            <Select.Option value="adjust">库存调整</Select.Option>
            <Select.Option value="inventory">盘点</Select.Option>
          </Select>
          <Button 
            onClick={handleReset}
            bordered={false}
            style={{ color: '#64748b' }}
          >
            重置筛选
          </Button>
        </div>
      </Card>
      
      <Card style={{ border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)', borderRadius: 16 }}>
        <Table
          dataSource={inventory}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{ 
            current: page, 
            pageSize: size, 
            total, 
            onChange: (p, s) => { setPage(p); setSize(s); },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
          size="middle"
        />
      </Card>

      <Modal
        title="库存调整"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={550}
        destroyOnClose
        okText="确认调整"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="product_id" label="产品" rules={[{ required: true, message: '请选择产品' }]}>
            <Select placeholder="选择产品" showSearch optionFilterProp="children" size="large">
              {products.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="adjust_qty" label="调整数量" rules={[{ required: true, message: '请输入调整数量' }]}>
            <InputNumber 
              placeholder="正数增加，负数减少" 
              style={{ width: '100%' }} 
              size="large"
              min={-999999}
            />
          </Form.Item>
          <Form.Item name="reason" label="调整原因">
            <Select placeholder="选择原因" size="large">
              <Select.Option value="damage">损坏</Select.Option>
              <Select.Option value="loss">丢失</Select.Option>
              <Select.Option value="overage">盘盈</Select.Option>
              <Select.Option value="shortage">盘亏</Select.Option>
              <Select.Option value="transfer">调拨</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryList;