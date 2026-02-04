import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Radio } from 'antd';
import dayjs from 'dayjs';
import CommonUpload from '../CommonUpload';
import { createAlbum, updateAlbum } from '../../api/album';
import { getSingers } from '../../api/singer';
import { message } from '../../utils/globalAntd';

interface AlbumFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialValues?: any;
}

const AlbumForm: React.FC<AlbumFormProps> = ({ visible, onCancel, onSuccess, initialValues }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [singers, setSingers] = useState<any[]>([]);
  const isEdit = !!initialValues;

  // 加载歌手列表（用于下拉选择）
  useEffect(() => {
    const fetchSingers = async () => {
      try {
        // 这里获取所有歌手，如果数量很大应该做搜索
        const res: any = await getSingers({ limit: 100 });
        if (res && res.list) {
            setSingers(res.list);
        } else if (Array.isArray(res)) {
            setSingers(res);
        } else {
            setSingers([]);
        }
      } catch (error) {
        console.error(error);
        setSingers([]);
      }
    };
    if (visible) {
      fetchSingers();
    }
  }, [visible]);

  // 回显数据
  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue({
        ...initialValues,
        release_date: initialValues.release_date ? dayjs(initialValues.release_date) : undefined,
        status: initialValues.is_active ? 'active' : 'hidden'
      });
    } else {
      form.resetFields();
    }
  }, [visible, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const submitData = {
        ...values,
        release_date: values.release_date ? values.release_date.format('YYYY-MM-DD') : null,
        is_active: values.status === 'active'
      };

      if (isEdit) {
        await updateAlbum(initialValues.id, submitData);
        message.success('更新专辑成功');
      } else {
        await createAlbum(submitData);
        message.success('创建专辑成功');
      }

      onSuccess();
    } catch (error) {
      console.error(error);
      // message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑专辑' : '新增专辑'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ status: 'active' }}
        preserve={false}
      >
        <Form.Item
          label="专辑名称"
          required
        >
          <Form.Item
            name="title"
            noStyle
            rules={[{ required: true, message: '请输入专辑名称' }]}
          >
            <Input placeholder="请输入专辑名称" />
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
              options={(Array.isArray(singers) ? singers : []).map(singer => ({ label: singer.name, value: singer.id }))}
            />
          </Form.Item>
        </Form.Item>

        <Form.Item
          label="封面"
        >
          <div style={{ display: 'none' }}>
            <Form.Item name="cover" noStyle>
                <Input type="hidden" />
            </Form.Item>
          </div>
          
          <CommonUpload
            fileType="image"
            accept="image/*"
            onSuccess={(path) => {
                form.setFieldValue('cover', path);
            }}
          />
          <Form.Item shouldUpdate={(prev, curr) => prev.cover !== curr.cover} noStyle>
            {({ getFieldValue }) => {
                const cover = getFieldValue('cover');
                return cover ? (
                    <div style={{ marginTop: 8 }}>
                        <img 
                            src={typeof cover === 'string' && cover.startsWith('http') ? cover : `${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}/${cover}`} 
                            alt="cover" 
                            style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }} 
                        />
                    </div>
                ) : null;
            }}
          </Form.Item>
        </Form.Item>

        <Form.Item
          label="发行日期"
        >
          <Form.Item name="release_date" noStyle>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form.Item>

        <Form.Item
          label="状态"
        >
          <Form.Item name="status" noStyle>
            <Radio.Group>
              <Radio value="active">上架</Radio>
              <Radio value="hidden">下架</Radio>
            </Radio.Group>
          </Form.Item>
        </Form.Item>
        
        <Form.Item
          label="简介"
        >
          <Form.Item name="description" noStyle>
            <Input.TextArea rows={4} placeholder="请输入专辑简介" />
          </Form.Item>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AlbumForm;
