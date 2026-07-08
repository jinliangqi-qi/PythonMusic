import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message, DatePicker } from 'antd';
import { PlusOutlined, CheckOutlined, TruckOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { getSales, createSales, approveSales, shipSales, completeSales } from '../../api/sales';
import { getCustomers } from '../../api/customer';
import { getProducts } from '../../api/product';

const SalesList: React.FC = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [items, setItems] = useState<any[]>([{ product_id: null, quantity: 1, unit_price: 0 }]);

  useEffect(() => {
    loadSales();
    loadCustomers();
    loadProducts();
  }, [page, size, searchText]);

  const loadSales = async () => {
    try {
      const response = await getSales({ page, size, order_no: searchText });
      setSales(response.data.list || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load sales:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await getCustomers({ page: 1, size: 100 });
      setCustomers(response.data.list || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await getProducts({ page: 1, size: 100 });
      setProducts(response.data.list || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleCreate = () => {
    setItems([{ product_id: null, quantity: 1, unit_price: 0 }]);
    form.resetFields();
    setModalVisible(true);
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createSales({ ...values, items });
      message.success('创建成功');
      setModalVisible(false);
      loadSales();
    } catch (error) {
      message.error('操作失败');
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

  const columns = [
    { title: '销售单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '客户', dataIndex: 'customer', key: 'customer', render: (val: any) => val?.name },
    { title: '总金额', dataIndex: 'total_amount', key: 'total_amount', render: (val: number) => `¥${val}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (val: string) => getStatusTag(val) },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (text: any, record: any) => (
        <Space>
          {record.status === 'pending' && (
            <Button icon={<CheckOutlined />} onClick={() => handleApprove(record.id)}>审核</Button>
          )}
          {record.status === 'approved' && (
            <Button icon={<TruckOutlined />} onClick={() => handleShip(record.id)}>发货</Button>
          )}
          {record.status === 'shipped' && (
            <Button icon={<CheckCircleOutlined />} onClick={() => handleComplete(record.id)}>完成</Button>
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
      
      <Input.Search
        placeholder="搜索销售单号"
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onSearch={() => setPage(1)}
        style={{ marginBottom: 16, width: 300 }}
      />
      
      <Table
        dataSource={sales}
        columns={columns}
        rowKey="id"
        pagination={{ current: page, pageSize: size, total, onChange: (p, s) => { setPage(p); setSize(s); } }}
      />

      <Modal
        title="新增销售单"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="customer_id" label="客户" rules={[{ required: true }]}>
            <Select placeholder="选择客户">
              {customers.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="sale_date" label="销售日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea />
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: 16 }}>
          <h4 style={{ marginBottom: 12 }}>销售明细</h4>
          {items.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Select
                placeholder="选择产品"
                value={item.product_id}
                onChange={(value) => updateItem(index, 'product_id', value)}
                style={{ width: 150 }}
              >
                {products.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
              </Select>
              <InputNumber
                placeholder="数量"
                value={item.quantity}
                onChange={(value) => updateItem(index, 'quantity', value)}
                min={1}
                style={{ width: 100 }}
              />
              <InputNumber
                placeholder="单价"
                value={item.unit_price}
                onChange={(value) => updateItem(index, 'unit_price', value)}
                min={0}
                step={0.01}
                style={{ width: 100 }}
              />
              {items.length > 1 && (
                <Button type="danger" onClick={() => removeItem(index)}>删除</Button>
              )}
            </div>
          ))}
          <Button onClick={addItem} style={{ marginTop: 8 }}>添加商品</Button>
        </div>
      </Modal>
    </div>
  );
};

export default SalesList;