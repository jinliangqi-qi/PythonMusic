import React, { useState, useEffect } from 'react';
import { Card, List, Button, Checkbox, Row, Col, Radio, Popconfirm, Dropdown, Modal } from 'antd';
import { 
  PlayCircleOutlined, 
  DeleteOutlined, 
  AppstoreOutlined, 
  BarsOutlined,
  MoreOutlined,
  EditOutlined
} from '@ant-design/icons';
import { usePlayerStore } from '../../store/usePlayerStore';
import type { Song } from '../../store/usePlayerStore';
import { getMusics, deleteMusic, deleteMusicsBatch } from '../../api/music';
import { message } from '../../utils/globalAntd';
import MusicForm from '../MusicForm';

interface MusicListModuleProps {
  title?: string;
  defaultView?: 'grid' | 'list';
  limit?: number; // 如果作为仪表盘组件，限制显示数量
  showPagination?: boolean;
  status?: string; // 筛选状态，不传则显示所有
}

const MusicListModule: React.FC<MusicListModuleProps> = ({ 
  title = "音乐列表", 
  defaultView = 'list',
  limit = 100,
  status
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { play, setPlayList } = usePlayerStore();
  
  // 编辑相关
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentEditMusic, setCurrentEditMusic] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await getMusics({ 
        page: 1, 
        size: limit,
        status: status // 使用传入的 status
      });
      setData(res.list || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [limit]);

  const handlePlay = (item: any) => {
    // 转换数据结构为 Song
    // 优先使用 file_path，因为它直接对应数据库存储的值 (可能是 URL 或 路径)
    const song: Song = {
        id: item.id,
        title: item.title,
        artist: item.singer?.name || 'Unknown',
        cover: item.cover, // cover 也是直接存储的值
        url: item.file_path || item.file_url
    };
    
    // 更新播放列表
    const allSongs: Song[] = data.map(d => ({
        id: d.id,
        title: d.title,
        artist: d.singer?.name || 'Unknown',
        cover: d.cover,
        url: d.file_path || d.file_url
    }));
    
    setPlayList(allSongs);
    play(song);
  };

  const handleDelete = async (id: number) => {
      try {
          await deleteMusic(id);
          message.success('删除成功');
          fetchData();
          // 如果当前选中了该ID，移除
          setSelectedIds(prev => prev.filter(i => i !== id));
      } catch (error) {
          console.error(error);
      }
  };

  const handleBatchDelete = async () => {
      if (selectedIds.length === 0) return;
      try {
          await deleteMusicsBatch(selectedIds);
          message.success(`成功删除 ${selectedIds.length} 首音乐`);
          fetchData();
          setSelectedIds([]);
      } catch (error) {
          console.error(error);
      }
  };

  const toggleSelect = (id: number) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(prev => prev.filter(i => i !== id));
      } else {
          setSelectedIds(prev => [...prev, id]);
      }
  };

  const toggleSelectAll = () => {
      if (selectedIds.length === data.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(data.map(item => item.id));
      }
  };

  const handleEdit = (item: any) => {
      setCurrentEditMusic(item);
      setIsEditModalVisible(true);
  };

  const handleEditSuccess = () => {
      setIsEditModalVisible(false);
      fetchData();
  };

  const getCoverUrl = (url?: string) => {
    if (!url) return 'https://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}/${url}`;
  };

  return (
    <Card 
      title={title} 
      extra={
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {selectedIds.length > 0 && (
                  <Popconfirm title="确定删除选中项吗？" onConfirm={handleBatchDelete}>
                      <Button danger icon={<DeleteOutlined />}>
                          删除 ({selectedIds.length})
                      </Button>
                  </Popconfirm>
              )}
              <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)} buttonStyle="solid">
                  <Radio.Button value="list"><BarsOutlined /></Radio.Button>
                  <Radio.Button value="grid"><AppstoreOutlined /></Radio.Button>
              </Radio.Group>
          </div>
      }
      styles={{ body: { padding: viewMode === 'grid' ? 24 : 0 } }}
    >
      {viewMode === 'list' ? (
          <List
            loading={loading}
            dataSource={data}
            renderItem={(item) => (
                <List.Item
                    className="music-list-item"
                    actions={[
                        <Button type="text" icon={<PlayCircleOutlined />} onClick={() => handlePlay(item)} />,
                        <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(item)} />,
                        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(item.id)}>
                            <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    ]}
                    style={{ padding: '12px 24px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Checkbox 
                            checked={selectedIds.includes(item.id)} 
                            onChange={() => toggleSelect(item.id)}
                            className={`music-list-checkbox ${selectedIds.includes(item.id) ? 'checked' : ''}`}
                            style={{ marginRight: 16 }}
                        />
                        <div style={{ width: 48, height: 48, borderRadius: 4, overflow: 'hidden', marginRight: 16, flexShrink: 0 }}>
                            <img src={getCoverUrl(item.cover)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, color: '#1d1d1f' }}>{item.title}</div>
                            <div style={{ fontSize: 12, color: '#86868b' }}>{item.singer?.name || 'Unknown'}</div>
                        </div>
                    </div>
                </List.Item>
            )}
            header={
                <div style={{ padding: '0 24px 12px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    <Checkbox 
                        checked={data.length > 0 && selectedIds.length === data.length}
                        indeterminate={selectedIds.length > 0 && selectedIds.length < data.length}
                        onChange={toggleSelectAll}
                        style={{ marginRight: 16 }}
                    >
                        全选
                    </Checkbox>
                    <span style={{ color: '#86868b', fontSize: 12 }}>共 {data.length} 首</span>
                </div>
            }
          />
      ) : (
          <div>
               <div style={{ marginBottom: 16 }}>
                    <Checkbox 
                        checked={data.length > 0 && selectedIds.length === data.length}
                        indeterminate={selectedIds.length > 0 && selectedIds.length < data.length}
                        onChange={toggleSelectAll}
                    >
                        全选
                    </Checkbox>
               </div>
               <Row gutter={[24, 24]}>
                {data.map(item => (
                    <Col xs={12} sm={8} md={6} lg={4} key={item.id}>
                        <div 
                            style={{ 
                                position: 'relative', 
                                borderRadius: 12, 
                                overflow: 'hidden', 
                                background: '#fff',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                border: selectedIds.includes(item.id) ? '2px solid #0071e3' : '2px solid transparent'
                            }}
                            className="music-card"
                        >
                            <div 
                                className={`music-checkbox-wrapper ${selectedIds.includes(item.id) ? 'checked' : ''}`}
                                style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}
                            >
                                <Checkbox 
                                    checked={selectedIds.includes(item.id)} 
                                    onChange={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                                />
                            </div>
                            
                            <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                                <Dropdown 
                                    menu={{ 
                                        items: [
                                            {
                                                key: 'edit',
                                                label: '编辑',
                                                icon: <EditOutlined />,
                                                onClick: ({ domEvent }) => {
                                                    domEvent.stopPropagation();
                                                    handleEdit(item);
                                                }
                                            },
                                            {
                                                key: 'delete',
                                                label: '删除',
                                                icon: <DeleteOutlined />,
                                                danger: true,
                                                onClick: ({ domEvent }) => {
                                                    domEvent.stopPropagation();
                                                    // 这里需要弹窗确认，比较麻烦，简单起见直接调用
                                                    // 为了安全最好还是弹窗，但 Dropdown 里弹窗容易关掉
                                                    // 建议：点击删除项后触发外部状态弹窗，或者使用 Modal.confirm
                                                    Modal.confirm({
                                                        title: '确定删除？',
                                                        onOk: () => handleDelete(item.id)
                                                    });
                                                }
                                            }
                                        ]
                                    }} 
                                    trigger={['click']}
                                >
                                    <Button 
                                        type="text" 
                                        icon={<MoreOutlined style={{ color: '#1d1d1f', fontSize: 20 }} />} 
                                        style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)' }}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </Dropdown>
                            </div>
                            
                            <div 
                                style={{ aspectRatio: '1/1', position: 'relative' }}
                                onClick={() => handlePlay(item)}
                            >
                                <img src={getCoverUrl(item.cover)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ 
                                    position: 'absolute', inset: 0, 
                                    background: 'rgba(0,0,0,0.3)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    opacity: 0, transition: 'opacity 0.2s'
                                }} className="play-overlay">
                                    <PlayCircleOutlined style={{ fontSize: 32, color: '#fff' }} />
                                </div>
                            </div>
                            
                            <div style={{ padding: 12 }}>
                                <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.title}
                                </div>
                                <div style={{ fontSize: 12, color: '#86868b', marginTop: 4 }}>
                                    {item.singer?.name || 'Unknown'}
                                </div>
                            </div>
                        </div>
                    </Col>
                ))}
               </Row>
          </div>
      )}
      <style>{`
        .music-card:hover .play-overlay {
            opacity: 1 !important;
        }
        
        /* Grid View Checkbox */
        .music-checkbox-wrapper { opacity: 0; transition: opacity 0.2s; }
        .music-card:hover .music-checkbox-wrapper { opacity: 1; }
        .music-checkbox-wrapper.checked { opacity: 1; }
        
        /* List View Checkbox */
        .music-list-checkbox { opacity: 0; transition: opacity 0.2s; }
        .music-list-item:hover .music-list-checkbox { opacity: 1; }
        .music-list-checkbox.checked { opacity: 1; }
      `}</style>
      
      <MusicForm
        visible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onSuccess={handleEditSuccess}
        initialValues={currentEditMusic}
      />
    </Card>
  );
};

export default MusicListModule;
