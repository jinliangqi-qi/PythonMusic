import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message, Popconfirm, Card, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ShopOutlined, EyeOutlined } from '@ant-design/icons';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../../api/warehouse';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const WarehouseList: React.FC = () => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentWarehouse, setCurrentWarehouse] = useState<any>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWarehouses();
  }, [page, size, searchText, statusFilter]);

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const params: any = { page, size, name: searchText };
      if (statusFilter) params.status = statusFilter;
      const response: any = await getWarehouses(params);
      setWarehouses(response.list || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
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
      address: record.address,
      contact_name: record.contact_name,
      contact_phone: record.contact_phone,
      sort_order: record.sort_order,
      status: record.status,
    });
    setModalVisible(true);
  };

  const handleViewDetail = (record: any) => {
    setCurrentWarehouse(record);
    setDetailVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteWarehouse(id);
      message.success('删除成功');
      loadWarehouses();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await updateWarehouse(editingId, values);
        message.success('更新成功');
      } else {
        await createWarehouse(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadWarehouses();
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
      title: '仓库编码', 
      dataIndex: 'code', 
      key: 'code', 
      width: 150,
      render: (text: string) => <Text code style={{ fontSize: 13, color: '#6366f1' }}>{text}</Text>
    },
    { 
      title: '仓库名称', 
      dataIndex: 'name', 
      key: 'name',
      width: 180,
      render: (text: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShopOutlined style={{ fontSize: 16, color: '#6366f1' }} />
          <Text strong style={{ fontSize: 14 }}>{text}</Text>
        </div>
      ),
    },
    { title: '地址', dataIndex: 'address', key: 'address', width: 220, ellipsis: true },
    { title: '联系人', dataIndex: 'contact_name', key: 'contact_name', width: 100 },
    { title: '联系电话', dataIndex: 'contact_phone', key: 'contact_phone', width: 130 },
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
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
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
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>仓库管理</Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 6, display: 'block' }}>管理仓库信息、地址及联系人</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreate}
          size="large"
          style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
        >
          新增仓库
        </Button>
      </div>
      
      <Card style={{ marginBottom: 24, border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)', borderRadius: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <Input.Search
              placeholder="搜索仓库名称"
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
          dataSource={warehouses}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
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
        title={editingId ? '编辑仓库' : '新增仓库'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={600}
        destroyOnClose
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="仓库名称" rules={[{ required: true, message: '请输入仓库名称' }]}>
            <Input placeholder="请输入仓库名称" size="large" />
          </Form.Item>
          <Form.Item name="code" label="仓库编码">
            <Input placeholder="请输入仓库编码" size="large" />
          </Form.Item>
          <Form.Item name="address" label="仓库地址">
            <Input.TextArea rows={3} placeholder="详细地址" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="contact_name" label="联系人" style={{ flex: 1 }}>
              <Input placeholder="联系人姓名" size="large" />
            </Form.Item>
            <Form.Item name="contact_phone" label="联系电话" style={{ flex: 1 }}>
              <Input placeholder="联系电话" size="large" />
            </Form.Item>
          </div>
          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} size="large" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select size="large">
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="仓库详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={500}
      >
        {currentWarehouse && (
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <ShopOutlined style={{ fontSize: 24, color: '#6366f1' }} />
                <Text strong style={{ fontSize: 20, color: '#1e293b' }}>{currentWarehouse.name}</Text>
              </div>
              <Text code style={{ fontSize: 13, color: '#6366f1', marginRight: 12 }}>{currentWarehouse.code}</Text>
              <Tag color={currentWarehouse.status === 'active' ? 'success' : 'error'}>
                {currentWarehouse.status === 'active' ? '启用' : '禁用'}
              </Tag>
            </div>
            
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>联系人</Text>
                <Text style={{ fontSize: 15, marginLeft: 8 }}>{currentWarehouse.contact_name || '-'}</Text>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>联系电话</Text>
                <Text style={{ fontSize: 15, marginLeft: 8 }}>{currentWarehouse.contact_phone || '-'}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>地址</Text>
                <Text style={{ fontSize: 15, marginLeft: 8, display: 'block', marginTop: 8 }}>{currentWarehouse.address || '-'}</Text>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button onClick={() => setDetailVisible(false)}>关闭</Button>
              <Button type="primary" onClick={() => { handleEdit(currentWarehouse); setDetailVisible(false); }}>编辑</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WarehouseList;