import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message, Popconfirm, Image, Card, Typography, Avatar, Badge, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UploadOutlined, PackageOutlined, EyeOutlined } from '@ant-design/icons';
import { getProducts, createProduct, updateProduct, deleteProduct, getAllProducts } from '../../api/product';
import { getAllSuppliers } from '../../api/supplier';
import { getAllCategories } from '../../api/category';
import CommonUpload from '../../components/CommonUpload';

const { Title, Text } = Typography;

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
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [viewingProduct, setViewingProduct] = useState<any>(null);
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

  const handleView = (record: any) => {
    setViewingProduct(record);
    setViewModalVisible(true);
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
      title: '产品图片', 
      dataIndex: 'image', 
      key: 'image', 
      width: 80,
      render: (val: string) => val ? (
        <Avatar 
          src={getImageUrl(val)} 
          size={56}
          style={{ borderRadius: 10, objectFit: 'cover', border: '2px solid #e2e8f0' }}
        />
      ) : (
        <Avatar 
          icon={<PackageOutlined />} 
          size={56}
          style={{ 
            borderRadius: 10, 
            background: '#e0e7ff', 
            color: '#6366f1' 
          }}
        />
      ),
    },
    { 
      title: '产品信息', 
      dataIndex: 'name', 
      key: 'name',
      width: 220,
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{text}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{record.sku}</div>
          {record.category && (
            <Tag color="purple" style={{ marginTop: 6, fontSize: 11 }}>{record.category}</Tag>
          )}
        </div>
      ),
    },
    { 
      title: '价格', 
      key: 'price', 
      width: 180,
      render: (_, record: any) => (
        <div>
          <div style={{ color: '#ef4444', fontWeight: 600, fontSize: 15 }}>¥{record.sale_price?.toFixed(2) || 0}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>采购: ¥{record.purchase_price?.toFixed(2) || 0}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>成本: ¥{record.cost_price?.toFixed(2) || 0}</div>
        </div>
      ),
    },
    { 
      title: '库存', 
      dataIndex: 'stock_qty', 
      key: 'stock_qty', 
      width: 140, 
      render: (val: number, record: any) => {
        const isLowStock = val <= record.min_stock;
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge 
                status={isLowStock ? 'error' : 'success'} 
                style={{ borderRadius: 4 }}
              />
              <span style={{ fontSize: 16, fontWeight: 600, color: isLowStock ? '#ef4444' : '#1e293b' }}>
                {val} {record.unit || ''}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              最低库存: {record.min_stock}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              最高库存: {record.max_stock || '-'}
            </div>
          </div>
        );
      },
    },
    { title: '供应商', dataIndex: 'supplier', key: 'supplier', width: 140, render: (val: any) => val?.name || '-' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100, 
      render: (val: string) => (
        <Tag color={val === 'active' ? 'success' : 'default'} style={{ padding: '4px 12px', fontSize: 13 }}>
          {val === 'active' ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm 
            title="确定删除该产品？" 
            description="删除后无法恢复，请谨慎操作"
            onConfirm={() => handleDelete(record.id)}
            okText="确认删除"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>产品管理</Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 6, display: 'block' }}>管理产品信息、库存和价格</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreate}
          size="large"
          style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
        >
          新增产品
        </Button>
      </div>
      
      <Card style={{ marginBottom: 24, border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)', borderRadius: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <Input.Search
              placeholder="搜索产品名称/SKU"
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={() => setPage(1)}
              allowClear
              style={{ width: '100%', maxWidth: 320 }}
            />
          </div>
          <Select
            placeholder="选择分类"
            value={categoryFilter}
            onChange={(v) => { setCategoryFilter(v); setPage(1); }}
            style={{ width: 160 }}
            allowClear
            showSearch
            optionFilterProp="children"
            bordered={false}
            size="large"
          >
            {categories.map((c: any) => <Select.Option key={c.id} value={c.name}>{c.name}</Select.Option>)}
          </Select>
          <Select
            placeholder="状态"
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            style={{ width: 140 }}
            allowClear
            bordered={false}
            size="large"
          >
            <Select.Option value="active">启用</Select.Option>
            <Select.Option value="inactive">停用</Select.Option>
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
          dataSource={products}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
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
        title={editingProduct ? '编辑产品' : '新增产品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={800}
        destroyOnClose
        style={{ borderRadius: 16 }}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item name="name" label="产品名称" rules={[{ required: true, message: '请输入产品名称' }]}>
                    <Input placeholder="产品名称" size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="sku" label="SKU编码" rules={[{ required: true, message: '请输入SKU' }]}>
                    <Input placeholder="SKU编码" size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="category" label="分类">
                    <Select placeholder="选择分类" allowClear showSearch optionFilterProp="children" size="large">
                      {categories.map((c: any) => <Select.Option key={c.id} value={c.name}>{c.name}</Select.Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="unit" label="单位">
                    <Input placeholder="个/件/箱" size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="purchase_price" label="采购价">
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="¥" size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="cost_price" label="成本价">
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="¥" size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="sale_price" label="销售价">
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="¥" size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="supplier_id" label="供应商">
                    <Select placeholder="选择供应商" showSearch optionFilterProp="children" size="large">
                      {suppliers.map(s => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="status" label="状态">
                    <Select size="large">
                      <Select.Option value="active">启用</Select.Option>
                      <Select.Option value="inactive">停用</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="min_stock" label="最低库存">
                    <InputNumber min={0} style={{ width: '100%' }} size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="max_stock" label="最高库存">
                    <InputNumber min={0} style={{ width: '100%' }} size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="stock_qty" label="当前库存">
                    <InputNumber min={0} style={{ width: '100%' }} size="large" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="description" label="产品描述">
                <Input.TextArea rows={3} placeholder="产品描述信息" />
              </Form.Item>
            </div>
            <div style={{ width: 200 }}>
              <Form.Item label="产品图片">
                <div style={{ marginBottom: 16 }}>
                  {imageUrl ? (
                    <Image 
                      width={180} 
                      height={180} 
                      src={getImageUrl(imageUrl)} 
                      style={{ objectFit: 'cover', borderRadius: 12, border: '2px solid #e2e8f0' }}
                      fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iI2UyZThmMCIvPjx0ZXh0IHg9IjkwIiB5PSI5NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2U2ZTdmZiIgZm9udC1zaXplPSIxNiIvPjwvc3ZnPg=="
                    />
                  ) : (
                    <div style={{ 
                      width: 180, 
                      height: 180, 
                      background: '#f8fafc',
                      borderRadius: 12, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      border: '2px dashed #cbd5e1'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <PackageOutlined style={{ fontSize: 36, color: '#94a3b8', marginBottom: 8 }} />
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>上传图片</div>
                        <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 4 }}>支持 JPG/PNG</div>
                      </div>
                    </div>
                  )}
                </div>
                <CommonUpload 
                  accept="image/*" 
                  maxSize={5} 
                  onSuccess={handleUploadSuccess} 
                />
                {imageUrl && (
                  <Button type="text" danger size="small" onClick={() => setImageUrl('')} style={{ padding: 0, marginTop: 8 }}>
                    移除图片
                  </Button>
                )}
              </Form.Item>
            </div>
          </div>
        </Form>
      </Modal>

      <Modal
        title="产品详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={600}
        destroyOnClose
        footer={null}
      >
        {viewingProduct && (
          <div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
              {viewingProduct.image ? (
                <Image 
                  width={160} 
                  height={160} 
                  src={getImageUrl(viewingProduct.image)} 
                  style={{ objectFit: 'cover', borderRadius: 12 }}
                />
              ) : (
                <div style={{ 
                  width: 160, 
                  height: 160, 
                  background: '#f8fafc',
                  borderRadius: 12, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px solid #e2e8f0'
                }}>
                  <PackageOutlined style={{ fontSize: 40, color: '#94a3b8' }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <Title level={3} style={{ marginBottom: 8 }}>{viewingProduct.name}</Title>
                <div style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'monospace', marginBottom: 12 }}>{viewingProduct.sku}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {viewingProduct.category && <Tag color="purple">{viewingProduct.category}</Tag>}
                  <Tag color={viewingProduct.status === 'active' ? 'success' : 'default'}>
                    {viewingProduct.status === 'active' ? '启用' : '停用'}
                  </Tag>
                </div>
              </div>
            </div>
            
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 14, color: '#64748b' }}>采购价</Text>
                <Text style={{ fontSize: 14, fontWeight: 500 }}>¥{viewingProduct.purchase_price?.toFixed(2) || 0}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 14, color: '#64748b' }}>成本价</Text>
                <Text style={{ fontSize: 14, fontWeight: 500 }}>¥{viewingProduct.cost_price?.toFixed(2) || 0}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: '#64748b' }}>销售价</Text>
                <Text style={{ fontSize: 18, fontWeight: 600, color: '#ef4444' }}>¥{viewingProduct.sale_price?.toFixed(2) || 0}</Text>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ flex: 1, background: '#f8fafc', borderRadius: 12, padding: 20 }}>
                <Text style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 8 }}>库存信息</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#1e293b' }}>{viewingProduct.stock_qty}</div>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>当前库存 ({viewingProduct.unit || ''})</Text>
              </div>
              <div style={{ flex: 1, background: '#f8fafc', borderRadius: 12, padding: 20 }}>
                <Text style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 8 }}>供应商</Text>
                <div style={{ fontSize: 16, fontWeight: 500, color: '#1e293b' }}>{viewingProduct.supplier?.name || '-'}</div>
              </div>
            </div>
            
            {viewingProduct.description && (
              <div style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 8 }}>产品描述</Text>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8 }}>{viewingProduct.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductList;