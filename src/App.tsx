import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { UsersPage } from "@/pages/UsersPage";
import { ApplicationsPage } from "@/pages/ApplicationsPage";
import { AccessRequestsPage } from "@/pages/AccessRequestsPage";
import { AccessRegistryPage } from "@/pages/AccessRegistryPage";
import { DebuggingPage } from "@/pages/DebuggingPage";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import "./styles/index.css";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route
                        path="/"
                        element={<Navigate to="/dashboard" replace />}
                      />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/users" element={<UsersPage />} />
                      <Route
                        path="/applications"
                        element={<ApplicationsPage />}
                      />
                      <Route path="/debugging" element={<DebuggingPage />} />
                      <Route
                        path="/access-requests"
                        element={<AccessRequestsPage />}
                      />
                      <Route
                        path="/access-registry"
                        element={<AccessRegistryPage />}
                      />
                      {/* Catch all route */}
                      <Route
                        path="*"
                        element={<Navigate to="/dashboard" replace />}
                      />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
