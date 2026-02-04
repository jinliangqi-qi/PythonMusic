import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Modal, Form, Input, Popconfirm, TreeSelect } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import request from '../../utils/request';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { message } from '../../utils/globalAntd';

const CategoryList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await request.get('/categories/', {
        params: { limit: 1000 }
      });
      // 兼容 list 结构
      if (res && res.list) {
        setData(buildTree(res.list));
      } else if (Array.isArray(res)) {
        setData(buildTree(res));
      } else {
        setData([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 简单的构建树函数
  const buildTree = (items: any[]) => {
    const map: any = {};
    const roots: any[] = [];
    // 深拷贝以避免修改原数组
    const list = items.map(item => ({ ...item, children: [] }));
    
    list.forEach(item => {
        map[item.id] = item;
    });
    
    list.forEach(item => {
        if (item.parent_id && map[item.parent_id]) {
            map[item.parent_id].children.push(item);
        } else {
            roots.push(item);
        }
    });
    // 移除空的 children 数组，以免 Table 显示展开图标
    const cleanChildren = (nodes: any[]) => {
        nodes.forEach(node => {
            if (node.children.length === 0) {
                delete node.children;
            } else {
                cleanChildren(node.children);
            }
        });
    };
    cleanChildren(roots);
    return roots;
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
      await request.delete(`/categories/${id}`);
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
        await request.put(`/categories/${editingId}`, values);
        message.success('更新成功');
      } else {
        await request.post('/categories/', values);
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
      title: '分类名称',
      dataIndex: 'name',
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除？如果有子分类可能无法删除。"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <ResponsiveContainer>
      <Card title="分类管理" extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增分类
        </Button>
      }>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={false}
          defaultExpandAllRows
        />

        <Modal
          title={editingId ? '编辑分类' : '新增分类'}
          open={isModalVisible}
          onOk={handleOk}
          onCancel={() => setIsModalVisible(false)}
        >
          <Form form={form} layout="vertical" preserve={false}>
            <Form.Item
              name="name"
              label="分类名称"
              rules={[{ required: true, message: '请输入分类名称' }]}
            >
              <Input placeholder="请输入分类名称" />
            </Form.Item>

            <Form.Item
              name="parent_id"
              label="父分类"
            >
              <TreeSelect
                treeData={data}
                fieldNames={{ label: 'name', value: 'id', children: 'children' }}
                placeholder="请选择父分类 (可选)"
                allowClear
                treeDefaultExpandAll
              />
            </Form.Item>

            <Form.Item
              name="sort_order"
              label="排序"
            >
              <Input type="number" placeholder="0" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </ResponsiveContainer>
  );
};

export default CategoryList;
