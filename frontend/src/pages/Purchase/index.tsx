import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message, DatePicker, Drawer, Descriptions, Row, Col, Statistic, Divider, Popconfirm } from 'antd';
import { PlusOutlined, CheckOutlined, PackageOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined, CloseOutlined, DollarOutlined } from '@ant-design/icons';
import { getPurchases, getPurchase, createPurchase, updatePurchase, approvePurchase, receivePurchase, cancelPurchase, payPurchase, deletePurchase } from '../../api/purchase';
import { getSuppliers, getAllSuppliers } from '../../api/supplier';
import { getProducts, getAllProducts } from '../../api/product';
import dayjs from 'dayjs';

const PurchaseList: React.FC = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [supplierFilter, setSupplierFilter] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<any>(null);
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
    loadPurchases();
    loadSuppliers();
    loadProducts();
  }, [page, size, searchText, statusFilter, supplierFilter, dateRange]);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const params: any = { page, size, order_no: searchText };
      if (statusFilter) params.status = statusFilter;
      if (supplierFilter) params.supplier_id = supplierFilter;
      const response: any = await getPurchases(params);
      setPurchases(response.list || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to load purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response: any = await getAllSuppliers();
      setSuppliers(response || []);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
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
    const detail: any = await getPurchase(record.id);
    form.setFieldsValue({
      supplier_id: detail.supplier_id,
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
      const detail: any = await getPurchase(id);
      setCurrentOrder(detail);
      setDetailVisible(true);
    } catch (error) {
      console.error('Failed to load detail:', error);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approvePurchase(id);
      message.success('审核成功');
      loadPurchases();
    } catch (error) {
      message.error('审核失败');
    }
  };

  const handleReceive = async (id: number) => {
    try {
      await receivePurchase(id);
      message.success('入库成功');
      loadPurchases();
    } catch (error) {
      message.error('入库失败');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelPurchase(id);
      message.success('取消成功');
      loadPurchases();
    } catch (error) {
      message.error('取消失败');
    }
  };

  const handlePay = (record: any) => {
    setCurrentOrder(record);
    payForm.setFieldsValue({ amount: record.total_amount - record.paid_amount });
    setPayVisible(true);
  };

  const handlePaySubmit = async () => {
    try {
      const values = await payForm.validateFields();
      await payPurchase(currentOrder.id, values.amount);
      message.success('付款成功');
      setPayVisible(false);
      loadPurchases();
      if (detailVisible) handleViewDetail(currentOrder.id);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePurchase(id);
      message.success('删除成功');
      loadPurchases();
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
        await updatePurchase(editingOrder.id, submitData);
        message.success('更新成功');
      } else {
        await createPurchase(submitData);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadPurchases();
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
        newItems[index].unit_price = product.purchase_price || 0;
      }
    }
    setItems(newItems);
  };

  const getStatusTag = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'orange',
      'approved': 'blue',
      'delivered': 'cyan',
      'paid': 'purple',
      'completed': 'green',
      'cancelled': 'red',
    };
    const labels: Record<string, string> = {
      'pending': '待审核',
      'approved': '已审核',
      'delivered': '已到货',
      'paid': '已付款',
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
    setSupplierFilter(undefined);
    setDateRange(null);
    setPage(1);
  };

  const columns = [
    { title: '采购单号', dataIndex: 'order_no', key: 'order_no', width: 160 },
    { title: '供应商', dataIndex: 'supplier', key: 'supplier', width: 150, render: (val: any) => val?.name },
    { 
      title: '总金额', 
      dataIndex: 'total_amount', 
      key: 'total_amount', 
      width: 120,
      render: (val: number) => `¥${val?.toLocaleString() || 0}` 
    },
    { 
      title: '已付款', 
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
      width: 320,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>详情</Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record.id)}>审核</Button>
          )}
          {record.status === 'approved' && (
            <Button type="link" size="small" icon={<PackageOutlined />} onClick={() => handleReceive(record.id)}>入库</Button>
          )}
          {record.status !== 'cancelled' && record.status !== 'completed' && (
            <Button type="link" size="small" icon={<DollarOutlined />} onClick={() => handlePay(record)}>付款</Button>
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
        <h2 style={{ margin: 0 }}>采购管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增采购单</Button>
      </div>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input.Search
          placeholder="搜索采购单号"
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
          <Select.Option value="delivered">已到货</Select.Option>
          <Select.Option value="paid">已付款</Select.Option>
          <Select.Option value="completed">已完成</Select.Option>
          <Select.Option value="cancelled">已取消</Select.Option>
        </Select>
        <Select
          placeholder="供应商筛选"
          value={supplierFilter}
          onChange={(v) => { setSupplierFilter(v); setPage(1); }}
          style={{ width: 200 }}
          allowClear
          showSearch
          optionFilterProp="children"
        >
          {suppliers.map(s => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}
        </Select>
        <Button onClick={handleReset}>重置</Button>
      </div>
      
      <Table
        dataSource={purchases}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{ current: page, pageSize: size, total, onChange: (p, s) => { setPage(p); setSize(s); } }}
      />

      <Modal
        title={editingOrder ? '编辑采购单' : '新增采购单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="supplier_id" label="供应商" rules={[{ required: true, message: '请选择供应商' }]}>
                <Select placeholder="选择供应商" showSearch optionFilterProp="children">
                  {suppliers.map(s => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="delivery_date" label="预计交货日期">
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
            <h4 style={{ margin: 0 }}>采购明细</h4>
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
        title="采购单详情"
        placement="right"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentOrder && (
          <div>
            <Descriptions title="基本信息" bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="采购单号">{currentOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(currentOrder.status)}</Descriptions.Item>
              <Descriptions.Item label="供应商">{currentOrder.supplier?.name}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(currentOrder.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="预计交货">{currentOrder.delivery_date ? dayjs(currentOrder.delivery_date).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{dayjs(currentOrder.updated_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            </Descriptions>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Statistic title="订单总金额" value={currentOrder.total_amount} prefix="¥" />
              </Col>
              <Col span={12}>
                <Statistic title="已付款金额" value={currentOrder.paid_amount || 0} prefix="¥" />
              </Col>
            </Row>
            <p style={{ color: '#666', marginBottom: 16 }}>
              待付款: <strong style={{ color: '#f5222d' }}>¥{(currentOrder.total_amount - (currentOrder.paid_amount || 0)).toLocaleString()}</strong>
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
                { title: '已收货', dataIndex: 'received_qty', key: 'received_qty', width: 80 },
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
                <Button type="primary" icon={<PackageOutlined />} onClick={() => { handleReceive(currentOrder.id); setDetailVisible(false); }}>确认入库</Button>
              )}
              {currentOrder.status !== 'cancelled' && currentOrder.status !== 'completed' && (
                <Button icon={<DollarOutlined />} onClick={() => handlePay(currentOrder)}>付款</Button>
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
        title="付款"
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
          <Form.Item label="已付款">
            <span>¥{currentOrder?.paid_amount?.toLocaleString() || 0}</span>
          </Form.Item>
          <Form.Item label="待付款">
            <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
              ¥{((currentOrder?.total_amount || 0) - (currentOrder?.paid_amount || 0)).toLocaleString()}
            </span>
          </Form.Item>
          <Form.Item name="amount" label="付款金额" rules={[{ required: true, message: '请输入付款金额' }]}>
            <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PurchaseList;
