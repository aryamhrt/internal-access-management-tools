import React, { useEffect, useRef } from "react";
import { ENV } from "@/lib/constants";

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleAuthProps {
  onSuccess: (credential: string) => void;
  onError: (error: string) => void;
}

export const GoogleAuth: React.FC<GoogleAuthProps> = ({
  onSuccess,
  onError,
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  // Debug: Component initialization
  console.log("🔄 GoogleAuth component rendered");
  console.log("📋 Environment check:", {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Missing",
    domain: import.meta.env.VITE_ALLOWED_DOMAIN ? "✅ Set" : "❌ Missing",
    googleLoaded: typeof window !== "undefined" && !!(window as any).google,
  });

  useEffect(() => {
    // Initialize Google Sign-In
    const initializeGoogleSignIn = () => {
      console.log(
        "Initializing Google Sign-In with client ID:",
        ENV.GOOGLE_CLIENT_ID,
      );

      if (window.google && window.google.accounts) {
        try {
          window.google.accounts.id.initialize({
            client_id: ENV.GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            context: "signin",
            ux_mode: "popup",
            allowed_parent_origin: window.location.origin,
          });

          console.log("Google Sign-In initialized successfully");

          // Render the sign-in button
          if (buttonRef.current) {
            window.google.accounts.id.renderButton(buttonRef.current, {
              theme: "outline",
              size: "large",
              text: "signin_with",
              shape: "rectangular",
              logo_alignment: "left",
            });
            console.log("Google Sign-In button rendered");
          }

          // Display the One Tap prompt (optional)
          window.google.accounts.id.prompt();
        } catch (error) {
          console.error("Error initializing Google Sign-In:", error);
          onError(
            "Failed to initialize Google Sign-In: " +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      } else {
        console.error("Google Identity Services not loaded");
        onError("Google Identity Services failed to load");
      }
    };

    // Load Google Identity Services if not already loaded
    if (!window.google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }

    return () => {
      // Cleanup
      if (window.google && window.google.accounts) {
        window.google.accounts.id.cancel();
      }
    };
  }, []);

  const handleCredentialResponse = (response: any) => {
    console.log("🔐 Google Sign-In Response:", response);

    try {
      if (response.credential) {
        console.log(
          "✅ Credential received, length:",
          response.credential.length,
        );
        console.log("📧 Processing credential...");

        // Decode JWT payload to check email (for debugging)
        try {
          const payload = JSON.parse(atob(response.credential.split(".")[1]));
          console.log("👤 User info:", {
            email: payload.email,
            name: payload.name,
            domain: payload.email ? payload.email.split("@")[1] : "unknown",
          });
        } catch (decodeError) {
          console.warn("⚠️ Could not decode JWT payload:", decodeError);
        }

        onSuccess(response.credential);
      } else {
        console.error("❌ No credential in response");
        onError("No credential received from Google");
      }
    } catch (error) {
      console.error("💥 Google Sign-In processing error:", error);
      onError(error instanceof Error ? error.message : "Google Sign-In failed");
    }
  };

  return (
    <div className="google-auth-container">
      <div
        ref={buttonRef}
        className="google-signin-button"
        style={{ width: "100%", maxWidth: "400px" }}
      />
    </div>
  );
};
