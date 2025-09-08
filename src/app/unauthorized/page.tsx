import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldX className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-700">
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            You don't have permission to access this page. Please contact your administrator for access.
          </p>
          <div className="space-y-2">
            <Link href="/" className="block">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Go to Home
              </Button>
            </Link>
            <Link href="/admin" className="block">
              <Button variant="outline" className="w-full">
                Admin Panel
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}