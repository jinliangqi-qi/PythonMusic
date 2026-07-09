import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm, Drawer, Descriptions, Statistic, Row, Col, Card } from 'antd';
import { SearchOutlined, DeleteOutlined, EyeOutlined, ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import { getAppLogs, getAppLog, getAppLogStats, deleteAppLog, cleanupOldLogs } from '../../api/appLog';
import dayjs from 'dayjs';

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
      'error': 'red',
      'fatal': 'magenta',
    };
    return <Tag color={colors[level] || 'default'}>{level.toUpperCase()}</Tag>;
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '级别', dataIndex: 'level', key: 'level', width: 80, render: (val: string) => getLevelTag(val) },
    { title: '来源', dataIndex: 'source', key: 'source', width: 80 },
    { title: '消息', dataIndex: 'message', key: 'message', ellipsis: true },
    { title: '浏览器', dataIndex: 'browser', key: 'browser', width: 80 },
    { title: '环境', dataIndex: 'environment', key: 'environment', width: 100 },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 180, render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss') },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>详情</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>应用日志</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { loadLogs(); loadStats(); }}>刷新</Button>
          <Popconfirm title="确定清理30天前的日志？" onConfirm={handleCleanup}>
            <Button danger icon={<ClearOutlined />}>清理旧日志</Button>
          </Popconfirm>
        </Space>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card size="small">
              <Statistic title="24小时总日志" value={stats.total} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="错误数" value={stats.error_count} valueStyle={{ color: '#cf1322' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="严重错误" value={stats.fatal_count || 0} valueStyle={{ color: '#722ed1' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" title="按级别">
              <Space>
                {Object.entries(stats.by_level || {}).map(([level, count]) => (
                  <Tag key={level} color={level === 'error' ? 'red' : level === 'warn' ? 'orange' : 'blue'}>
                    {level}: {count}
                  </Tag>
                ))}
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" title="按来源">
              <Space>
                {Object.entries(stats.by_source || {}).map(([source, count]) => (
                  <Tag key={source} color="green">{source}: {count}</Tag>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      )}
      
      {/* 筛选条件 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input.Search
          placeholder="搜索日志内容"
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={() => setPage(1)}
          style={{ width: 250 }}
          allowClear
        />
        <Select
          placeholder="日志级别"
          value={levelFilter}
          onChange={(v) => { setLevelFilter(v); setPage(1); }}
          style={{ width: 120 }}
          allowClear
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
        >
          <Select.Option value="frontend">前端</Select.Option>
          <Select.Option value="backend">后端</Select.Option>
        </Select>
        <Select
          placeholder="时间范围"
          value={days}
          onChange={(v) => { setDays(v); setPage(1); }}
          style={{ width: 120 }}
        >
          <Select.Option value={1}>今天</Select.Option>
          <Select.Option value={3}>近3天</Select.Option>
          <Select.Option value={7}>近7天</Select.Option>
          <Select.Option value={30}>近30天</Select.Option>
        </Select>
        <Button onClick={handleReset}>重置</Button>
      </div>
      
      {/* 日志列表 */}
      <Table
        dataSource={logs}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1100 }}
        pagination={{ 
          current: page, 
          pageSize: size, 
          total, 
          onChange: (p, s) => { setPage(p); setSize(s); },
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />

      {/* 详情抽屉 */}
      <Drawer
        title="日志详情"
        placement="right"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentLog && (
          <div>
            <Descriptions title="基本信息" bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="ID">{currentLog.id}</Descriptions.Item>
              <Descriptions.Item label="级别">{getLevelTag(currentLog.level)}</Descriptions.Item>
              <Descriptions.Item label="来源">{currentLog.source}</Descriptions.Item>
              <Descriptions.Item label="日志器">{currentLog.logger_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="环境">{currentLog.environment}</Descriptions.Item>
              <Descriptions.Item label="时间">{dayjs(currentLog.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="环境信息" bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="浏览器">{currentLog.browser || '-'}</Descriptions.Item>
              <Descriptions.Item label="操作系统">{currentLog.os || '-'}</Descriptions.Item>
              <Descriptions.Item label="设备">{currentLog.device || '-'}</Descriptions.Item>
              <Descriptions.Item label="版本">{currentLog.app_version || '-'}</Descriptions.Item>
              <Descriptions.Item label="用户ID">{currentLog.user_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="客户端IP">{currentLog.client_ip || '-'}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="日志内容" bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="消息">{currentLog.message}</Descriptions.Item>
              {currentLog.url && <Descriptions.Item label="URL">{currentLog.url}</Descriptions.Item>}
              {currentLog.error_type && <Descriptions.Item label="错误类型">{currentLog.error_type}</Descriptions.Item>}
              {currentLog.error_stack && (
                <Descriptions.Item label="错误堆栈">
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-all', 
                    background: '#f5f5f5', 
                    padding: 8, 
                    borderRadius: 4,
                    maxHeight: 300,
                    overflow: 'auto',
                  }}>{currentLog.error_stack}</pre>
                </Descriptions.Item>
              )}
            </Descriptions>

            {currentLog.extra_data && Object.keys(currentLog.extra_data).length > 0 && (
              <Descriptions title="额外数据" bordered column={1} size="small">
                <Descriptions.Item label="数据">
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    background: '#f5f5f5', 
                    padding: 8, 
                    borderRadius: 4,
                  }}>{JSON.stringify(currentLog.extra_data, null, 2)}</pre>
                </Descriptions.Item>
              </Descriptions>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AppLogList;