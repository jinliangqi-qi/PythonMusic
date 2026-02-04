import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Popconfirm, Tag, message, Modal } from 'antd';
import { DeleteOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { getSysLogs, deleteSysLog } from '../../api/sysLog';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import dayjs from 'dayjs';

const SysLogList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<any>(null);

  const fetchData = async (page = 1, size = 10) => {
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
      render: (method: string) => {
          let color = 'blue';
          if (method === 'GET') color = 'green';
          if (method === 'POST') color = 'blue';
          if (method === 'DELETE') color = 'red';
          if (method === 'PUT') color = 'orange';
          return <Tag color={color}>{method}</Tag>;
      }
    },
    {
      title: '路径',
      dataIndex: 'path',
      ellipsis: true,
    },
    {
      title: '状态码',
      dataIndex: 'status_code',
      width: 100,
      render: (code: number) => (
          <Tag color={code === 200 ? 'success' : 'error'}>{code}</Tag>
      )
    },
    {
        title: 'IP',
        dataIndex: 'ip',
        width: 150,
    },
    {
      title: '操作',
      width: 150,
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
          >
            详情
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <ResponsiveContainer>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>系统日志</h2>
          <Button icon={<ReloadOutlined />} onClick={() => fetchData(pagination.current, pagination.pageSize)}>
              刷新
          </Button>
      </div>
      
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
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
                  <p><strong>请求时间:</strong> {dayjs(currentLog.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
                  <p><strong>请求方法:</strong> {currentLog.method}</p>
                  <p><strong>请求路径:</strong> {currentLog.path}</p>
                  <p><strong>客户端IP:</strong> {currentLog.ip}</p>
                  <p><strong>状态码:</strong> {currentLog.status_code}</p>
                  <div style={{ marginTop: 16 }}>
                      <strong>错误详情:</strong>
                      <div style={{ 
                          marginTop: 8, 
                          padding: 12, 
                          background: '#f5f5f5', 
                          borderRadius: 4, 
                          maxHeight: 400, 
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace'
                      }}>
                          {currentLog.error_detail || '无错误详情'}
                      </div>
                  </div>
              </div>
          )}
      </Modal>
    </ResponsiveContainer>
  );
};

export default SysLogList;
