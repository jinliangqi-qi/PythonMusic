import React from 'react';
import { Row, Col } from 'antd';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 响应式布局容器
 * 
 * 作用：
 * 1. 控制内容区域的最大宽度，避免在大屏（如2K/4K）下内容过于分散
 * 2. 统一管理页面边距
 * 3. 结合 Ant Design Grid 系统实现自适应布局
 */
const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ 
  children, 
  className = '', 
  style = {} 
}) => {
  return (
    <div className={`responsive-wrapper ${className}`} style={style}>
      {/* 
        使用 Ant Design Grid 系统作为内部栅格 
        gutter: 栅格间距，也可以做成响应式 [16, 24]
      */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          {children}
        </Col>
      </Row>
    </div>
  );
};

export default ResponsiveContainer;
