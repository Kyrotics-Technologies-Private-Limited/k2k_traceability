"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { buildQuery, traceabilityFetch } from "@/lib/traceability-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

type Section = "overview" | "batches" | "packets" | "qr" | "recalls" | "integrity" | "events";
type AnyRecord = Record<string, unknown>;

const sectionLinks: Array<{ section: Section; label: string; href: string }> = [
  { section: "overview", label: "Overview", href: "/admin/traceability" },
  { section: "batches", label: "Batches", href: "/admin/traceability/batches" },
  { section: "packets", label: "Packets", href: "/admin/traceability/packets" },
  { section: "qr", label: "QR", href: "/admin/traceability/qr" },
  { section: "recalls", label: "Recalls", href: "/admin/traceability/recalls" },
  { section: "integrity", label: "Integrity", href: "/admin/traceability/integrity" },
  { section: "events", label: "Events", href: "/admin/traceability/events" },
];

function hasTraceabilityAccess(role: unknown): boolean {
  return ["admin", "inventory_admin", "traceability_admin", "quality_admin", "viewer"].includes(
    String(role)
  );
}

function displayDate(value: unknown): string {
  if (!value) return "-";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function text(value: unknown, fallback = "-"): string {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function statusTone(status: unknown): "default" | "destructive" | "outline" | "secondary" {
  const value = String(status ?? "");
  if (["recalled", "open", "voided", "critical", "high"].includes(value)) return "destructive";
  if (["archived", "lifted", "resolved"].includes(value)) return "secondary";
  if (["planned", "created", "medium", "low"].includes(value)) return "outline";
  return "default";
}

function StatCard({ label, value, hint }: { label: string; value: unknown; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{String(value ?? 0)}</CardTitle>
      </CardHeader>
      {hint ? <CardContent className="text-sm text-muted-foreground">{hint}</CardContent> : null}
    </Card>
  );
}

function Timeline({ events }: { events: AnyRecord[] }) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground">No events yet.</p>;
  }
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={text(event.id)} className="rounded-lg border bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{text(event.type)}</Badge>
            <span className="text-sm font-medium">{text(event.entityType)}</span>
            <span className="font-mono text-xs text-muted-foreground">{text(event.entityId)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {displayDate(event.timestamp)} by {text(event.performedBy, "system")}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function TraceabilityAdminShell({ section }: { section: Section }) {
  const { user, userRole, loading } = useAuth();
  const [overview, setOverview] = useState<AnyRecord | null>(null);
  const [batches, setBatches] = useState<AnyRecord[]>([]);
  const [packets, setPackets] = useState<AnyRecord[]>([]);
  const [recalls, setRecalls] = useState<AnyRecord[]>([]);
  const [reports, setReports] = useState<AnyRecord[]>([]);
  const [events, setEvents] = useState<AnyRecord[]>([]);
  const [qrResult, setQrResult] = useState<AnyRecord | null>(null);
  const [qrExport, setQrExport] = useState<AnyRecord[]>([]);
  const [busy, setBusy] = useState(false);

  const [batchForm, setBatchForm] = useState({
    productId: "",
    traceabilityRootId: "",
    batchCode: "",
    facilityId: "",
    productionLineId: "",
    producedAt: new Date().toISOString().slice(0, 16),
  });
  const [packetForm, setPacketForm] = useState({
    batchId: "",
    productId: "",
    traceabilityRootId: "",
    packetCodePrefix: "PKT-",
    quantity: 10,
  });
  const [qrToken, setQrToken] = useState("");
  const [recallForm, setRecallForm] = useState({
    scope: "BATCH",
    productId: "",
    traceabilityRootId: "",
    batchId: "",
    packetId: "",
    reason: "",
  });

  const canRender = !loading && user && hasTraceabilityAccess(userRole);

  const loadOverview = useCallback(async () => {
    const res = await traceabilityFetch<{ data: AnyRecord }>(user, "/api/traceability/overview");
    setOverview(res.data);
  }, [user]);

  const loadBatches = useCallback(async () => {
    const res = await traceabilityFetch<{ items: AnyRecord[] }>(
      user,
      "/api/traceability/batches?limit=50"
    );
    setBatches(res.items);
  }, [user]);

  const loadPackets = useCallback(async () => {
    const res = await traceabilityFetch<{ items: AnyRecord[] }>(
      user,
      "/api/traceability/packets?limit=50"
    );
    setPackets(res.items);
  }, [user]);

  const loadRecalls = useCallback(async () => {
    const res = await traceabilityFetch<{ items: AnyRecord[] }>(
      user,
      "/api/traceability/recalls?limit=50"
    );
    setRecalls(res.items);
  }, [user]);

  const loadReports = useCallback(async () => {
    const res = await traceabilityFetch<{ items: AnyRecord[] }>(
      user,
      "/api/traceability/integrity/reports?limit=20"
    );
    setReports(res.items);
  }, [user]);

  const loadEvents = useCallback(async () => {
    const res = await traceabilityFetch<{ items: AnyRecord[] }>(
      user,
      "/api/traceability/events?limit=50"
    );
    setEvents(res.items);
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    try {
      if (section === "overview") await loadOverview();
      if (section === "batches") await loadBatches();
      if (section === "packets") await loadPackets();
      if (section === "recalls") await loadRecalls();
      if (section === "integrity") await loadReports();
      if (section === "events") await loadEvents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load traceability data");
    } finally {
      setBusy(false);
    }
  }, [loadBatches, loadEvents, loadOverview, loadPackets, loadRecalls, loadReports, section, user]);

  useEffect(() => {
    if (canRender) void refresh();
  }, [canRender, refresh]);

  const stats = (overview?.stats as AnyRecord | undefined) ?? {};
  const recentScans = (overview?.recentScans as AnyRecord[] | undefined) ?? [];
  const recentOverviewEvents = (overview?.recentEvents as AnyRecord[] | undefined) ?? [];
  const activeLink = useMemo(() => sectionLinks.find((link) => link.section === section), [section]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Verifying traceability access...</div>;
  }
  if (!canRender) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <Card>
          <CardHeader>
            <CardTitle>Traceability access required</CardTitle>
            <CardDescription>
              Sign in with an admin, traceability, quality, inventory, or viewer role.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  async function withToast(action: () => Promise<void>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Traceability operation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm uppercase tracking-wide text-green-700">Traceability Operations</p>
            <h1 className="text-3xl font-bold text-slate-950">{activeLink?.label ?? "Dashboard"}</h1>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Admin Panel
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {sectionLinks.map((link) => (
            <Button key={link.section} asChild variant={link.section === section ? "default" : "outline"}>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          <Button variant="ghost" onClick={refresh} disabled={busy}>
            {busy ? "Working..." : "Refresh"}
          </Button>
        </div>

        {section === "overview" ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <StatCard label="Active batches" value={stats.activeBatches} />
              <StatCard label="Active recalls" value={stats.activeRecalls} />
              <StatCard label="Packets" value={stats.packetCount} />
              <StatCard label="Orphan alerts" value={stats.orphanAlerts} />
              <StatCard label="Duplicate alerts" value={stats.duplicateAlerts} />
              <StatCard label="Stale QR mappings" value={stats.staleQrMappings} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent scans</CardTitle>
                </CardHeader>
                <CardContent>
                  <Timeline events={recentScans} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Recent events</CardTitle>
                </CardHeader>
                <CardContent>
                  <Timeline events={recentOverviewEvents} />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        {section === "batches" ? (
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Create batch</CardTitle>
                <CardDescription>Creates an operational batch under an existing traceability root.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(["productId", "traceabilityRootId", "batchCode", "facilityId", "productionLineId"] as const).map(
                  (field) => (
                    <Input
                      key={field}
                      placeholder={field}
                      value={batchForm[field]}
                      onChange={(event) => setBatchForm({ ...batchForm, [field]: event.target.value })}
                    />
                  )
                )}
                <Input
                  type="datetime-local"
                  value={batchForm.producedAt}
                  onChange={(event) => setBatchForm({ ...batchForm, producedAt: event.target.value })}
                />
                <Button
                  className="w-full"
                  disabled={busy}
                  onClick={() =>
                    withToast(async () => {
                      await traceabilityFetch(user, "/api/traceability/batches", {
                        method: "POST",
                        body: JSON.stringify(batchForm),
                      });
                    }, "Batch created")
                  }
                >
                  Create batch
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Batch management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Facility</TableHead>
                      <TableHead>Line</TableHead>
                      <TableHead>Produced</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={text(batch.id)}>
                        <TableCell className="font-medium">
                          <Link className="text-green-700 underline-offset-4 hover:underline" href={`/admin/traceability/batches/${text(batch.batchId)}`}>
                            {text(batch.batchCode, text(batch.id))}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusTone(batch.status)}>{text(batch.status)}</Badge>
                        </TableCell>
                        <TableCell>{text(batch.facilityId)}</TableCell>
                        <TableCell>{text(batch.productionLineId)}</TableCell>
                        <TableCell>{displayDate(batch.producedAt)}</TableCell>
                        <TableCell className="space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setPacketForm({ ...packetForm, batchId: text(batch.batchId, ""), productId: text(batch.productId, ""), traceabilityRootId: text(batch.traceabilityRootId, "") })}>
                            Generate packets
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => withToast(() => traceabilityFetch(user, `/api/traceability/batches/${text(batch.batchId)}`, { method: "POST", body: JSON.stringify({ action: "archive", reason: "Archived from admin UI" }) }), "Batch archived")}>
                            Archive
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => withToast(() => traceabilityFetch(user, `/api/traceability/batches/${text(batch.batchId)}`, { method: "POST", body: JSON.stringify({ action: "void", reason: "Voided from admin UI" }) }), "Batch voided")}>
                            Void
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {section === "packets" ? (
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Bulk packet generation</CardTitle>
                <CardDescription>Writes packets, QR aliases, and events in safe batches.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(["batchId", "productId", "traceabilityRootId", "packetCodePrefix"] as const).map((field) => (
                  <Input key={field} placeholder={field} value={packetForm[field]} onChange={(event) => setPacketForm({ ...packetForm, [field]: event.target.value })} />
                ))}
                <Input type="number" min={1} max={5000} value={packetForm.quantity} onChange={(event) => setPacketForm({ ...packetForm, quantity: Number(event.target.value) })} />
                <Button
                  className="w-full"
                  disabled={busy}
                  onClick={() =>
                    withToast(async () => {
                      await traceabilityFetch(user, `/api/traceability/batches/${packetForm.batchId}/packets`, {
                        method: "POST",
                        body: JSON.stringify(packetForm),
                      });
                    }, "Packets generated")
                  }
                >
                  Generate packets
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Packets</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>QR token</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packets.map((packet) => (
                      <TableRow key={text(packet.id)}>
                        <TableCell>{text(packet.packetCode)}</TableCell>
                        <TableCell>
                          <Badge variant={statusTone(packet.status)}>{String(packet.status).toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{text(packet.batchId)}</TableCell>
                        <TableCell className="font-mono text-xs">{text(packet.qrCode)}</TableCell>
                        <TableCell className="space-x-2">
                          <Button size="sm" variant="outline" onClick={() => withToast(() => traceabilityFetch(user, `/api/traceability/packets/${text(packet.packetId)}`, { method: "PATCH", body: JSON.stringify({ status: "sealed" }) }), "Packet sealed")}>
                            Seal
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => withToast(() => traceabilityFetch(user, `/api/traceability/packets/${text(packet.packetId)}`, { method: "PATCH", body: JSON.stringify({ status: "voided", reason: "Voided from admin UI" }) }), "Packet voided")}>
                            Void
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {section === "qr" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>QR verification</CardTitle>
                <CardDescription>Verifies opaque QR tokens and writes an admin audit event.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="32 character QR token" value={qrToken} onChange={(event) => setQrToken(event.target.value)} />
                <Button onClick={() => withToast(async () => {
                  const res = await traceabilityFetch<{ data: AnyRecord }>(user, "/api/traceability/qr/verify", { method: "POST", body: JSON.stringify({ token: qrToken, logScan: true }) });
                  setQrResult(res.data);
                }, "QR verified")}>Verify QR</Button>
                {qrResult ? <pre className="overflow-auto rounded bg-slate-900 p-3 text-xs text-white">{JSON.stringify(qrResult, null, 2)}</pre> : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>QR export and print</CardTitle>
                <CardDescription>Use batch ID to export label data. Browser print can create QR sheets.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="batchId for export" value={packetForm.batchId} onChange={(event) => setPacketForm({ ...packetForm, batchId: event.target.value })} />
                <Button onClick={() => withToast(async () => {
                  const res = await traceabilityFetch<{ items: AnyRecord[] }>(user, `/api/traceability/qr/export${buildQuery({ batchId: packetForm.batchId, limit: 200 })}`);
                  setQrExport(res.items);
                }, "QR export loaded")}>Load export</Button>
                <div className="grid grid-cols-2 gap-3 print:grid-cols-3">
                  {qrExport.map((item) => (
                    <div key={text(item.packetId)} className="rounded border bg-white p-3 text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="mx-auto h-28 w-28" alt={`QR for ${text(item.packetCode, "packet")}`} src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(text(item.qrUrl, ""))}`} />
                      <p className="mt-2 text-sm font-medium">{text(item.packetCode)}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{text(item.qrToken)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {section === "recalls" ? (
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Create recall</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="scope PRODUCT, BATCH, or PACKET" value={recallForm.scope} onChange={(event) => setRecallForm({ ...recallForm, scope: event.target.value.toUpperCase() })} />
                {(["productId", "traceabilityRootId", "batchId", "packetId"] as const).map((field) => (
                  <Input key={field} placeholder={field} value={recallForm[field]} onChange={(event) => setRecallForm({ ...recallForm, [field]: event.target.value })} />
                ))}
                <Textarea placeholder="Recall reason" value={recallForm.reason} onChange={(event) => setRecallForm({ ...recallForm, reason: event.target.value })} />
                <Button className="w-full" onClick={() => withToast(() => traceabilityFetch(user, "/api/traceability/recalls", { method: "POST", body: JSON.stringify(recallForm) }), "Recall opened")}>
                  Open recall
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recall cases</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scope</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recalls.map((recall) => (
                      <TableRow key={text(recall.id)}>
                        <TableCell>{text(recall.scope)}</TableCell>
                        <TableCell><Badge variant={statusTone(recall.status)}>{text(recall.status)}</Badge></TableCell>
                        <TableCell>{text(recall.reason)}</TableCell>
                        <TableCell>{displayDate(recall.openedAt)}</TableCell>
                        <TableCell>
                          {recall.status === "open" ? (
                            <Button size="sm" variant="outline" onClick={() => withToast(() => traceabilityFetch(user, `/api/traceability/recalls/${text(recall.recallId)}`, { method: "PATCH", body: JSON.stringify({ action: "lift", reason: "Resolved from admin UI" }) }), "Recall lifted")}>
                              Resolve
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {section === "integrity" ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integrity and reconciliation</CardTitle>
                <CardDescription>Run bounded operational scans and review persisted reconciliation jobs.</CardDescription>
              </CardHeader>
              <CardContent className="space-x-2">
                <Button onClick={() => withToast(() => traceabilityFetch(user, "/api/traceability/reconciliation", { method: "POST", body: JSON.stringify({ maxBatchDocs: 500, maxPacketDocs: 500 }) }), "Reconciliation completed")}>
                  Run scan
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Violations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={text(report.id)}>
                        <TableCell className="font-mono text-xs">{text(report.jobId, text(report.id))}</TableCell>
                        <TableCell><Badge variant={statusTone(report.status)}>{text(report.status)}</Badge></TableCell>
                        <TableCell>{text(report.type)}</TableCell>
                        <TableCell>{displayDate(report.createdAt)}</TableCell>
                        <TableCell>{text((report.summary as { violationTotal?: unknown } | undefined)?.violationTotal, "0")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {section === "events" ? (
          <Card>
            <CardHeader>
              <CardTitle>Append-only timeline</CardTitle>
              <CardDescription>Packet, batch, recall, QR, and reconciliation audit history.</CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline events={events} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
