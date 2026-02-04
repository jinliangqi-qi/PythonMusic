import React, { useState } from 'react';
import { Upload, Button, Progress } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import request from '../../utils/request';
import { message } from '../../utils/globalAntd';

interface CommonUploadProps {
  accept?: string;
  maxSize?: number; // MB
  onSuccess: (path: string) => void;
  fileType?: 'image' | 'audio' | 'all';
}

const CommonUpload: React.FC<CommonUploadProps> = ({ 
    accept = '*', 
    maxSize = 50, 
    onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [percent, setPercent] = useState(0);

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess: onUploadSuccess, onError } = options;
    
    setLoading(true);
    setPercent(0);

    const formData = new FormData();
    formData.append('files', file);

    try {
        const res: any = await request.post('/common/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const p = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    setPercent(p);
                }
            }
        });

        // 假设后端返回 { data: [path1, path2] } 或直接返回 [path1]
        // 根据之前的实现，后端返回 success(data=[path])
        const paths = Array.isArray(res) ? res : (res.data || []);
        if (paths.length > 0) {
            const fileObj = paths[0];
            // 兼容后端返回对象或字符串的情况
            // 后端返回 { path: 'image/xxx.jpg', url: '...' }
            // 前端静态资源挂载在 /uploads，所以我们需要补充 uploads/ 前缀以便前端拼接
            let pathStr = '';
            if (typeof fileObj === 'string') {
                pathStr = fileObj;
            } else {
                pathStr = fileObj.path || fileObj.url;
            }
            
            // 确保路径以 uploads/ 开头（如果不是 http 链接）
            if (pathStr && !pathStr.startsWith('http') && !pathStr.startsWith('uploads/')) {
                pathStr = `uploads/${pathStr}`;
            }
            
            onSuccess(pathStr);
            onUploadSuccess?.(pathStr);
            message.success('上传成功');
        } else {
            throw new Error('上传失败，未获取到文件路径');
        }
    } catch (err: any) {
        console.error(err);
        onError?.(err);
        message.error('上传失败');
    } finally {
        setLoading(false);
        setPercent(0);
    }
  };

  const beforeUpload = (file: File) => {
    const isLtMax = file.size / 1024 / 1024 < maxSize;
    if (!isLtMax) {
      message.error(`文件大小不能超过 ${maxSize}MB!`);
    }
    return isLtMax;
  };

  return (
    <div>
        <Upload
            accept={accept}
            customRequest={customRequest}
            beforeUpload={beforeUpload}
            showUploadList={false}
        >
            <Button icon={<UploadOutlined />} loading={loading}>
                选择文件
            </Button>
        </Upload>
        {loading && <Progress percent={percent} size="small" status="active" style={{ marginTop: 8 }} />}
    </div>
  );
};

export default CommonUpload;
