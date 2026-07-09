"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import Image from "next/image";

export default function LoginPage() {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await login(adminEmail, adminPassword, "admin");
      toast.success("Admin login successful!");
      router.push("/admin");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/univillage-logo.jpeg"
              alt="UniVillage Logo"
              width={96}
              height={96}
              className="object-contain rounded-xl shadow-sm"
              priority
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome to UniVillage</h2>
          <p className="mt-2 text-sm text-gray-600">Admin Authentication Portal</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Admin Email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in as Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="text-center text-sm text-gray-600">
          <p>Use your registered email and password to manage products and batches.</p>
        </div>
      </div>
    </div>
  );
}
