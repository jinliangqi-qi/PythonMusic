import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message, DatePicker, Drawer, Descriptions, Row, Col, Statistic, Divider, Popconfirm } from 'antd';
import { PlusOutlined, CheckOutlined, TruckOutlined, CheckCircleOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined, CloseOutlined, DollarOutlined } from '@ant-design/icons';
import { getSales, getSalesOrder, createSales, updateSales, approveSales, shipSales, completeSales, cancelSales, receiveSalesPayment, deleteSales } from '../../api/sales';
import { getCustomers, getAllCustomers } from '../../api/customer';
import { getProducts, getAllProducts } from '../../api/product';
import dayjs from 'dayjs';

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
      message.success('完成订单');
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
      'pending': 'orange',
      'approved': 'blue',
      'shipped': 'cyan',
      'paid': 'purple',
      'completed': 'green',
      'cancelled': 'red',
    };
    const labels: Record<string, string> = {
      'pending': '待审核',
      'approved': '已审核',
      'shipped': '已发货',
      'paid': '已收款',
      'completed': '已完成',
      'cancelled': '已取消',
    };
    return <Tag color={colors[status]}>{labels[status] || status}</Tag>;
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
    { title: '销售单号', dataIndex: 'order_no', key: 'order_no', width: 160 },
    { title: '客户', dataIndex: 'customer', key: 'customer', width: 150, render: (val: any) => val?.name },
    { 
      title: '总金额', 
      dataIndex: 'total_amount', 
      key: 'total_amount', 
      width: 120,
      render: (val: number) => `¥${val?.toLocaleString() || 0}` 
    },
    { 
      title: '已收款', 
      dataIndex: 'paid_amount', 
      key: 'paid_amount', 
      width: 120,
      render: (val: number) => `¥${val?.toLocaleString() || 0}` 
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (val: string) => getStatusTag(val) },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180, render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 360,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>详情</Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record.id)}>审核</Button>
          )}
          {record.status === 'approved' && (
            <Button type="link" size="small" icon={<TruckOutlined />} onClick={() => handleShip(record.id)}>发货</Button>
          )}
          {record.status === 'shipped' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleComplete(record.id)}>完成</Button>
          )}
          {record.status !== 'cancelled' && record.status !== 'completed' && (
            <Button type="link" size="small" icon={<DollarOutlined />} onClick={() => handleReceivePayment(record)}>收款</Button>
          )}
          {record.status === 'pending' && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          )}
          {record.status !== 'cancelled' && record.status !== 'completed' && (
            <Popconfirm title="确定取消该订单？" onConfirm={() => handleCancel(record.id)}>
              <Button type="link" size="small" danger icon={<CloseOutlined />}>取消</Button>
            </Popconfirm>
          )}
          {record.status === 'pending' && (
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>销售管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增销售单</Button>
      </div>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input.Search
          placeholder="搜索销售单号"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={() => setPage(1)}
          style={{ width: 250 }}
          allowClear
        />
        <Select
          placeholder="状态筛选"
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          style={{ width: 150 }}
          allowClear
        >
          <Select.Option value="pending">待审核</Select.Option>
          <Select.Option value="approved">已审核</Select.Option>
          <Select.Option value="shipped">已发货</Select.Option>
          <Select.Option value="paid">已收款</Select.Option>
          <Select.Option value="completed">已完成</Select.Option>
          <Select.Option value="cancelled">已取消</Select.Option>
        </Select>
        <Select
          placeholder="客户筛选"
          value={customerFilter}
          onChange={(v) => { setCustomerFilter(v); setPage(1); }}
          style={{ width: 200 }}
          allowClear
          showSearch
          optionFilterProp="children"
        >
          {customers.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
        </Select>
        <Button onClick={handleReset}>重置</Button>
      </div>
      
      <Table
        dataSource={sales}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{ current: page, pageSize: size, total, onChange: (p, s) => { setPage(p); setSize(s); } }}
      />

      <Modal
        title={editingOrder ? '编辑销售单' : '新增销售单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer_id" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
                <Select placeholder="选择客户" showSearch optionFilterProp="children">
                  {customers.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="delivery_date" label="预计发货日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0 }}>销售明细</h4>
            <span style={{ color: '#666' }}>合计: <strong style={{ color: '#f5222d' }}>¥{getTotalAmount().toLocaleString()}</strong></span>
          </div>
          {items.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <Select
                placeholder="选择产品"
                value={item.product_id}
                onChange={(value) => updateItem(index, 'product_id', value)}
                style={{ flex: 2, minWidth: 150 }}
                showSearch
                optionFilterProp="children"
              >
                {products.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
              </Select>
              <InputNumber
                placeholder="数量"
                value={item.quantity}
                onChange={(value) => updateItem(index, 'quantity', value)}
                min={1}
                style={{ flex: 1, minWidth: 80 }}
              />
              <InputNumber
                placeholder="单价"
                value={item.unit_price}
                onChange={(value) => updateItem(index, 'unit_price', value)}
                min={0}
                step={0.01}
                style={{ flex: 1, minWidth: 80 }}
              />
              <span style={{ width: 80, textAlign: 'right' }}>¥{((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}</span>
              {items.length > 1 && (
                <Button type="text" danger onClick={() => removeItem(index)}>删除</Button>
              )}
            </div>
          ))}
          <Button onClick={addItem} style={{ marginTop: 8 }}>添加商品</Button>
        </div>
      </Modal>

      <Drawer
        title="销售单详情"
        placement="right"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentOrder && (
          <div>
            <Descriptions title="基本信息" bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="销售单号">{currentOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(currentOrder.status)}</Descriptions.Item>
              <Descriptions.Item label="客户">{currentOrder.customer?.name}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(currentOrder.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="预计发货">{currentOrder.delivery_date ? dayjs(currentOrder.delivery_date).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{dayjs(currentOrder.updated_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            </Descriptions>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Statistic title="订单总金额" value={currentOrder.total_amount} prefix="¥" />
              </Col>
              <Col span={12}>
                <Statistic title="已收款金额" value={currentOrder.paid_amount || 0} prefix="¥" />
              </Col>
            </Row>
            <p style={{ color: '#666', marginBottom: 16 }}>
              待收款: <strong style={{ color: '#f5222d' }}>¥{(currentOrder.total_amount - (currentOrder.paid_amount || 0)).toLocaleString()}</strong>
            </p>

            <Divider orientation="left">商品明细</Divider>
            <Table
              dataSource={currentOrder.items || []}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: '产品', dataIndex: 'product_name', key: 'product_name' },
                { title: 'SKU', dataIndex: 'product_sku', key: 'product_sku', width: 100 },
                { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
                { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 100, render: (v: number) => `¥${v}` },
                { title: '金额', dataIndex: 'amount', key: 'amount', width: 110, render: (v: number) => `¥${v?.toLocaleString() || 0}` },
                { title: '已发货', dataIndex: 'shipped_qty', key: 'shipped_qty', width: 80 },
              ]}
            />

            {currentOrder.remark && (
              <>
                <Divider orientation="left">备注</Divider>
                <p style={{ color: '#666' }}>{currentOrder.remark}</p>
              </>
            )}

            <Divider />
            <Space>
              {currentOrder.status === 'pending' && (
                <Button type="primary" icon={<CheckOutlined />} onClick={() => { handleApprove(currentOrder.id); setDetailVisible(false); }}>审核通过</Button>
              )}
              {currentOrder.status === 'approved' && (
                <Button type="primary" icon={<TruckOutlined />} onClick={() => { handleShip(currentOrder.id); setDetailVisible(false); }}>确认发货</Button>
              )}
              {currentOrder.status === 'shipped' && (
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => { handleComplete(currentOrder.id); setDetailVisible(false); }}>完成订单</Button>
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
        width={400}
      >
        <Form form={payForm} layout="vertical">
          <Form.Item label="订单号">
            <span>{currentOrder?.order_no}</span>
          </Form.Item>
          <Form.Item label="订单总额">
            <span>¥{currentOrder?.total_amount?.toLocaleString() || 0}</span>
          </Form.Item>
          <Form.Item label="已收款">
            <span>¥{currentOrder?.paid_amount?.toLocaleString() || 0}</span>
          </Form.Item>
          <Form.Item label="待收款">
            <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
              ¥{((currentOrder?.total_amount || 0) - (currentOrder?.paid_amount || 0)).toLocaleString()}
            </span>
          </Form.Item>
          <Form.Item name="amount" label="收款金额" rules={[{ required: true, message: '请输入收款金额' }]}>
            <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SalesList;
