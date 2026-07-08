import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message, DatePicker } from 'antd';
import { PlusOutlined, CheckOutlined, PackageOutlined, SearchOutlined } from '@ant-design/icons';
import { getPurchases, createPurchase, approvePurchase, receivePurchase } from '../../api/purchase';
import { getSuppliers } from '../../api/supplier';
import { getProducts } from '../../api/product';

const PurchaseList: React.FC = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [items, setItems] = useState<any[]>([{ product_id: null, quantity: 1, unit_price: 0 }]);

  useEffect(() => {
    loadPurchases();
    loadSuppliers();
    loadProducts();
  }, [page, size, searchText]);

  const loadPurchases = async () => {
    try {
      const response = await getPurchases({ page, size, order_no: searchText });
      setPurchases(response.data.list || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load purchases:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await getSuppliers({ page: 1, size: 100 });
      setSuppliers(response.data.list || []);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createPurchase({ ...values, items });
      message.success('创建成功');
      setModalVisible(false);
      loadPurchases();
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

  const columns = [
    { title: '采购单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '供应商', dataIndex: 'supplier', key: 'supplier', render: (val: any) => val?.name },
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
            <Button icon={<PackageOutlined />} onClick={() => handleReceive(record.id)}>入库</Button>
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
      
      <Input.Search
        placeholder="搜索采购单号"
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onSearch={() => setPage(1)}
        style={{ marginBottom: 16, width: 300 }}
      />
      
      <Table
        dataSource={purchases}
        columns={columns}
        rowKey="id"
        pagination={{ current: page, pageSize: size, total, onChange: (p, s) => { setPage(p); setSize(s); } }}
      />

      <Modal
        title="新增采购单"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="supplier_id" label="供应商" rules={[{ required: true }]}>
            <Select placeholder="选择供应商">
              {suppliers.map(s => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="purchase_date" label="采购日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea />
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: 16 }}>
          <h4 style={{ marginBottom: 12 }}>采购明细</h4>
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

export default PurchaseList;