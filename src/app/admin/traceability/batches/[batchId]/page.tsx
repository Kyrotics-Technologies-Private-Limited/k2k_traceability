"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { traceabilityFetch } from "@/lib/traceability-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

type AnyRecord = Record<string, unknown>;

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function text(value: unknown, fallback = "-") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

export default function TraceabilityBatchDetailPage({ params }: { params: { batchId: string } }) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<AnyRecord | null>(null);
  const [packets, setPackets] = useState<AnyRecord[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [batchRes, packetRes] = await Promise.all([
          traceabilityFetch<{ data: AnyRecord }>(user, `/api/traceability/batches/${params.batchId}`),
          traceabilityFetch<{ items: AnyRecord[] }>(
            user,
            `/api/traceability/batches/${params.batchId}/packets?limit=100`
          ),
        ]);
        setDetail(batchRes.data);
        setPackets(packetRes.items);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load lineage");
      }
    }
    if (user) void load();
  }, [params.batchId, user]);

  const batch = detail?.batch as AnyRecord | undefined;
  const root = detail?.root as AnyRecord | undefined;
  const events = (detail?.recentEvents as AnyRecord[] | undefined) ?? [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Button asChild variant="outline">
          <Link href="/admin/traceability/batches" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to batches
          </Link>
        </Button>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Batch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-2xl font-bold">{text(batch?.batchCode, params.batchId)}</p>
              <Badge>{text(batch?.status, "unknown")}</Badge>
              <p>Facility: {text(batch?.facilityId)}</p>
              <p>Line: {text(batch?.productionLineId)}</p>
              <p>Produced: {formatDate(batch?.producedAt)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lineage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Product: <span className="font-mono">{text(batch?.productId)}</span></p>
              <p>Root: <span className="font-mono">{text(batch?.traceabilityRootId)}</span></p>
              <p>Root status: {text(root?.status)}</p>
              <p>Packets: {text(detail?.packetCount, String(packets.length))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recall status</CardTitle>
            </CardHeader>
            <CardContent>
              {batch?.activeRecallId || root?.activeRecallId ? (
                <Badge variant="destructive">Active recall</Badge>
              ) : (
                <Badge variant="outline">No active recall</Badge>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Packets in batch</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Packet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>QR</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packets.map((packet) => (
                  <TableRow key={text(packet.id)}>
                    <TableCell>{text(packet.packetCode)}</TableCell>
                    <TableCell><Badge variant="outline">{text(packet.status)}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{text(packet.qrCode)}</TableCell>
                    <TableCell>{formatDate(packet.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Batch audit timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length ? events.map((event: AnyRecord) => (
              <div key={text(event.id)} className="rounded border bg-white p-3">
                <Badge variant="outline">{text(event.type)}</Badge>
                <p className="mt-1 text-sm text-muted-foreground">{formatDate(event.timestamp)}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">No batch events found.</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
