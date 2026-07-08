# Inventory Management System

一个现代化、高性能的进销存管理系统，采用前后端分离架构设计。前端采用 React + Ant Design 实现简洁美观的管理界面，后端基于 FastAPI + SQLAlchemy (Async) 提供高效的异步 API 服务。


## ✨ 主要特性

*   **现代化架构**：前后端分离，基于 RESTful API 通信。
*   **极致性能**：后端全异步设计 (FastAPI + Async SQLAlchemy + aiosqlite)，支持高并发。
*   **简洁 UI**：前端采用 Ant Design 组件库，提供流畅的用户体验。
*   **RBAC 权限系统**：完善的角色权限控制（超级管理员、管理员、审核员、普通用户）。
*   **进销存管理**：支持产品、供应商、客户、采购、销售、库存的全方位管理。
*   **库存管理**：支持库存调整、盘点、低库存预警。
*   **文件处理**：支持图片文件的上传与管理，具备智能类型检测。
*   **数据可视化**：仪表盘提供直观的数据统计与概览。
*   **安全机制**：JWT 认证、接口限流 (Rate Limiting)、CORS 策略、密码加密存储。

## 🛠 技术栈

### 后端 (Backend)
*   **核心框架**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.9+)
*   **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/) (AsyncIO 模式)
*   **数据库**: SQLite (开发环境) / MySQL (生产环境支持)
*   **缓存**: Redis (用于缓存热点数据)
*   **身份认证**: OAuth2 + JWT (JSON Web Tokens)
*   **工具库**: Pydantic (数据校验), SlowAPI (限流)

### 前端 (Frontend)
*   **核心框架**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **UI 组件库**: [Ant Design 5](https://ant.design/)
*   **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
*   **路由管理**: React Router v6
*   **HTTP 客户端**: Axios
*   **语言**: TypeScript

## 📂 项目结构

```
interface/
├── app/                        # 后端核心代码
│   ├── api/                    # API 路由定义
│   ├── core/                   # 核心配置 (Config, Security, Cache, Middleware)
│   ├── crud/                   # 数据库 CRUD 操作
│   ├── db/                     # 数据库连接与会话管理
│   ├── models/                 # SQLAlchemy 数据模型
│   └── schemas/                # Pydantic 数据验证模型
├── frontend/                   # 前端核心代码
│   ├── src/
│   │   ├── api/                # 后端接口封装
│   │   ├── components/         # 公共组件
│   │   ├── pages/              # 页面组件 (Login, Dashboard, 产品管理等)
│   │   ├── store/              # 全局状态管理
│   │   └── utils/              # 工具函数
├── main.py                     # 后端启动入口
├── requirements.txt            # Python 依赖
└── README.md                   # 项目文档
```

## 🚀 快速开始

### 环境要求
*   Python 3.9+
*   Node.js 16+
*   Redis (可选，用于缓存和限流功能)

### 1. 后端启动

```bash
# 创建并激活虚拟环境 (推荐)
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# 安装依赖
pip install -r requirements.txt

# 启动服务
# 默认运行在 http://localhost:8000
# 首次启动会自动创建数据库表并初始化管理员账号 (admin / 123456)
python3 -m uvicorn main:app --reload
```

### 2. 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
# 默认运行在 http://localhost:5173
npm run dev
```

## 🔑 默认账号

*   **用户名**: `admin`
*   **密码**: `123456`
*   **角色**: Super Admin

## 📝 功能模块说明

1.  **仪表盘 (Dashboard)**: 展示产品、供应商、客户总数及采购/销售统计，低库存预警。
2.  **产品管理**: 支持产品的增删改查，SKU 唯一性校验，库存状态显示。
3.  **供应商管理**: 维护供应商信息及其联系方式。
4.  **客户管理**: 维护客户信息及其联系方式。
5.  **采购管理**:
    *   采购单创建、审核、入库流程
    *   自动更新库存
    *   采购明细管理
6.  **销售管理**:
    *   销售单创建、审核、发货、完成流程
    *   发货时自动扣减库存
    *   销售明细管理
7.  **库存管理**:
    *   库存变动记录查询
    *   库存调整
    *   库存盘点
8.  **用户中心**:
    *   **登录/注册**: 支持账号注册、登录及"忘记密码"找回功能。
    *   **权限控制**: 不同角色拥有不同的后台操作权限。

---