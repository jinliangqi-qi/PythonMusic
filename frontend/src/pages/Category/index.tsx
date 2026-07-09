import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/category';
import dayjs from 'dayjs';

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
      const response: any = await getCategories({ page, size, name: searchText, status: statusFilter });
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

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '分类编码', dataIndex: 'code', key: 'code', width: 150 },
    { title: '分类名称', dataIndex: 'name', key: 'name' },
    { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: string) => (
        <Tag color={val === 'active' ? 'green' : 'red'}>
          {val === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180, render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 160,
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
        <h2 style={{ margin: 0 }}>分类管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增分类</Button>
      </div>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input.Search
          placeholder="搜索分类名称"
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
          <Select.Option value="active">启用</Select.Option>
          <Select.Option value="inactive">禁用</Select.Option>
        </Select>
      </div>
      
      <Table
        dataSource={categories}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 800 }}
        pagination={{ current: page, pageSize: size, total, onChange: (p, s) => { setPage(p); setSize(s); } }}
      />

      <Modal
        title={editingId ? '编辑分类' : '新增分类'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={500}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item name="code" label="分类编码">
            <Input placeholder="请输入分类编码" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
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
