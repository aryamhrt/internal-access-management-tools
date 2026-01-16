import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleAuth } from "@/components/GoogleAuth";
import { ENV } from "@/lib/constants";

export const LoginPage: React.FC = () => {
  const { user, googleLogin, isLoading } = useAuth();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  if (user && !isLoading) {
    return <Navigate to={from} replace />;
  }

  const handleGoogleSuccess = async (credential: string) => {
    setIsSubmitting(true);
    setError("");

    try {
      console.log("Processing Google credential...");
      await googleLogin(credential);
    } catch (err) {
      console.error("Google login failed:", err);
      setError(err instanceof Error ? err.message : "Google login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = (errorMessage: string) => {
    console.error("Google Sign-In error:", errorMessage);
    setError(`Google Sign-In failed: ${errorMessage}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Access Management System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in with your {ENV.ALLOWED_DOMAIN} Google account
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Google Sign-In
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Only @{ENV.ALLOWED_DOMAIN} email addresses are allowed
                </p>
              </div>

              <GoogleAuth
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {isSubmitting && (
              <div className="mt-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Signing you in...</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to use this system only with authorized{" "}
              {ENV.ALLOWED_DOMAIN} credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
