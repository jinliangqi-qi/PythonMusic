import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Popconfirm, Tag, message, Modal, Form, Input, Select, Radio, Space, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/user';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const UserList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchData = async (page = 1, size = 10) => {
    setLoading(true);
    try {
      const res: any = await getUsers({ page, size });
      setData(res.list || []);
      setPagination({
        current: page,
        pageSize: size,
        total: res.total || 0,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      message.success('删除成功');
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (record: any) => {
    setCurrentUser(record);
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentUser(null);
    setIsModalVisible(true);
  };

  const handleOk = async () => {
      try {
          const values = await form.validateFields();
          setConfirmLoading(true);
          
          if (currentUser) {
              await updateUser(currentUser.id, values);
              message.success('更新用户成功');
          } else {
              await createUser(values);
              message.success('创建用户成功');
          }
          
          setIsModalVisible(false);
          fetchData(pagination.current, pagination.pageSize);
      } catch (error) {
          console.error(error);
      } finally {
          setConfirmLoading(false);
      }
  };

  useEffect(() => {
      if (isModalVisible) {
          if (currentUser) {
              form.setFieldsValue(currentUser);
          } else {
              form.resetFields();
              form.setFieldsValue({ role: 'user', is_active: true });
          }
      }
  }, [isModalVisible, currentUser, form]);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 150,
      render: (text: string) => <Text strong style={{ fontSize: 14 }}>{text}</Text>
    },
    {
        title: '昵称',
        dataIndex: 'nickname',
        width: 150,
    },
    {
        title: '邮箱',
        dataIndex: 'email',
        width: 200,
        ellipsis: true,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 120,
      render: (role: string) => {
          let color = 'default';
          let text = '用户';
          if (role === 'super_admin') { color = 'purple'; text = '超级管理员'; }
          if (role === 'admin') { color = 'blue'; text = '管理员'; }
          if (role === 'auditor') { color = 'cyan'; text = '审核员'; }
          return <Tag color={color} style={{ padding: '4px 12px', fontSize: 13 }}>{text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 100,
      render: (active: boolean) => (
          <Tag color={active ? 'success' : 'error'} style={{ padding: '4px 12px', fontSize: 13 }}>
            {active ? '启用' : '禁用'}
          </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除该用户吗？" onConfirm={() => handleDelete(record.id)}>
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
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>用户管理</Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 6, display: 'block' }}>管理系统用户、角色及权限</Text>
        </div>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
          >
            新增用户
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchData(pagination.current, pagination.pageSize)}>
            刷新
          </Button>
        </Space>
      </div>
      
      <Card style={{ border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)', borderRadius: 16 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
              ...pagination,
              onChange: (page, size) => fetchData(page, size),
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t) => `共 ${t} 条`,
          }}
          scroll={{ x: 1100 }}
          size="middle"
        />
      </Card>

      <Modal
        title={currentUser ? '编辑用户' : '新增用户'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={confirmLoading}
        width={550}
        okText="保存"
        cancelText="取消"
      >
          <Form
            form={form}
            layout="vertical"
            preserve={false}
          >
              <Form.Item
                label="用户名"
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                  <Input 
                    disabled={!!currentUser} 
                    placeholder="请输入用户名" 
                    size="large"
                  />
              </Form.Item>
              
              {!currentUser && (
                  <Form.Item
                    label="密码"
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
                  >
                      <Input.Password placeholder="请输入密码" size="large" />
                  </Form.Item>
              )}
              
              <Form.Item
                label="昵称"
                name="nickname"
              >
                  <Input placeholder="请输入昵称" size="large" />
              </Form.Item>

              <Form.Item
                label="邮箱"
                name="email"
                rules={[{ type: 'email', message: '请输入有效的邮箱' }]}
              >
                  <Input placeholder="请输入邮箱" size="large" />
              </Form.Item>

              <Form.Item
                label="角色"
                name="role"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                  <Select size="large">
                      <Select.Option value="user">普通用户</Select.Option>
                      <Select.Option value="admin">管理员</Select.Option>
                      <Select.Option value="auditor">审核员</Select.Option>
                      <Select.Option value="super_admin">超级管理员</Select.Option>
                  </Select>
              </Form.Item>
              
              <Form.Item
                label="状态"
                name="is_active"
                rules={[{ required: true }]}
              >
                  <Radio.Group>
                      <Radio value={true}>启用</Radio>
                      <Radio value={false}>禁用</Radio>
                  </Radio.Group>
              </Form.Item>
          </Form>
      </Modal>
    </div>
  );
};

export default UserList;