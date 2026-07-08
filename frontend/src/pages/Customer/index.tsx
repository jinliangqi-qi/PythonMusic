import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../api/customer';

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCustomers();
  }, [page, size, searchText]);

  const loadCustomers = async () => {
    try {
      const response = await getCustomers({ page, size, name: searchText });
      setCustomers(response.data.list || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingCustomer(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCustomer(id);
      message.success('删除成功');
      loadCustomers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, values);
        message.success('更新成功');
      } else {
        await createCustomer(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadCustomers();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '客户名称', dataIndex: 'name', key: 'name' },
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
        <h2 style={{ margin: 0 }}>客户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增客户</Button>
      </div>
      
      <Input.Search
        placeholder="搜索客户名称"
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onSearch={() => setPage(1)}
        style={{ marginBottom: 16, width: 300 }}
      />
      
      <Table
        dataSource={customers}
        columns={columns}
        rowKey="id"
        pagination={{ current: page, pageSize: size, total, onChange: (p, s) => { setPage(p); setSize(s); } }}
      />

      <Modal
        title={editingCustomer ? '编辑客户' : '新增客户'}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="客户名称" rules={[{ required: true }]}>
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

export default CustomerList;