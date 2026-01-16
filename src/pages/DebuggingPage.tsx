import React from "react";
import { ApiTest } from "@/components/ApiTest";
import { DeploymentTest } from "@/components/DeploymentTest";
import { GoogleOAuthTest } from "@/components/GoogleOAuthTest";
import { ConsoleErrorAnalyzer } from "@/components/ConsoleErrorAnalyzer";

export const DebuggingPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Debugging Tools</h1>
        <p className="text-gray-600">Development and testing utilities</p>
      </div>

      <div className="space-y-8">
        <ConsoleErrorAnalyzer />
        <ApiTest />
        <DeploymentTest />
        <GoogleOAuthTest />
      </div>
    </div>
  );
};
