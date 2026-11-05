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

  // roleResolved: auth check is done AND the role has been populated.
  // If the user is logged in but userRole is still null it means the JWT
  // token / role fetch is still in-flight — treat this as still loading.
  const roleResolved = !loading && !(user !== null && userRole === null);

  useEffect(() => {

    if (roleResolved && (!user || userRole !== "admin")) {

      toast.error("Access denied. Admin authentication required.");

      router.push("/login");

    }

  }, [user, userRole, roleResolved, pathname, router]);



  if (!roleResolved) {

    return <Loader />;

  }



  if (!user || userRole !== "admin") {

    return null;

  }



  return <>{children}</>;

}

