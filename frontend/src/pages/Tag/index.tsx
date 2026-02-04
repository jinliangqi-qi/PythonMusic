import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Space, Popconfirm, Form, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import request from '../../utils/request';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { message } from '../../utils/globalAntd';

const TagList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/tags/', {
        params: { limit: 1000 }
      });
      // 兼容 list 结构
      if (res && res.list) {
          setData(res.list);
      } else if (Array.isArray(res)) {
          setData(res);
      } else {
          setData([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/tags/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await request.put(`/tags/${editingId}`, values);
        message.success('更新成功');
      } else {
        await request.post('/tags/', values);
        message.success('创建成功');
      }
      setIsModalVisible(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: '标签名称',
      dataIndex: 'name',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ResponsiveContainer>
      <Card title="标签管理" extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增标签
        </Button>
      }>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={false}
        />

        <Modal
          title={editingId ? '编辑标签' : '新增标签'}
          open={isModalVisible}
          onOk={handleOk}
          onCancel={() => setIsModalVisible(false)}
        >
          <Form form={form} layout="vertical" preserve={false}>
            <Form.Item
              name="name"
              label="标签名称"
              rules={[{ required: true, message: '请输入标签名称' }]}
            >
              <Input placeholder="请输入标签名称" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </ResponsiveContainer>
  );
};

export default TagList;
