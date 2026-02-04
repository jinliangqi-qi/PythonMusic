import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Radio, Row, Col, Grid } from 'antd';
import dayjs from 'dayjs';
import CommonUpload from '../CommonUpload';
import { createSinger, updateSinger } from '../../api/singer';
import { message } from '../../utils/globalAntd';

const { useBreakpoint } = Grid;

interface SingerFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialValues?: any; // 编辑时传入的数据
}

const SingerForm: React.FC<SingerFormProps> = ({ visible, onCancel, onSuccess, initialValues }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialValues;
  const screens = useBreakpoint();
  
  const modalWidth = screens.lg ? 800 : (screens.md ? 600 : '80%');

  // 监听 initialValues 变化，回显数据
  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue({
        ...initialValues,
        birthday: initialValues.birthday ? dayjs(initialValues.birthday) : undefined,
      });
    } else {
      form.resetFields();
    }
  }, [visible, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 处理日期格式
      const submitData = {
        ...values,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
      };

      if (isEdit) {
        await updateSinger(initialValues.id, submitData);
        message.success('更新歌手成功');
      } else {
        await createSinger(submitData);
        message.success('创建歌手成功');
      }

      onSuccess();
    } catch (error) {
      console.error(error);
      // message.error('操作失败'); // 同样不需要重复提示
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑歌手' : '新增歌手'}
      open={visible}
      maskClosable={false}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={modalWidth} 
      style={{ top: 20 }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ 
            status: 'active',
            gender: 'unknown'
        }}
        preserve={false}
      >
        <Row gutter={24}>
            <Col xs={24} md={12}>
                <Form.Item
                label="歌手姓名"
                required
                >
                <Form.Item
                name="name"
                noStyle
                rules={[{ required: true, message: '请输入歌手姓名' }]}
                >
                <Input placeholder="请输入歌手姓名" />
                </Form.Item>
                </Form.Item>

                <Form.Item
                label="性别"
                >
                <Form.Item name="gender" noStyle>
                <Radio.Group>
                    <Radio value="male">男</Radio>
                    <Radio value="female">女</Radio>
                    <Radio value="band">乐队</Radio>
                    <Radio value="unknown">未知</Radio>
                </Radio.Group>
                </Form.Item>
                </Form.Item>

                <Form.Item
                label="生日/成立日期"
                >
                <Form.Item name="birthday" noStyle>
                <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                </Form.Item>
                
                <Form.Item
                label="地区"
                >
                <Form.Item name="region" noStyle>
                    <Select placeholder="选择地区">
                        <Select.Option value="China">中国</Select.Option>
                        <Select.Option value="HongKong">中国香港</Select.Option>
                        <Select.Option value="Taiwan">中国台湾</Select.Option>
                        <Select.Option value="Japan">日本</Select.Option>
                        <Select.Option value="Korea">韩国</Select.Option>
                        <Select.Option value="Europe_America">欧美</Select.Option>
                        <Select.Option value="Other">其他</Select.Option>
                    </Select>
                </Form.Item>
                </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
                <Form.Item
                label="头像"
                >
                <div style={{ display: 'none' }}>
                    <Form.Item name="avatar" noStyle>
                        {/* 使用隐藏 Input 存储路径，通过 CommonUpload 回填 */}
                        <Input type="hidden" />
                    </Form.Item>
                </div>
                
                <CommonUpload
                    fileType="image"
                    accept="image/*"
                    onSuccess={(path) => {
                        form.setFieldValue('avatar', path);
                        // 强制更新显示（可选，如果需要预览）
                    }}
                />
                {/* 简单的图片预览 */}
                <Form.Item shouldUpdate={(prev, curr) => prev.avatar !== curr.avatar} noStyle>
                    {({ getFieldValue }) => {
                        const avatar = getFieldValue('avatar');
                        return avatar ? (
                            <div style={{ marginTop: 8 }}>
                                <img 
                                    src={typeof avatar === 'string' && avatar.startsWith('http') ? avatar : `${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}/${avatar}`} 
                                    alt="avatar" 
                                    style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }} 
                                />
                            </div>
                        ) : null;
                    }}
                </Form.Item>
                </Form.Item>

                <Form.Item
                label="简介"
                >
                <Form.Item name="bio" noStyle>
                <Input.TextArea rows={4} placeholder="请输入歌手简介" />
                </Form.Item>
                </Form.Item>
            </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default SingerForm;
