import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import MerchantList from './pages/MerchantList';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import { isAuthenticated } from './utils/auth';
import 'antd/dist/reset.css';
import './styles/globals.css';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated() ? <Navigate to="/" replace /> : <Login />
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <MerchantList />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;