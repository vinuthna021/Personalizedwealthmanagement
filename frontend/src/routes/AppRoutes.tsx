import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../features/auth/Login';
import { Register } from '../features/auth/Register';
import { Dashboard } from '../features/profile/Dashboard';
import { Profile } from '../features/profile/Profile';
import { GoalsList } from '../features/goals/GoalsList';
import { PortfolioView } from '../features/portfolio/PortfolioView';
import { TransactionsList } from '../features/portfolio/TransactionsList';
import { Simulations } from '../features/simulations/Simulations';
import { Recommendations } from '../features/recommendations/Recommendations';
import { Reports } from '../features/reports/Reports';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/goals"
        element={
          <ProtectedRoute>
            <GoalsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portfolio"
        element={
          <ProtectedRoute>
            <PortfolioView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <TransactionsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/simulations"
        element={
          <ProtectedRoute>
            <Simulations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recommendations"
        element={
          <ProtectedRoute>
            <Recommendations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
