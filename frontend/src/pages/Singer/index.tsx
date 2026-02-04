import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Space, Popconfirm, Grid, Skeleton } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getSingers, deleteSinger } from '../../api/singer';
import SingerForm from '../../components/SingerForm';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { message } from '../../utils/globalAntd';

const { useBreakpoint } = Grid;

const SingerList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const screens = useBreakpoint();
  
  // 弹窗控制
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentSinger, setCurrentSinger] = useState<any>(null);

  const fetchData = async (page = 1, pageSize = 10, name = '') => {
    setLoading(true);
    try {
      const res: any = await getSingers({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        name: name || undefined,
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
    fetchData(pagination.current, pagination.pageSize, searchText);
  }, []);

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchData(1, pagination.pageSize, searchText);
  };

  const handleTableChange = (page: number, pageSize: number) => {
      setPagination({ ...pagination, current: page, pageSize });
      fetchData(page, pageSize, searchText);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSinger(id);
      message.success('删除成功');
      // 避免删除后页面空白，如果当前页只有一条数据且不是第一页，则回到上一页
      const isLastOne = data.length === 1 && pagination.current > 1;
      const targetPage = isLastOne ? pagination.current - 1 : pagination.current;
      
      if (isLastOne) {
          setPagination(prev => ({ ...prev, current: targetPage }));
      }
      
      fetchData(targetPage, pagination.pageSize, searchText);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (record: any) => {
    setCurrentSinger(record);
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentSinger(null);
    setIsModalVisible(true);
  };

  const handleModalSuccess = () => {
    setIsModalVisible(false);
    fetchData(pagination.current, pagination.pageSize, searchText);
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
      title: '头像',
      dataIndex: 'avatar',
      width: 80,
      fixed: 'left',
      render: (avatar) => (
        avatar ? (
          <img 
            src={typeof avatar === 'string' && avatar.startsWith('http') ? avatar : `${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}/${avatar}`} 
            alt="avatar" 
            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} 
          />
        ) : <div style={{ width: 40, height: 40, background: '#eee', borderRadius: '50%' }} />
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 150,
      fixed: !screens.md ? 'left' : undefined,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      width: 80,
      render: (gender) => {
        const map: any = { male: '男', female: '女', band: '乐队', unknown: '未知' };
        return map[gender] || gender;
      }
    },
    {
      title: '地区',
      dataIndex: 'region',
      width: 120,
      responsive: ['sm'],
      render: (region) => {
          const map: any = {
              'China': '中国',
              'HongKong': '中国香港',
              'Taiwan': '中国台湾',
              'Japan': '日本',
              'Korea': '韩国',
              'Europe_America': '欧美',
              'Other': '其他'
          };
          return map[region] || region || '其他';
      }
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
            title="确定删除该歌手吗？"
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
      <Card title="歌手管理" extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增歌手
        </Button>
      }>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Input 
            placeholder="搜索歌手姓名" 
            value={searchText} 
            onChange={e => setSearchText(e.target.value)} 
            style={{ width: screens.md ? 200 : '100%' }} 
            onPressEnter={handleSearch}
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

        <SingerForm
          visible={isModalVisible}
          initialValues={currentSinger}
          onCancel={() => setIsModalVisible(false)}
          onSuccess={handleModalSuccess}
        />
      </Card>
    </ResponsiveContainer>
  );
};

export default SingerList;
