import React, { useState } from 'react';
import { Upload, Button, Progress, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import SparkMD5 from 'spark-md5';
import request from '../../utils/request';

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB per chunk

interface ChunkUploadProps {
  onSuccess?: (url: string) => void;
}

const ChunkUpload: React.FC<ChunkUploadProps> = ({ onSuccess }) => {
  const [percent, setPercent] = useState(0);
  const [uploading, setUploading] = useState(false);

  const calculateHash = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const spark = new SparkMD5.ArrayBuffer();
      const reader = new FileReader();
      const size = file.size;
      const offset = 2 * 1024 * 1024;
      const chunks = [file.slice(0, offset)];
      let cur = offset;
      while (cur < size) {
        if (cur + offset >= size) {
          chunks.push(file.slice(cur, cur + offset));
        } else {
          const mid = cur + offset / 2;
          const end = cur + offset;
          chunks.push(file.slice(cur, cur + 2));
          chunks.push(file.slice(mid, mid + 2));
          chunks.push(file.slice(end - 2, end));
        }
        cur += offset;
      }
      reader.readAsArrayBuffer(new Blob(chunks));
      reader.onload = (e) => {
        spark.append(e.target?.result as ArrayBuffer);
        resolve(spark.end());
      };
    });
  };

  const uploadChunks = async (file: File, hash: string) => {
    const chunkCount = Math.ceil(file.size / CHUNK_SIZE);
    const requests = [];

    for (let i = 0; i < chunkCount; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunk = file.slice(start, end);
      
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('hash', hash);
      formData.append('index', i.toString());
      formData.append('total', chunkCount.toString());

      // 模拟上传接口
      // requests.push(request.post('/common/upload_chunk', formData));
      
      // 真实场景需并发控制，这里简单处理
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
      setPercent(Math.floor(((i + 1) / chunkCount) * 100));
    }
    
    // await Promise.all(requests);
    
    // 合并请求
    // const res = await request.post('/common/merge_chunks', { hash, fileName: file.name });
    // return res.url;
    
    return 'mock_url_' + hash;
  };

  const customRequest = async (options: any) => {
    const { file } = options;
    setUploading(true);
    setPercent(0);

    try {
      // 1. 计算 Hash (Web Worker 更好)
      const hash = await calculateHash(file);
      console.log('File Hash:', hash);

      // 2. 检查秒传 (可选)
      // const checkRes = await request.get('/common/check_file', { params: { hash } });
      // if (checkRes.exist) { onSuccess(checkRes.url); return; }

      // 3. 分片上传
      const url = await uploadChunks(file, hash);
      
      message.success('上传成功');
      if (onSuccess) onSuccess(url);
    } catch (err) {
      message.error('上传失败');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Upload customRequest={customRequest} showUploadList={false}>
        <Button icon={<UploadOutlined />} loading={uploading}>
          大文件分片上传
        </Button>
      </Upload>
      {uploading && <Progress percent={percent} />}
    </div>
  );
};

export default ChunkUpload;
