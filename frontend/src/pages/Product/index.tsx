import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message, Popconfirm, Image } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { getProducts, createProduct, updateProduct, deleteProduct, getAllProducts } from '../../api/product';
import { getAllSuppliers } from '../../api/supplier';
import { getAllCategories } from '../../api/category';
import CommonUpload from '../../components/CommonUpload';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
    loadSuppliers();
    loadCategories();
  }, [page, size, searchText, categoryFilter, statusFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response: any = await getProducts({ 
        page, 
        size, 
        name: searchText, 
        category: categoryFilter,
        status: statusFilter,
      });
      setProducts(response.list || response.data?.list || []);
      setTotal(response.total || response.data?.total || 0);
    } catch (error) {
      console.error('Failed to load products:', error);
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

  const loadCategories = async () => {
    try {
      const response: any = await getAllCategories();
      setCategories(response || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', min_stock: 10 });
    setImageUrl('');
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingProduct(record);
    form.setFieldsValue(record);
    setImageUrl(record.image || '');
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
      const submitData = { ...values, image: imageUrl };
      if (editingProduct) {
        await updateProduct(editingProduct.id, submitData);
        message.success('更新成功');
      } else {
        await createProduct(submitData);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadProducts();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleUploadSuccess = (path: string) => {
    setImageUrl(path);
  };

  const handleReset = () => {
    setSearchText('');
    setCategoryFilter(undefined);
    setStatusFilter(undefined);
    setPage(1);
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `/uploads/${path.replace(/^uploads\//, '')}`;
  };

  const columns = [
    { 
      title: '图片', 
      dataIndex: 'image', 
      key: 'image', 
      width: 80,
      render: (val: string) => val ? (
        <Image 
          width={50} 
          height={50} 
          src={getImageUrl(val)} 
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZGVkZWRlIi8+PC9zdmc+"
        />
      ) : <div style={{ width: 50, height: 50, background: '#f5f5f5', borderRadius: 4 }} />,
    },
    { title: '产品名称', dataIndex: 'name', key: 'name' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    { title: '分类', dataIndex: 'category', key: 'category', width: 120 },
    { title: '采购价', dataIndex: 'purchase_price', key: 'purchase_price', width: 100, render: (val: number) => `¥${val?.toFixed(2) || 0}` },
    { title: '销售价', dataIndex: 'sale_price', key: 'sale_price', width: 100, render: (val: number) => `¥${val?.toFixed(2) || 0}` },
    { title: '库存', dataIndex: 'stock_qty', key: 'stock_qty', width: 80, render: (val: number, record: any) => (
      <Tag color={val <= record.min_stock ? 'red' : 'green'}>{val}</Tag>
    )},
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (val: string) => (
      <Tag color={val === 'active' ? 'green' : 'gray'}>{val === 'active' ? '启用' : '停用'}</Tag>
    )},
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
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
      
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input.Search
          placeholder="搜索产品名称/SKU"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={() => setPage(1)}
          style={{ width: 250 }}
          allowClear
        />
        <Select
          placeholder="分类筛选"
          value={categoryFilter}
          onChange={(v) => { setCategoryFilter(v); setPage(1); }}
          style={{ width: 150 }}
          allowClear
        >
          {categories.map((c: any) => <Select.Option key={c.id} value={c.name}>{c.name}</Select.Option>)}
        </Select>
        <Select
          placeholder="状态筛选"
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          style={{ width: 120 }}
          allowClear
        >
          <Select.Option value="active">启用</Select.Option>
          <Select.Option value="inactive">停用</Select.Option>
        </Select>
        <Button onClick={handleReset}>重置</Button>
      </div>
      
      <Table
        dataSource={products}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{ current: page, pageSize: size, total, onChange: (p, s) => { setPage(p); setSize(s); } }}
      />

      <Modal
        title={editingProduct ? '编辑产品' : '新增产品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={650}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Form.Item name="name" label="产品名称" rules={[{ required: true, message: '请输入产品名称' }]}>
                <Input placeholder="产品名称" />
              </Form.Item>
              <Form.Item name="sku" label="SKU编码" rules={[{ required: true, message: '请输入SKU' }]}>
                <Input placeholder="SKU编码" />
              </Form.Item>
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="category" label="分类" style={{ flex: 1 }}>
                  <Select placeholder="选择分类" allowClear showSearch optionFilterProp="children">
                    {categories.map((c: any) => <Select.Option key={c.id} value={c.name}>{c.name}</Select.Option>)}
                  </Select>
                </Form.Item>
                <Form.Item name="unit" label="单位" style={{ flex: 1 }}>
                  <Input placeholder="个/件/箱" />
                </Form.Item>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="purchase_price" label="采购价" style={{ flex: 1 }}>
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="¥" />
                </Form.Item>
                <Form.Item name="sale_price" label="销售价" style={{ flex: 1 }}>
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="¥" />
                </Form.Item>
                <Form.Item name="cost_price" label="成本价" style={{ flex: 1 }}>
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="¥" />
                </Form.Item>
              </div>
              <Form.Item name="supplier_id" label="供应商">
                <Select placeholder="选择供应商" showSearch optionFilterProp="children">
                  {suppliers.map(s => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}
                </Select>
              </Form.Item>
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item name="min_stock" label="最低库存" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="max_stock" label="最高库存" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </div>
              <Form.Item name="status" label="状态">
                <Select>
                  <Select.Option value="active">启用</Select.Option>
                  <Select.Option value="inactive">停用</Select.Option>
                </Select>
              </Form.Item>
            </div>
            <div style={{ width: 160 }}>
              <Form.Item label="产品图片">
                <div style={{ marginBottom: 8 }}>
                  {imageUrl ? (
                    <Image 
                      width={140} 
                      height={140} 
                      src={getImageUrl(imageUrl)} 
                      style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #d9d9d9' }}
                      fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQwIiBoZWlnaHQ9IjE0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTQwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjcwIiB5PSI3NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1zaXplPSIxMiI+5Zu+54mH5Zu+54mH5a2Q5LqGPC90ZXh0Pjwvc3ZnPg=="
                    />
                  ) : (
                    <div style={{ width: 140, height: 140, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12 }}>
                      暂无图片
                    </div>
                  )}
                </div>
                <CommonUpload 
                  accept="image/*" 
                  maxSize={5} 
                  onSuccess={handleUploadSuccess} 
                />
                {imageUrl && (
                  <Button type="link" danger size="small" onClick={() => setImageUrl('')} style={{ padding: 0, marginTop: 4 }}>
                    移除图片
                  </Button>
                )}
              </Form.Item>
            </div>
          </div>
          <Form.Item name="description" label="产品描述">
            <Input.TextArea rows={3} placeholder="产品描述信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductList;
