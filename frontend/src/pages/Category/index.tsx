import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message, Popconfirm, Card, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/category';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [page, size, searchText, statusFilter]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const params: any = { page, size, name: searchText };
      if (statusFilter) params.status = statusFilter;
      const response: any = await getCategories(params);
      setCategories(response.list || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', sort_order: 0 });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,
      sort_order: record.sort_order,
      parent_id: record.parent_id,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id);
      message.success('删除成功');
      loadCategories();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await updateCategory(editingId, values);
        message.success('更新成功');
      } else {
        await createCategory(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadCategories();
    } catch (error) {
      console.error('Submit failed:', error);
    }
  };

  const handleReset = () => {
    setSearchText('');
    setStatusFilter(undefined);
    setPage(1);
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { 
      title: '分类编码', 
      dataIndex: 'code', 
      key: 'code', 
      width: 150,
      render: (text: string) => <Text code style={{ fontSize: 13, color: '#6366f1' }}>{text}</Text>
    },
    { 
      title: '分类名称', 
      dataIndex: 'name', 
      key: 'name',
      width: 200,
      render: (text: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderOutlined style={{ fontSize: 16, color: '#6366f1' }} />
          <Text strong style={{ fontSize: 14 }}>{text}</Text>
        </div>
      ),
    },
    { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 80 },
    { 
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: string) => (
        <Tag color={val === 'active' ? 'success' : 'error'} style={{ padding: '4px 12px', fontSize: 13 }}>
          {val === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180, render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
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
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>分类管理</Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 6, display: 'block' }}>管理产品分类、层级结构</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreate}
          size="large"
          style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
        >
          新增分类
        </Button>
      </div>
      
      <Card style={{ marginBottom: 24, border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)', borderRadius: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <Input.Search
              placeholder="搜索分类名称"
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
            <Select.Option value="active">启用</Select.Option>
            <Select.Option value="inactive">禁用</Select.Option>
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
          dataSource={categories}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 900 }}
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
        title={editingId ? '编辑分类' : '新增分类'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={550}
        destroyOnClose
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="请输入分类名称" size="large" />
          </Form.Item>
          <Form.Item name="code" label="分类编码">
            <Input placeholder="请输入分类编码" size="large" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} size="large" />
          </Form.Item>
          <Form.Item name="parent_id" label="父级分类">
            <Select placeholder="请选择父级分类" allowClear size="large">
              {categories.filter(c => c.id !== editingId).map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select size="large">
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryList;