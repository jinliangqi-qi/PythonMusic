import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Space, Tag, Popconfirm, Select, Grid, Skeleton } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getAlbums, deleteAlbum } from '../../api/album';
import { getSingers } from '../../api/singer';
import AlbumForm from '../../components/AlbumForm';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { message } from '../../utils/globalAntd';

const { useBreakpoint } = Grid;

const AlbumList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // 筛选条件
  const [searchText, setSearchText] = useState('');
  const [selectedSinger, setSelectedSinger] = useState<number | undefined>(undefined);
  const screens = useBreakpoint();
  
  // 歌手下拉数据
  const [singers, setSingers] = useState<any[]>([]);

  // 弹窗控制
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentAlbum, setCurrentAlbum] = useState<any>(null);

  // 获取歌手列表（用于筛选）
  useEffect(() => {
    const loadSingers = async () => {
        try {
            const res: any = await getSingers({ limit: 100 });
            // 兼容 list 结构
            if (res && res.list) {
                setSingers(res.list);
            } else if (Array.isArray(res)) {
                setSingers(res);
            } else {
                setSingers([]);
            }
        } catch (e) { 
            console.error(e);
            setSingers([]); // 出错时设为空数组
        }
    };
    loadSingers();
  }, []);

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res: any = await getAlbums({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        title: searchText || undefined,
        singer_id: selectedSinger,
      });
      if (res && res.list) {
          setData(res.list);
          setPagination(prev => ({ ...prev, total: res.total }));
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
    fetchData(pagination.current, pagination.pageSize);
  }, [selectedSinger]); // 监听筛选变化

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchData(1, pagination.pageSize);
  };

  const handleTableChange = (page: number, pageSize: number) => {
      setPagination({ ...pagination, current: page, pageSize });
      fetchData(page, pageSize);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAlbum(id);
      message.success('删除成功');
      fetchData(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (record: any) => {
    setCurrentAlbum(record);
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentAlbum(null);
    setIsModalVisible(true);
  };

  const handleModalSuccess = () => {
    setIsModalVisible(false);
    fetchData(pagination.current, pagination.pageSize);
  };

  const columns: ColumnsType<any> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      fixed: 'left',
      responsive: ['md'],
    },
    {
      title: '封面',
      dataIndex: 'cover',
      width: 80,
      fixed: 'left',
      render: (cover) => (
        cover ? (
          <img 
            src={typeof cover === 'string' && cover.startsWith('http') ? cover : `${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}/${cover}`} 
            alt="cover" 
            style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} 
          />
        ) : <div style={{ width: 40, height: 40, background: '#eee', borderRadius: 4 }} />
      ),
    },
    {
      title: '专辑名称',
      dataIndex: 'title',
      width: 200,
      fixed: !screens.md ? 'left' : undefined,
    },
    {
      title: '所属歌手',
      dataIndex: 'singer',
      width: 150,
      render: (singer) => singer?.name || '-',
    },
    {
      title: '发行日期',
      dataIndex: 'release_date',
      width: 120,
      responsive: ['sm'],
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 100,
      render: (is_active) => (
        <Tag color={is_active ? 'green' : 'red'}>
          {is_active ? '上架' : '下架'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            {screens.md && '编辑'}
          </Button>
          <Popconfirm
            title="确定删除该专辑吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              {screens.md && '删除'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ResponsiveContainer>
      <Card title="专辑管理" extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增专辑
        </Button>
      }>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Input 
            placeholder="搜索专辑名称" 
            value={searchText} 
            onChange={e => setSearchText(e.target.value)} 
            style={{ width: screens.md ? 200 : '100%' }} 
            onPressEnter={handleSearch}
          />
          <Select
              placeholder="按歌手筛选"
              style={{ width: screens.md ? 200 : '100%' }}
              allowClear
              showSearch
              optionFilterProp="label"
              onChange={val => setSelectedSinger(val)}
              options={singers.map(s => ({ label: s.name, value: s.id }))}
          />
          <Button icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
        </div>

        {loading && data.length === 0 ? (
          <Skeleton active />
        ) : (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={{
                ...pagination,
                onChange: handleTableChange
            }}
            scroll={{ x: 800 }}
            size={screens.md ? 'middle' : 'small'}
          />
        )}

        <AlbumForm
          visible={isModalVisible}
          initialValues={currentAlbum}
          onCancel={() => setIsModalVisible(false)}
          onSuccess={handleModalSuccess}
        />
      </Card>
    </ResponsiveContainer>
  );
};

export default AlbumList;
