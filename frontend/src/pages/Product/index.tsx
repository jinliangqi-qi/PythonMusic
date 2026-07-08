import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../api/product';
import { getSuppliers } from '../../api/supplier';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProducts();
    loadSuppliers();
  }, [page, size, searchText]);

  const loadProducts = async () => {
    try {
      const response = await getProducts({ page, size, name: searchText });
      setProducts(response.data.list || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load products:', error);
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

  const handleCreate = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingProduct(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteProduct(id);
      message.success('删除成功');
      loadProducts();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingProduct) {
        await updateProduct(editingProduct.id, values);
        message.success('更新成功');
      } else {
        await createProduct(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadProducts();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '产品名称', dataIndex: 'name', key: 'name' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '采购价', dataIndex: 'purchase_price', key: 'purchase_price', render: (val: number) => `¥${val}` },
    { title: '销售价', dataIndex: 'sale_price', key: 'sale_price', render: (val: number) => `¥${val}` },
    { title: '库存', dataIndex: 'stock_qty', key: 'stock_qty', render: (val: number, record: any) => (
      <Tag color={val <= record.min_stock ? 'red' : 'green'}>{val}</Tag>
    )},
    { title: '状态', dataIndex: 'status', key: 'status', render: (val: string) => (
      <Tag color={val === 'active' ? 'green' : 'gray'}>{val === 'active' ? '启用' : '停用'}</Tag>
    )},
    {
      title: '操作',
      key: 'action',
      render: (text: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>产品管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增产品</Button>
      </div>
      
      <Input.Search
        placeholder="搜索产品名称"
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onSearch={() => setPage(1)}
        style={{ marginBottom: 16, width: 300 }}
      />
      
      <Table
        dataSource={products}
        columns={columns}
        rowKey="id"
        pagination={{ current: page, pageSize: size, total, onChange: (p, s) => { setPage(p); setSize(s); } }}
      />

      <Modal
        title={editingProduct ? '编辑产品' : '新增产品'}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="产品名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sku" label="SKU" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Input />
          </Form.Item>
          <Form.Item name="unit" label="单位">
            <Input />
          </Form.Item>
          <Form.Item name="purchase_price" label="采购价">
            <InputNumber min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="sale_price" label="销售价">
            <InputNumber min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="cost_price" label="成本价">
            <InputNumber min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="supplier_id" label="供应商">
            <Select placeholder="选择供应商">
              {suppliers.map(s => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="min_stock" label="最低库存">
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="max_stock" label="最高库存">
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductList;