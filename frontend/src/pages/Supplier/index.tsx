import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../api/supplier';

const SupplierList: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSuppliers();
  }, [page, size, searchText]);

  const loadSuppliers = async () => {
    try {
      const response = await getSuppliers({ page, size, name: searchText });
      setSuppliers(response.data.list || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const handleCreate = () => {
    setEditingSupplier(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingSupplier(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSupplier(id);
      message.success('删除成功');
      loadSuppliers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, values);
        message.success('更新成功');
      } else {
        await createSupplier(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadSuppliers();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '供应商名称', dataIndex: 'name', key: 'name' },
    { title: '联系人', dataIndex: 'contact_name', key: 'contact_name' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '地址', dataIndex: 'address', key: 'address' },
    { title: '税号', dataIndex: 'tax_id', key: 'tax_id' },
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
        <h2 style={{ margin: 0 }}>供应商管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增供应商</Button>
      </div>
      
      <Input.Search
        placeholder="搜索供应商名称"
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onSearch={() => setPage(1)}
        style={{ marginBottom: 16, width: 300 }}
      />
      
      <Table
        dataSource={suppliers}
        columns={columns}
        rowKey="id"
        pagination={{ current: page, pageSize: size, total, onChange: (p, s) => { setPage(p); setSize(s); } }}
      />

      <Modal
        title={editingSupplier ? '编辑供应商' : '新增供应商'}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="供应商名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contact_name" label="联系人">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="tax_id" label="税号">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplierList;