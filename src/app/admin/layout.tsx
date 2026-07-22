"use client";



import { useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";

import toast from "react-hot-toast";

import { useAuth } from "@/contexts/AuthContext";

import Loader from "@/components/common/Loader";



export default function AdminLayout({ children }: { children: React.ReactNode }) {

  const { user, userRole, loading } = useAuth();

  const router = useRouter();

  const pathname = usePathname();



  useEffect(() => {

    if (!loading && (!user || userRole !== "admin")) {

      toast.error("Access denied. Admin authentication required.");

      router.push("/login");

    }

  }, [user, userRole, loading, pathname, router]);



  if (loading) {

    return <Loader />;

  }



  if (!user || userRole !== "admin") {

    return null;

  }



  return <>{children}</>;

}

