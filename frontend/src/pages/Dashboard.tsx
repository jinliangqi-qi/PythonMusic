import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Spin, Statistic } from 'antd';
import { 
  CustomerServiceOutlined, 
  UserOutlined, 
  AppstoreOutlined, 
  AuditOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer as RechartsResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import request from '../utils/request';
import ResponsiveContainer from '../components/ResponsiveContainer';
import AppleCard from '../components/AppleCard';
import MusicListModule from '../components/MusicListModule';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    music_count: 0,
    singer_count: 0,
    album_count: 0,
    pending_music_count: 0,
    status_distribution: { active: 0, pending: 0, rejected: 0 },
    top_musics: [] as any[]
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res: any = await request.get('/common/stats');
        setStats(res);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // 状态分布数据转换
  const pieData = [
    { name: '已通过', value: stats.status_distribution?.active || 0 },
    { name: '待审核', value: stats.status_distribution?.pending || 0 },
    { name: '已驳回', value: stats.status_distribution?.rejected || 0 },
  ].filter(item => item.value > 0);

  return (
    <ResponsiveContainer>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ fontWeight: 700, letterSpacing: '-0.5px' }}>概览</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>欢迎回来，这里是您的音乐控制中心。</Text>
      </div>

      <Spin spinning={loading}>
        {/* 顶部统计卡片 */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <AppleCard onClick={() => navigate('/musics')}>
              <Statistic 
                title={<span style={{ color: '#86868b', fontWeight: 500 }}>音乐总数</span>}
                value={stats.music_count} 
                prefix={<CustomerServiceOutlined style={{ color: '#007AFF', marginRight: 8 }} />}
              />
            </AppleCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <AppleCard onClick={() => navigate('/singers')}>
              <Statistic 
                title={<span style={{ color: '#86868b', fontWeight: 500 }}>入驻歌手</span>}
                value={stats.singer_count} 
                prefix={<UserOutlined style={{ color: '#34C759', marginRight: 8 }} />}
              />
            </AppleCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <AppleCard onClick={() => navigate('/albums')}>
              <Statistic 
                title={<span style={{ color: '#86868b', fontWeight: 500 }}>专辑收录</span>}
                value={stats.album_count} 
                prefix={<AppstoreOutlined style={{ color: '#5856D6', marginRight: 8 }} />}
              />
            </AppleCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <AppleCard onClick={() => navigate('/musics')}>
              <Statistic 
                title={<span style={{ color: '#86868b', fontWeight: 500 }}>待审核</span>}
                value={stats.pending_music_count} 
                prefix={<AuditOutlined style={{ color: '#FF9500', marginRight: 8 }} />}
              />
            </AppleCard>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          {/* 左侧：播放量排行 */}
          <Col xs={24} lg={16}>
            <AppleCard 
              title="热门音乐 Top 5" 
              extra={<RightOutlined style={{ color: '#86868b', fontSize: 12 }} />}
              style={{ height: '100%' }}
            >
              <div style={{ height: 320 }}>
                {stats.top_musics && stats.top_musics.length > 0 ? (
                  <RechartsResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.top_musics}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="title" 
                        type="category" 
                        width={100} 
                        tick={{ fontSize: 12, fill: '#666' }}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="play_count" fill="#007AFF" radius={[0, 4, 4, 0]} barSize={20} name="播放量" />
                    </BarChart>
                  </RechartsResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    暂无数据
                  </div>
                )}
              </div>
            </AppleCard>
          </Col>

          {/* 右侧：状态分布 */}
          <Col xs={24} lg={8}>
            <AppleCard title="内容健康度" style={{ height: '100%' }}>
              <div style={{ height: 320 }}>
                {pieData.length > 0 ? (
                  <RechartsResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 1 ? '#FF9500' : (index === 2 ? '#FF3B30' : '#34C759')} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </RechartsResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    暂无数据
                  </div>
                )}
              </div>
            </AppleCard>
          </Col>
        </Row>

        {/* 音乐列表模块 */}
        <div style={{ marginTop: 24 }}>
             <MusicListModule title="最近更新" defaultView="grid" limit={8} showPagination={false} status="active" />
        </div>
      </Spin>
    </ResponsiveContainer>
  );
};

export default Dashboard;