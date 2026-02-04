import React from 'react';

interface AppleCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  extra?: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  hoverable?: boolean;
}

const AppleCard: React.FC<AppleCardProps> = ({ children, title, extra, style, onClick, hoverable = true }) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        padding: 24,
        transition: 'all 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        transform: 'translateZ(0)', // 开启硬件加速
        ...style,
      }}
      className={hoverable ? 'apple-card-hover' : ''}
    >
      {(title || extra) && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16 
        }}>
          {title && <div style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f' }}>{title}</div>}
          {extra}
        </div>
      )}
      {children}
      <style>{`
        .apple-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08) !important;
        }
      `}</style>
    </div>
  );
};

export default AppleCard;