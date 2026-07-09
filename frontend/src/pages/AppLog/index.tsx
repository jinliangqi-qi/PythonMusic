import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm, Drawer, Card, Typography, Row, Col, Statistic } from 'antd';
import { SearchOutlined, DeleteOutlined, EyeOutlined, ClearOutlined, ReloadOutlined, AlertCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getAppLogs, getAppLog, getAppLogStats, deleteAppLog, cleanupOldLogs } from '../../api/appLog';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const AppLogList: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [levelFilter, setLevelFilter] = useState<string | undefined>();
  const [sourceFilter, setSourceFilter] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [days, setDays] = useState(7);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [page, size, levelFilter, sourceFilter, keyword, days]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response: any = await getAppLogs({
        page,
        size,
        level: levelFilter,
        source: sourceFilter,
        keyword,
        days,
      });
      setLogs(response.list || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response: any = await getAppLogStats(24);
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleViewDetail = async (id: number) => {
    try {
      const detail: any = await getAppLog(id);
      setCurrentLog(detail);
      setDetailVisible(true);
    } catch (error) {
      message.error('获取日志详情失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAppLog(id);
      message.success('删除成功');
      loadLogs();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleCleanup = async () => {
    try {
      const response: any = await cleanupOldLogs(30);
      message.success(response.message);
      loadLogs();
      loadStats();
    } catch (error) {
      message.error('清理失败');
    }
  };

  const handleReset = () => {
    setLevelFilter(undefined);
    setSourceFilter(undefined);
    setKeyword('');
    setDays(7);
    setPage(1);
  };

  const getLevelTag = (level: string) => {
    const colors: Record<string, string> = {
      'debug': 'default',
      'info': 'blue',
      'warn': 'orange',
      'error': 'error',
      'fatal': 'magenta',
    };
    return <Tag color={colors[level] || 'default'} style={{ padding: '4px 10px', fontSize: 12, fontWeight: 500 }}>{level.toUpperCase()}</Tag>;
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '级别', dataIndex: 'level', key: 'level', width: 80, render: (val: string) => getLevelTag(val) },
    { title: '来源', dataIndex: 'source', key: 'source', width: 100, render: (val: string) => <Tag color={val === 'frontend' ? 'purple' : 'success'}>{val === 'frontend' ? '前端' : '后端'}</Tag> },
    { title: '消息', dataIndex: 'message', key: 'message', width: 400, ellipsis: true, render: (text: string) => <Text style={{ fontSize: 13 }}>{text}</Text> },
    { title: '浏览器', dataIndex: 'browser', key: 'browser', width: 120, ellipsis: true },
    { title: '环境', dataIndex: 'environment', key: 'environment', width: 100 },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 180, render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss') },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>详情</Button>
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
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>应用日志</Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 6, display: 'block' }}>查看前端和后端运行时日志，便于问题排查</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { loadLogs(); loadStats(); }}>刷新</Button>
          <Popconfirm title="确定清理30天前的日志？" onConfirm={handleCleanup}>
            <Button danger icon={<ClearOutlined />}>清理旧日志</Button>
          </Popconfirm>
        </Space>
      </div>

      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card style={{ border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)', borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <InfoCircleOutlined style={{ fontSize: 22, color: '#64748b' }} />
                </div>
                <div>
                  <Text style={{ fontSize: 13, color: '#64748b' }}>24小时总日志</Text>
                  <Statistic value={stats.total} valueStyle={{ fontSize: 24, fontWeight: 700, color: '#1e293b' }} />
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)', borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <AlertCircleOutlined style={{ fontSize: 22, color: '#ef4444' }} />
                </div>
                <div>
                  <Text style={{ fontSize: 13, color: '#64748b' }}>错误数</Text>
                  <Statistic value={stats.error_count} valueStyle={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }} />
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)', borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#ede9fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <AlertCircleOutlined style={{ fontSize: 22, color: '#8b5cf6' }} />
                </div>
                <div>
                  <Text style={{ fontSize: 13, color: '#64748b' }}>严重错误</Text>
                  <Statistic value={stats.fatal_count || 0} valueStyle={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6' }} />
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)', borderRadius: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <InfoCircleOutlined style={{ fontSize: 22, color: '#3b82f6' }} />
                </div>
                <div>
                  <Text style={{ fontSize: 13, color: '#64748b' }}>警告数</Text>
                  <Statistic value={stats.warn_count || 0} valueStyle={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }} />
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}
      
      <Card style={{ marginBottom: 24, border: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)', borderRadius: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <Input.Search
              placeholder="搜索日志内容"
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={() => setPage(1)}
              allowClear
              style={{ width: '100%', maxWidth: 320 }}
            />
          </div>
          <Select
            placeholder="日志级别"
            value={levelFilter}
            onChange={(v) => { setLevelFilter(v); setPage(1); }}
            style={{ width: 120 }}
            allowClear
            bordered={false}
            size="large"
          >
            <Select.Option value="debug">DEBUG</Select.Option>
            <Select.Option value="info">INFO</Select.Option>
            <Select.Option value="warn">WARN</Select.Option>
            <Select.Option value="error">ERROR</Select.Option>
            <Select.Option value="fatal">FATAL</Select.Option>
          </Select>
          <Select
            placeholder="来源"
            value={sourceFilter}
            onChange={(v) => { setSourceFilter(v); setPage(1); }}
            style={{ width: 120 }}
            allowClear
            bordered={false}
            size="large"
          >
            <Select.Option value="frontend">前端</Select.Option>
            <Select.Option value="backend">后端</Select.Option>
          </Select>
          <Select
            placeholder="时间范围"
            value={days}
            onChange={(v) => { setDays(v); setPage(1); }}
            style={{ width: 120 }}
            bordered={false}
            size="large"
          >
            <Select.Option value={1}>今天</Select.Option>
            <Select.Option value={3}>近3天</Select.Option>
            <Select.Option value={7}>近7天</Select.Option>
            <Select.Option value={30}>近30天</Select.Option>
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
          dataSource={logs}
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

      <Drawer
        title="日志详情"
        placement="right"
        width={700}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentLog && (
          <div>
            <div style={{ marginBottom: 24, padding: 20, background: '#f8fafc', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: currentLog.level === 'error' || currentLog.level === 'fatal' ? '#fee2e2' : '#e0e7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {getLevelTag(currentLog.level)}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16, display: 'block' }}>{currentLog.message}</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>{currentLog.source === 'frontend' ? '前端日志' : '后端日志'}</Text>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>创建时间</Text>
                  <Text style={{ fontSize: 14, display: 'block' }}>{dayjs(currentLog.created_at).format('YYYY-MM-DD HH:mm:ss')}</Text>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>环境信息</Text>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>浏览器</Text>
                    <Text style={{ fontSize: 13, marginLeft: 8 }}>{currentLog.browser || '-'}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>操作系统</Text>
                    <Text style={{ fontSize: 13, marginLeft: 8 }}>{currentLog.os || '-'}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>设备</Text>
                    <Text style={{ fontSize: 13, marginLeft: 8 }}>{currentLog.device || '-'}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>版本</Text>
                    <Text style={{ fontSize: 13, marginLeft: 8 }}>{currentLog.app_version || '-'}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>用户ID</Text>
                    <Text style={{ fontSize: 13, marginLeft: 8 }}>{currentLog.user_id || '-'}</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>客户端IP</Text>
                    <Text style={{ fontSize: 13, marginLeft: 8 }}>{currentLog.client_ip || '-'}</Text>
                  </div>
                </div>
              </div>
            </div>

            {currentLog.url && (
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>URL</Text>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, wordBreak: 'break-all' }}>
                  {currentLog.url}
                </div>
              </div>
            )}

            {currentLog.error_type && (
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>错误类型</Text>
                <Tag color="error" style={{ fontSize: 13 }}>{currentLog.error_type}</Tag>
              </div>
            )}

            {currentLog.error_stack && (
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>错误堆栈</Text>
                <div style={{ 
                  padding: 16, 
                  background: '#fef2f2', 
                  borderRadius: 10, 
                  maxHeight: 300, 
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  color: '#991b1b',
                }}>
                  {currentLog.error_stack}
                </div>
              </div>
            )}

            {currentLog.extra_data && Object.keys(currentLog.extra_data).length > 0 && (
              <div>
                <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>额外数据</Text>
                <div style={{ 
                  padding: 16, 
                  background: '#f8fafc', 
                  borderRadius: 10, 
                  maxHeight: 200, 
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: 13,
                }}>
                  {JSON.stringify(currentLog.extra_data, null, 2)}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AppLogList;