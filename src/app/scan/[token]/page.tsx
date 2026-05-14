"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PublicQrResolution {
  productId: string;
  product?: {
    displayName?: string;
    skuCode?: string;
  };
  batchId: string;
  packetId: string;
  packetCode: string;
  batchCode: string;
  producedAt?: string | { seconds?: number; _seconds?: number } | null;
  statuses: {
    packet: string;
    batch: string;
    root: string;
  };
  recall: {
    active: boolean;
    recallIds: string[];
  };
}

export default function PublicQrScanPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<PublicQrResolution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function resolve() {
      try {
        const response = await fetch(`/api/traceability/resolve-qr?t=${encodeURIComponent(params.token)}`, {
          cache: "no-store",
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "QR lookup failed");
        if (mounted) setData(body.data);
      } catch (scanError) {
        if (mounted) setError(scanError instanceof Error ? scanError.message : "QR lookup failed");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void resolve();
    return () => {
      mounted = false;
    };
  }, [params.token]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
        <div className="mx-auto max-w-md space-y-4 pt-8">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-red-50 to-white p-4">
        <Card className="mx-auto mt-8 max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              QR could not be verified
            </CardTitle>
            <CardDescription>{error ?? "This QR code is not available."}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const recalled = data.recall.active || data.statuses.packet === "recalled" || data.statuses.batch === "recalled";
  const producedAt =
    typeof data.producedAt === "string"
      ? data.producedAt
      : data.producedAt?.seconds
        ? new Date(data.producedAt.seconds * 1000).toLocaleDateString()
        : data.producedAt?._seconds
          ? new Date(data.producedAt._seconds * 1000).toLocaleDateString()
          : "-";

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="mx-auto max-w-md space-y-4 pt-8">
        <Card className={recalled ? "border-red-300" : "border-green-200"}>
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
              {recalled ? <AlertTriangle className="h-6 w-6 text-red-600" /> : <ShieldCheck className="h-6 w-6" />}
            </div>
            <CardTitle>{recalled ? "Recall warning" : "Verified product"}</CardTitle>
            <CardDescription>
              {recalled
                ? "This product is connected to an active recall. Please contact support before use."
                : "This QR code resolves to a valid traceability record."}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traceability summary</CardTitle>
            <CardDescription>Public-safe product, batch, and packet information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Product reference</span>
              <span className="text-right font-semibold">
                {data.product?.displayName ?? data.product?.skuCode ?? data.productId}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Batch code</span>
              <span className="font-semibold">{data.batchCode}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Produced at</span>
              <span className="font-semibold">{producedAt}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Packet code</span>
              <span className="font-semibold">{data.packetCode}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Badge variant="outline">Product {data.statuses.root}</Badge>
              <Badge variant={data.statuses.batch === "recalled" ? "destructive" : "outline"}>
                Batch {data.statuses.batch}
              </Badge>
              <Badge variant={data.statuses.packet === "recalled" ? "destructive" : "outline"}>
                Packet {data.statuses.packet}
              </Badge>
            </div>
            {!recalled ? (
              <p className="flex items-center gap-2 pt-3 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                No active recall warning is attached to this record.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
