import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Popconfirm, Tag, message, Modal, Typography, Space } from 'antd';
import { DeleteOutlined, ReloadOutlined, EyeOutlined, AlertCircleOutlined } from '@ant-design/icons';
import { getSysLogs, deleteSysLog } from '../../api/sysLog';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const SysLogList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<any>(null);

  const fetchData = async (page = 1, size = 20) => {
    setLoading(true);
    try {
      const res: any = await getSysLogs({ page, size });
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
      await deleteSysLog(id);
      message.success('删除成功');
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTableChange = (pagination: any) => {
    fetchData(pagination.current, pagination.pageSize);
  };

  const showDetail = (record: any) => {
      setCurrentLog(record);
      setDetailVisible(true);
  };

  const getMethodTag = (method: string) => {
    let color = 'blue';
    if (method === 'GET') color = 'success';
    if (method === 'POST') color = 'blue';
    if (method === 'DELETE') color = 'error';
    if (method === 'PUT') color = 'warning';
    return <Tag color={color} style={{ padding: '4px 10px', fontSize: 12 }}>{method}</Tag>;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '方法',
      dataIndex: 'method',
      width: 100,
      render: (method: string) => getMethodTag(method),
    },
    {
      title: '路径',
      dataIndex: 'path',
      width: 300,
      ellipsis: true,
      render: (text: string) => <Text style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: '状态码',
      dataIndex: 'status_code',
      width: 100,
      render: (code: number) => (
          <Tag color={code === 200 ? 'success' : code >= 500 ? 'error' : 'warning'} style={{ padding: '4px 10px', fontSize: 13 }}>
            {code}
          </Tag>
      )
    },
    {
        title: 'IP',
        dataIndex: 'ip',
        width: 150,
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)}>详情</Button>
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
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>系统日志</Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 6, display: 'block' }}>查看系统操作日志、API请求记录</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => fetchData(pagination.current, pagination.pageSize)}>
          刷新
        </Button>
      </div>
      
      <Card style={{ border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)', borderRadius: 16 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1100 }}
          size="middle"
        />
      </Card>

      <Modal
        title="日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
            <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ]}
        width={800}
      >
          {currentLog && (
              <div>
                  <div style={{ marginBottom: 24, padding: 20, background: '#f8fafc', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: '#e0e7ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <AlertCircleOutlined style={{ fontSize: 20, color: '#6366f1' }} />
                        </div>
                        <div>
                          <Text strong style={{ fontSize: 16 }}>{currentLog.path}</Text>
                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            {getMethodTag(currentLog.method)}
                            <Tag color={currentLog.status_code === 200 ? 'success' : 'error'}>
                              {currentLog.status_code}
                            </Tag>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>请求时间</Text>
                        <Text style={{ fontSize: 14, display: 'block' }}>{dayjs(currentLog.created_at).format('YYYY-MM-DD HH:mm:ss')}</Text>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>客户端IP</Text>
                    <Text style={{ fontSize: 15, marginLeft: 8 }}>{currentLog.ip || '-'}</Text>
                  </div>

                  {currentLog.error_detail && (
                    <div style={{ marginTop: 20 }}>
                      <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>错误详情</Text>
                      <div style={{ 
                          padding: 16, 
                          background: '#fef2f2', 
                          borderRadius: 10, 
                          maxHeight: 400, 
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          fontSize: 13,
                          color: '#991b1b',
                      }}>
                          {currentLog.error_detail}
                      </div>
                    </div>
                  )}
              </div>
          )}
      </Modal>
    </div>
  );
};

export default SysLogList;