import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Radio, Row, Col, Grid, Upload, Button } from 'antd';
import { UploadOutlined, LinkOutlined } from '@ant-design/icons';
import { createMusic, updateMusic, uploadFile } from '../../api/music';
import { getSingers } from '../../api/singer';
import { getAlbums } from '../../api/album';
import { getTags } from '../../api/tag';
import { message } from '../../utils/globalAntd';
import type { UploadFile, UploadProps } from 'antd';

const { useBreakpoint } = Grid;

interface MusicFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialValues?: any;
}

const MusicForm: React.FC<MusicFormProps> = ({ visible, onCancel, onSuccess, initialValues }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [singers, setSingers] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const isEdit = !!initialValues;
  const screens = useBreakpoint();

  // 动态计算 Modal 宽度
  const modalWidth = screens.lg ? 800 : (screens.md ? 600 : '80%');
  
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [coverList, setCoverList] = useState<UploadFile[]>([]);
  
  // 处理文件上传
  const customUpload = async (options: any, type: 'audio' | 'image') => {
      const { onSuccess, onError, file } = options;
      const formData = new FormData();
      formData.append('files', file);
      
      try {
          const res: any = await uploadFile(formData);
          if (res && res[0]) {
              const fileInfo = res[0];
              // 成功后填入表单
              if (type === 'audio') {
                  form.setFieldValue('file_path', fileInfo.url);
                  // 自动设置时长/大小等元数据（如果后端返回了）
                  // 这里后端目前只返回了 path/url，可以在 upload 接口优化返回 duration
              } else {
                  form.setFieldValue('cover', fileInfo.url);
              }
              onSuccess(fileInfo);
              message.success(`${type === 'audio' ? '音乐' : '封面'}上传成功`);
          } else {
              onError(new Error('Upload failed'));
          }
      } catch (err) {
          console.error(err);
          onError(err);
          message.error('上传失败');
      }
  };

  // 加载关联数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [singersRes, albumsRes, tagsRes] = await Promise.all([
            getSingers({ limit: 100 }),
            getAlbums({ limit: 100 }),
            getTags({ limit: 100 })
        ]);
        
        // 兼容数据结构
        const formatData = (res: any) => {
            if (res && res.list) return res.list;
            if (Array.isArray(res)) return res;
            return [];
        };

        setSingers(formatData(singersRes));
        setAlbums(formatData(albumsRes));
        setTags(formatData(tagsRes));
      } catch (error) {
        console.error(error);
        setSingers([]);
        setAlbums([]);
        setTags([]);
      }
    };
    if (visible) {
      fetchData();
    }
  }, [visible]);

  // 回显数据
  useEffect(() => {
    if (visible && initialValues) {
      // initialValues.tags 可能是 [{id, name}, ...] 对象数组，需要转为 id 数组供 Select 回显
      const formData = {
          ...initialValues,
          tag_ids: initialValues.tags?.map((t: any) => t.id) || []
      };
      form.setFieldsValue(formData);
    } else {
      form.resetFields();
    }
  }, [visible, initialValues, form]);

  // 歌手变化时，可联动过滤专辑（可选优化）
  const handleSingerChange = async () => {
      form.setFieldValue('album_id', undefined);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (isEdit) {
        await updateMusic(initialValues.id, values);
        message.success('更新音乐成功');
      } else {
        await createMusic({
            ...values,
            status: 'active' // 默认已上架
        });
        message.success('创建音乐成功');
      }

      onSuccess();
    } catch (error) {
      console.error(error);
      // message.error('操作失败'); // validateFields 失败时不需要提示
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑音乐' : '新增音乐'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={modalWidth} // 响应式宽度
      style={{ top: 20 }} // 避免太靠下
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ status: 'active', duration: 0 }}
        preserve={false}
      >
        <Row gutter={24}>
            {/* 左侧主要信息 */}
            <Col xs={24} md={12}>
                <Form.Item
                label="音乐标题"
                required
                >
                <Form.Item
                name="title"
                noStyle
                rules={[{ required: true, message: '请输入音乐标题' }]}
                >
                <Input placeholder="请输入音乐标题" />
                </Form.Item>
                </Form.Item>

                <Form.Item
                label="所属歌手"
                required
                >
                <Form.Item
                name="singer_id"
                noStyle
                rules={[{ required: true, message: '请选择歌手' }]}
                >
                <Select
                    placeholder="请选择歌手"
                    showSearch
                    filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    onChange={handleSingerChange}
                    options={singers.map(s => ({ label: s.name, value: s.id }))}
                />
                </Form.Item>
                </Form.Item>

                <Form.Item
                label="所属专辑"
                >
                <Form.Item name="album_id" noStyle>
                <Select
                    placeholder="请选择专辑（可选）"
                    showSearch
                    filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    allowClear
                    options={albums.map(a => ({ label: a.title, value: a.id }))}
                />
                </Form.Item>
                </Form.Item>

                <Form.Item
                label="音乐标签"
                >
                <Form.Item name="tag_ids" noStyle>
                <Select
                    mode="multiple"
                    placeholder="请选择标签"
                    options={tags.map(t => ({ label: t.name, value: t.id }))}
                />
                </Form.Item>
                </Form.Item>
            </Col>
            
            {/* 右侧文件与状态 */}
            <Col xs={24} md={12}>
                <Form.Item
                label="音乐文件"
                required
                >
                <div style={{ display: 'flex', gap: 8 }}>
                    <Form.Item
                        name="file_path"
                        noStyle
                        rules={[
                            { required: true, message: '请输入音乐文件URL或上传文件' },
                        ]}
                    >
                        <Input placeholder="输入 URL 或上传文件" prefix={<LinkOutlined />} />
                    </Form.Item>
                    <Upload 
                        customRequest={(opt) => customUpload(opt, 'audio')}
                        showUploadList={false}
                        accept="audio/*"
                    >
                        <Button icon={<UploadOutlined />}>上传</Button>
                    </Upload>
                </div>
                </Form.Item>

                <Form.Item
                label="封面（可选）"
                >
                <div style={{ display: 'flex', gap: 8 }}>
                    <Form.Item
                        name="cover"
                        noStyle
                    >
                        <Input placeholder="输入 URL 或上传封面" prefix={<LinkOutlined />} />
                    </Form.Item>
                    <Upload 
                        customRequest={(opt) => customUpload(opt, 'image')}
                        showUploadList={false}
                        accept="image/*"
                    >
                        <Button icon={<UploadOutlined />}>上传</Button>
                    </Upload>
                </div>
                <Form.Item shouldUpdate={(prev, curr) => prev.cover !== curr.cover} noStyle>
                    {({ getFieldValue }) => {
                        const cover = getFieldValue('cover');
                        return cover ? (
                            <div style={{ marginTop: 8 }}>
                                <img 
                                    src={cover} 
                                    alt="cover" 
                                    style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }} 
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                            </div>
                        ) : null;
                    }}
                </Form.Item>
                </Form.Item>
                
                {isEdit && (
                    <Form.Item
                    label="状态"
                    >
                    <Form.Item name="status" noStyle>
                    <Radio.Group>
                        <Radio value="active">已通过</Radio>
                        <Radio value="pending">待审核</Radio>
                        <Radio value="rejected">已驳回</Radio>
                    </Radio.Group>
                    </Form.Item>
                    </Form.Item>
                )}
            </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default MusicForm;
