import React, { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import MusicForm from '../../components/MusicForm';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import MusicListModule from '../../components/MusicListModule';

const MusicList: React.FC = () => {
  // 仅在管理模式下使用表格，或者直接替换为新模块
  // 考虑到原有功能比较丰富（筛选等），我们可以将 MusicListModule 集成进来，作为一种视图模式
  // 但为了简化，根据需求“新增音乐列表模块...有删除按钮...全选删除”，
  // 我们可以直接在页面中使用 MusicListModule 替换原有表格，或者提供切换。
  
  // 这里为了满足用户需求，我将直接展示 MusicListModule，并保留原有的“创建音乐”按钮逻辑
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentMusic, setCurrentMusic] = useState<any>(null);
  
  const handleCreate = () => {
    setCurrentMusic(null);
    setIsModalVisible(true);
  };
  
  const handleSuccess = () => {
      setIsModalVisible(false);
      // 这里需要通知 MusicListModule 刷新，可以通过 key 或者 ref
      // 简单起见，强制刷新页面或组件
      window.location.reload(); 
  };

  return (
    <ResponsiveContainer>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>音乐管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              上传音乐
          </Button>
      </div>
      
      <MusicListModule defaultView="list" limit={100} />
      
      <MusicForm
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={handleSuccess}
        initialValues={currentMusic}
      />
    </ResponsiveContainer>
  );
};

export default MusicList;
