import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import Dashboard from '../pages/Dashboard';
import BasicLayout from '../components/BasicLayout';
import ProductList from '../pages/Product';
import SupplierList from '../pages/Supplier';
import CustomerList from '../pages/Customer';
import PurchaseList from '../pages/Purchase';
import SalesList from '../pages/Sales';
import InventoryList from '../pages/Inventory';
import SysLogList from '../pages/SysLog';
import UserList from '../pages/User';
import CategoryList from '../pages/Category';
import WarehouseList from '../pages/Warehouse';
import { Result, Button } from 'antd';

// 403 页面
const Forbidden = () => (
  <Result
    status="403"
    title="403"
    subTitle="Sorry, you are not authorized to access this page."
    extra={<Button type="primary" href="/">Back Home</Button>}
  />
);

// 路由守卫组件
interface PrivateRouteProps {
  children: React.ReactElement;
  roles?: string[]; // 允许的角色
}

const PrivateRoute = ({ children, roles }: PrivateRouteProps) => {
  const { token, hasRole } = useUserStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !hasRole(roles)) {
    return <Forbidden />;
  }

  return children;
};

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        <Route path="/" element={<PrivateRoute><BasicLayout /></PrivateRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route path="/products" element={<ProductList />} />
            
            <Route path="/suppliers" element={<SupplierList />} />
            
            <Route path="/customers" element={<CustomerList />} />
            
            <Route path="/purchases" element={<PurchaseList />} />
            
            <Route path="/sales" element={<SalesList />} />
            
            <Route path="/inventory" element={<InventoryList />} />
            
            <Route path="/categories" element={<CategoryList />} />
            
            <Route path="/warehouses" element={<WarehouseList />} />
            
            <Route path="/sys_logs" element={
                <PrivateRoute roles={['super_admin', 'admin']}>
                  <SysLogList />
                </PrivateRoute>
            } />
            
            <Route path="/users" element={
                <PrivateRoute roles={['super_admin', 'admin']}>
                  <UserList />
                </PrivateRoute>
            } />
        </Route>
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
