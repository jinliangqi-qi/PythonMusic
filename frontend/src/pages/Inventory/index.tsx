import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { getInventory, adjustInventory } from '../../api/inventory';
import { getProducts } from '../../api/product';

const InventoryList: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadInventory();
    loadProducts();
  }, [page, size]);

  const loadInventory = async () => {
    try {
      const response = await getInventory({ page, size });
      setInventory(response.data.list || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await getProducts({ page: 1, size: 100 });
      setProducts(response.data.list || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleAdjust = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await adjustInventory(values);
      message.success('调整成功');
      setModalVisible(false);
      loadInventory();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getChangeTypeTag = (type: string) => {
    const colors: Record<string, string> = {
      'purchase': 'green',
      'sale': 'red',
      'adjust': 'blue',
      'inventory': 'orange',
    };
    const labels: Record<string, string> = {
      'purchase': '采购入库',
      'sale': '销售出库',
      'adjust': '库存调整',
      'inventory': '盘点',
    };
    return <Tag color={colors[type]}>{labels[type]}</Tag>;
  };

  const columns = [
    { title: '产品', dataIndex: 'product', key: 'product', render: (val: any) => val?.name },
    { title: '变动类型', dataIndex: 'change_type', key: 'change_type', render: (val: string) => getChangeTypeTag(val) },
    { title: '变动数量', dataIndex: 'change_qty', key: 'change_qty', render: (val: number) => (
      <span style={{ color: val > 0 ? '#52c41a' : '#ff4d4f' }}>{val > 0 ? `+${val}` : val}</span>
    )},
    { title: '变动后库存', dataIndex: 'after_qty', key: 'after_qty' },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
    { title: '操作时间', dataIndex: 'created_at', key: 'created_at' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>库存管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdjust}>库存调整</Button>
      </div>
      
      <Table
        dataSource={inventory}
        columns={columns}
        rowKey="id"
        pagination={{ current: page, pageSize: size, total, onChange: (p, s) => { setPage(p); setSize(s); } }}
      />

      <Modal
        title="库存调整"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="product_id" label="产品" rules={[{ required: true }]}>
            <Select placeholder="选择产品">
              {products.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="adjust_qty" label="调整数量" rules={[{ required: true }]}>
            <InputNumber placeholder="正数增加，负数减少" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="调整原因">
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryList;