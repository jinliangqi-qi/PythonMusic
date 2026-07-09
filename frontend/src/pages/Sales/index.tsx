import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message, DatePicker, Drawer, Descriptions, Row, Col, Statistic, Divider, Popconfirm, Card, Typography } from 'antd';
import { PlusOutlined, CheckOutlined, TruckOutlined, CheckCircleOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined, CloseOutlined, DollarOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { getSales, getSalesOrder, createSales, updateSales, approveSales, shipSales, completeSales, cancelSales, receiveSalesPayment, deleteSales } from '../../api/sales';
import { getCustomers, getAllCustomers } from '../../api/customer';
import { getProducts, getAllProducts } from '../../api/product';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const SalesList: React.FC = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [customerFilter, setCustomerFilter] = useState<number | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [payVisible, setPayVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [form] = Form.useForm();
  const [payForm] = Form.useForm();
  const [items, setItems] = useState<any[]>([{ product_id: null, quantity: 1, unit_price: 0 }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSales();
    loadCustomers();
    loadProducts();
  }, [page, size, searchText, statusFilter, customerFilter]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const params: any = { page, size, order_no: searchText };
      if (statusFilter) params.status = statusFilter;
      if (customerFilter) params.customer_id = customerFilter;
      const response: any = await getSales(params);
      setSales(response.list || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to load sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response: any = await getAllCustomers();
      setCustomers(response || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response: any = await getAllProducts();
      setProducts(response.list || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleCreate = () => {
    setEditingOrder(null);
    setItems([{ product_id: null, quantity: 1, unit_price: 0 }]);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = async (record: any) => {
    setEditingOrder(record);
    const detail: any = await getSalesOrder(record.id);
    form.setFieldsValue({
      customer_id: detail.customer_id,
      remark: detail.remark,
      delivery_date: detail.delivery_date ? dayjs(detail.delivery_date) : null,
    });
    setItems(detail.items?.map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      remark: item.remark,
    })) || []);
    setModalVisible(true);
  };

  const handleViewDetail = async (id: number) => {
    try {
      const detail: any = await getSalesOrder(id);
      setCurrentOrder(detail);
      setDetailVisible(true);
    } catch (error) {
      console.error('Failed to load detail:', error);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveSales(id);
      message.success('审核成功');
      loadSales();
    } catch (error) {
      message.error('审核失败');
    }
  };

  const handleShip = async (id: number) => {
    try {
      await shipSales(id);
      message.success('发货成功');
      loadSales();
    } catch (error) {
      message.error('发货失败');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await completeSales(id);
      message.success('订单完成');
      loadSales();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelSales(id);
      message.success('取消成功');
      loadSales();
    } catch (error) {
      message.error('取消失败');
    }
  };

  const handleReceivePayment = (record: any) => {
    setCurrentOrder(record);
    payForm.setFieldsValue({ amount: record.total_amount - record.paid_amount });
    setPayVisible(true);
  };

  const handlePaySubmit = async () => {
    try {
      const values = await payForm.validateFields();
      await receiveSalesPayment(currentOrder.id, values.amount);
      message.success('收款成功');
      setPayVisible(false);
      loadSales();
      if (detailVisible) handleViewDetail(currentOrder.id);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSales(id);
      message.success('删除成功');
      loadSales();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        delivery_date: values.delivery_date ? values.delivery_date.format('YYYY-MM-DD') : null,
        items: items.filter((item: any) => item.product_id),
      };
      
      if (editingOrder) {
        await updateSales(editingOrder.id, submitData);
        message.success('更新成功');
      } else {
        await createSales(submitData);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadSales();
    } catch (error) {
      console.error('Submit failed:', error);
    }
  };

  const addItem = () => {
    setItems([...items, { product_id: null, quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unit_price = product.sale_price || 0;
      }
    }
    setItems(newItems);
  };

  const getStatusTag = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'warning',
      'approved': 'processing',
      'shipped': 'info',
      'paid': 'purple',
      'completed': 'success',
      'cancelled': 'error',
    };
    const labels: Record<string, string> = {
      'pending': '待审核',
      'approved': '已审核',
      'shipped': '已发货',
      'paid': '已收款',
      'completed': '已完成',
      'cancelled': '已取消',
    };
    return <Tag color={colors[status]} style={{ padding: '4px 12px', fontSize: 13 }}>{labels[status] || status}</Tag>;
  };

  const getTotalAmount = () => {
    return items.reduce((sum: number, item: any) => sum + (item.quantity || 0) * (item.unit_price || 0), 0);
  };

  const handleReset = () => {
    setSearchText('');
    setStatusFilter(undefined);
    setCustomerFilter(undefined);
    setPage(1);
  };

  const columns = [
    { 
      title: '销售单号', 
      dataIndex: 'order_no', 
      key: 'order_no', 
      width: 170,
      render: (text: string) => <Text code style={{ fontSize: 13, color: '#6366f1' }}>{text}</Text>
    },
    { title: '客户', dataIndex: 'customer', key: 'customer', width: 150, render: (val: any) => val?.name },
    { 
      title: '总金额', 
      dataIndex: 'total_amount', 
      key: 'total_amount', 
      width: 130,
      render: (val: number) => <Text strong style={{ color: '#10b981', fontSize: 15, fontWeight: 600 }}>¥{val?.toLocaleString() || 0}</Text>
    },
    { 
      title: '已收款', 
      dataIndex: 'paid_amount', 
      key: 'paid_amount', 
      width: 120,
      render: (val: number) => <Text style={{ fontSize: 14 }}>¥{val?.toLocaleString() || 0}</Text>
    },
    { 
      title: '待收款', 
      key: 'unpaid', 
      width: 120,
      render: (_: any, record: any) => <Text strong style={{ color: '#f59e0b', fontSize: 14 }}>¥{((record.total_amount || 0) - (record.paid_amount || 0)).toLocaleString()}</Text>
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 110, render: (val: string) => getStatusTag(val) },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180, render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>详情</Button>
          {record.status === 'pending' && (
            <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record.id)}>审核</Button>
          )}
          {record.status === 'approved' && (
            <Button type="primary" size="small" icon={<TruckOutlined />} onClick={() => handleShip(record.id)}>发货</Button>
          )}
          {record.status === 'shipped' && (
            <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => handleComplete(record.id)}>完成</Button>
          )}
          {record.status !== 'cancelled' && record.status !== 'completed' && (
            <Button size="small" icon={<DollarOutlined />} onClick={() => handleReceivePayment(record)}>收款</Button>
          )}
          {record.status === 'pending' && (
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          )}
          {record.status !== 'cancelled' && record.status !== 'completed' && (
            <Popconfirm title="确定取消该订单？" onConfirm={() => handleCancel(record.id)}>
              <Button type="text" size="small" danger icon={<CloseOutlined />}>取消</Button>
            </Popconfirm>
          )}
          {record.status === 'pending' && (
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>销售订单</Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 6, display: 'block' }}>管理销售订单、审核和发货</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreate}
          size="large"
          style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
        >
          新增销售单
        </Button>
      </div>
      
      <Card style={{ marginBottom: 24, border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)', borderRadius: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <Input.Search
              placeholder="搜索销售单号"
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={() => setPage(1)}
              allowClear
              style={{ width: '100%', maxWidth: 320 }}
            />
          </div>
          <Select
            placeholder="状态"
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            style={{ width: 160 }}
            allowClear
            bordered={false}
            size="large"
          >
            <Select.Option value="pending">待审核</Select.Option>
            <Select.Option value="approved">已审核</Select.Option>
            <Select.Option value="shipped">已发货</Select.Option>
            <Select.Option value="paid">已收款</Select.Option>
            <Select.Option value="completed">已完成</Select.Option>
            <Select.Option value="cancelled">已取消</Select.Option>
          </Select>
          <Select
            placeholder="客户"
            value={customerFilter}
            onChange={(v) => { setCustomerFilter(v); setPage(1); }}
            style={{ width: 200 }}
            allowClear
            showSearch
            optionFilterProp="children"
            bordered={false}
            size="large"
          >
            {customers.map(s => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}
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
          dataSource={sales}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
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
        title={editingOrder ? '编辑销售单' : '新增销售单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={750}
        destroyOnClose
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item name="customer_id" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
                <Select placeholder="选择客户" showSearch optionFilterProp="children" size="large">
                  {customers.map(s => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="delivery_date" label="预计交货日期">
                <DatePicker style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} placeholder="备注信息" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
        
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCartOutlined style={{ fontSize: 18, color: '#6366f1' }} />
              <span style={{ fontWeight: 600, fontSize: 15 }}>销售明细</span>
            </div>
            <span style={{ color: '#64748b', fontSize: 14 }}>
              合计: <strong style={{ color: '#10b981', fontSize: 18 }}>¥{getTotalAmount().toLocaleString()}</strong>
            </span>
          </div>
          {items.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
              <Select
                placeholder="选择产品"
                value={item.product_id}
                onChange={(value) => updateItem(index, 'product_id', value)}
                style={{ flex: 2, minWidth: 200 }}
                showSearch
                optionFilterProp="children"
                size="large"
              >
                {products.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
              </Select>
              <InputNumber
                placeholder="数量"
                value={item.quantity}
                onChange={(value) => updateItem(index, 'quantity', value)}
                min={1}
                style={{ flex: 1, minWidth: 120 }}
                size="large"
              />
              <InputNumber
                placeholder="单价"
                value={item.unit_price}
                onChange={(value) => updateItem(index, 'unit_price', value)}
                min={0}
                step={0.01}
                style={{ flex: 1, minWidth: 120 }}
                prefix="¥"
                size="large"
              />
              <span style={{ width: 110, textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                ¥{((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}
              </span>
              {items.length > 1 && (
                <Button type="text" danger icon={<CloseOutlined />} onClick={() => removeItem(index)} />
              )}
            </div>
          ))}
          <Button onClick={addItem} style={{ marginTop: 8 }} icon={<PlusOutlined />}>添加商品</Button>
        </div>
      </Modal>

      <Drawer
        title="销售单详情"
        placement="right"
        width={700}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentOrder && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <Text code style={{ fontSize: 16, color: '#6366f1', fontWeight: 600 }}>{currentOrder.order_no}</Text>
                  <div style={{ marginTop: 4 }}>
                    {getStatusTag(currentOrder.status)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>创建时间</div>
                  <div style={{ fontSize: 14 }}>{dayjs(currentOrder.created_at).format('YYYY-MM-DD HH:mm')}</div>
                </div>
              </div>
              
              <Descriptions title="基本信息" bordered column={2} size="small" style={{ marginBottom: 20 }}>
                <Descriptions.Item label="客户">{currentOrder.customer?.name}</Descriptions.Item>
                <Descriptions.Item label="联系人">{currentOrder.customer?.contact_person || '-'}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{currentOrder.customer?.phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="预计交货">{currentOrder.delivery_date ? dayjs(currentOrder.delivery_date).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{dayjs(currentOrder.updated_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                <Descriptions.Item label="备注">{currentOrder.remark || '-'}</Descriptions.Item>
              </Descriptions>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
              <Col span={12}>
                <Card size="small" style={{ border: 'none', background: '#d1fae5', borderRadius: 12 }}>
                  <Statistic title="订单总金额" value={currentOrder.total_amount} prefix="¥" valueStyle={{ color: '#10b981', fontWeight: 700, fontSize: 24 }} />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ border: 'none', background: '#dbeafe', borderRadius: 12 }}>
                  <Statistic title="已收款金额" value={currentOrder.paid_amount || 0} prefix="¥" valueStyle={{ color: '#3b82f6', fontWeight: 700, fontSize: 24 }} />
                </Card>
              </Col>
            </Row>
            
            <div style={{ background: '#fef3c7', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#92400e' }}>待收款金额</Text>
                <Text style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
                  ¥{(currentOrder.total_amount - (currentOrder.paid_amount || 0)).toLocaleString()}
                </Text>
              </div>
            </div>

            <Divider titlePlacement="start">商品明细</Divider>
            <Table
              dataSource={currentOrder.items || []}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: '产品', dataIndex: 'product_name', key: 'product_name' },
                { title: 'SKU', dataIndex: 'product_sku', key: 'product_sku', width: 120 },
                { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
                { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 100, render: (v: number) => `¥${v}` },
                { title: '金额', dataIndex: 'amount', key: 'amount', width: 120, render: (v: number) => <Text strong>¥{v?.toLocaleString() || 0}</Text> },
                { title: '已发货', dataIndex: 'shipped_qty', key: 'shipped_qty', width: 80 },
              ]}
            />

            <Divider />
            <Space>
              {currentOrder.status === 'pending' && (
                <Button type="primary" icon={<CheckOutlined />} onClick={() => { handleApprove(currentOrder.id); setDetailVisible(false); }}>审核通过</Button>
              )}
              {currentOrder.status === 'approved' && (
                <Button type="primary" icon={<TruckOutlined />} onClick={() => { handleShip(currentOrder.id); setDetailVisible(false); }}>确认发货</Button>
              )}
              {currentOrder.status === 'shipped' && (
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => { handleComplete(currentOrder.id); setDetailVisible(false); }}>确认完成</Button>
              )}
              {currentOrder.status !== 'cancelled' && currentOrder.status !== 'completed' && (
                <Button icon={<DollarOutlined />} onClick={() => handleReceivePayment(currentOrder)}>收款</Button>
              )}
              {currentOrder.status !== 'cancelled' && currentOrder.status !== 'completed' && (
                <Popconfirm title="确定取消该订单？" onConfirm={() => { handleCancel(currentOrder.id); setDetailVisible(false); }}>
                  <Button danger icon={<CloseOutlined />}>取消订单</Button>
                </Popconfirm>
              )}
            </Space>
          </div>
        )}
      </Drawer>

      <Modal
        title="收款"
        open={payVisible}
        onOk={handlePaySubmit}
        onCancel={() => setPayVisible(false)}
        width={480}
        okText="确认收款"
        cancelText="取消"
      >
        <Form form={payForm} layout="vertical">
          <div style={{ marginBottom: 20, padding: 20, background: '#f8fafc', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text type="secondary">订单号</Text>
              <Text strong code>{currentOrder?.order_no}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text type="secondary">订单总额</Text>
              <Text>¥{currentOrder?.total_amount?.toLocaleString() || 0}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text type="secondary">已收款</Text>
              <Text>¥{currentOrder?.paid_amount?.toLocaleString() || 0}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e2e8f0', paddingTop: 12 }}>
              <Text type="secondary" style={{ fontWeight: 500 }}>待收款</Text>
              <Text strong style={{ color: '#f59e0b', fontSize: 18 }}>
                ¥{((currentOrder?.total_amount || 0) - (currentOrder?.paid_amount || 0)).toLocaleString()}
              </Text>
            </div>
          </div>
          <Form.Item name="amount" label="收款金额" rules={[{ required: true, message: '请输入收款金额' }]}>
            <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} prefix="¥" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SalesList;