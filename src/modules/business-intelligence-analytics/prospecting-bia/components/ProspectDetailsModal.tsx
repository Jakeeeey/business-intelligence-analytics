"use client";

import * as React from "react";
import { toast } from "sonner";
import { Ban, CheckCheck, ExternalLink, Loader2, MapPin, PhoneCall, UserPlus } from "lucide-react";
import dynamic from "next/dynamic";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatDateLong, formatDateTime, isValidDate, titleCase, toISODate } from "@/lib/utils";

import type { CustomerProspect, ProspectStatus } from "../types";
import { normalizeProspectStatus } from "../utils/prospect-status";
import { formatPH } from "../utils/datetime";
import { ProspectStatusBadge } from "./ProspectStatusBadge";
import { ProbabilityBadge } from "./ProbabilityBadge";
import { DateTimePicker } from "./DateTimePicker";
import { useProspectWorkflow } from "../hooks/useProspectWorkflow";

// Leaflet touches `window` at import time; load it client-only.
const ProspectMap = dynamic(() => import("./ProspectMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted" />,
});

type WorkflowAction = "contact" | "drop" | "convert" | "toCustomer";

type ProspectDetailsModalProps = {
  prospect: CustomerProspect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesmanName: string;
  storeTypeName: string;
  /** Called after a successful mutation so the parent can refetch. */
  onChanged: () => void;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDateValue(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return isValidDate(d) ? formatDateLong(d) : value;
}

function formatDateTimeValue(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return isValidDate(d) ? formatDateTime(d) : value;
}

function text(value?: string | number | null): string {
  if (value === null || value === undefined) return "—";
  const s = String(value).trim();
  return s ? s : "—";
}

function toNum(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? parseFloat(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm font-medium text-foreground" title={typeof value === "string" ? value : undefined}>
        {value}
      </dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function ProspectDetailsModal({
  prospect,
  open,
  onOpenChange,
  salesmanName,
  storeTypeName,
  onChanged,
}: ProspectDetailsModalProps) {
  const { isSubmitting, updateStatus, convertToCustomer } = useProspectWorkflow();
  const [action, setAction] = React.useState<WorkflowAction | null>(null);
  const [probabilityInput, setProbabilityInput] = React.useState("");
  const [remarks, setRemarks] = React.useState("");
  const [schedule, setSchedule] = React.useState<Date | undefined>(undefined);
  const bodyRef = React.useRef<HTMLDivElement | null>(null);

  // Reset the transient action state whenever the dialog opens or the record changes.
  React.useEffect(() => {
    setAction(null);
    setProbabilityInput("");
    setRemarks("");
    setSchedule(undefined);
  }, [open, prospect?.id]);

  // The marketing form lives at the top of the body; bring it into view when opened.
  React.useEffect(() => {
    if (action === "contact" && bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [action]);

  if (!prospect) return null;

  const status: ProspectStatus = normalizeProspectStatus(prospect.prospect_status);
  const rawName = (prospect.customer_name ?? "").trim();
  const name = rawName ? titleCase(rawName) : "Unknown Customer";

  const imageUrl = prospect.customer_image
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/assets/${prospect.customer_image}`
    : null;

  const coords = prospect.location?.coordinates;
  const fromGeo = Array.isArray(coords) && coords.length === 2;
  const lng = fromGeo ? toNum(coords?.[0]) : toNum(prospect.longitude);
  const lat = fromGeo ? toNum(coords?.[1]) : toNum(prospect.latitude);
  const coordLabel = lat !== null && lng !== null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "—";
  const mapsUrl = lat !== null && lng !== null ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  const canContact = status === "pending";
  const canDrop = status === "pending" || status === "contacted";
  const canConvert = status === "contacted";
  const canToCustomer = status === "converted";

  const confirmLabel: Record<WorkflowAction, string> = {
    contact: "Save & Mark Contacted",
    drop: "Mark Dropped",
    convert: "Mark Converted",
    toCustomer: "Convert to Customer",
  };

  const afterSuccess = () => {
    setAction(null);
    setProbabilityInput("");
    setRemarks("");
    setSchedule(undefined);
    onChanged();
    onOpenChange(false);
  };

  const handleSubmitAction = async () => {
    if (action === "contact") {
      const num = Number(probabilityInput);
      if (!Number.isFinite(num) || num < 0 || num > 100) {
        toast.error("Invalid probability", { description: "Enter a value between 0 and 100." });
        return;
      }
      const scheduleValue = schedule
        ? `${toISODate(schedule)}T${String(schedule.getHours()).padStart(2, "0")}:${String(
            schedule.getMinutes()
          ).padStart(2, "0")}`
        : null;
      const ok = await updateStatus(prospect.id, "contacted", {
        percentage: num,
        remarks: remarks.trim() || null,
        schedule: scheduleValue,
      });
      if (ok) afterSuccess();
      return;
    }
    if (action === "drop" && (await updateStatus(prospect.id, "dropped"))) afterSuccess();
    if (action === "convert" && (await updateStatus(prospect.id, "converted"))) afterSuccess();
    if (action === "toCustomer" && (await convertToCustomer(prospect.id))) afterSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[760px]">
        <DialogHeader className="border-b px-6 py-5 text-left">
          <div className="flex items-start gap-4 pr-6">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-muted text-sm font-bold text-muted-foreground select-none">
              {getInitials(name)}
            </span>

            <div className="min-w-0 flex-1 space-y-2">
              <DialogTitle className="truncate text-lg leading-tight">{name}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2">
                <ProspectStatusBadge status={status} />
                <span className="text-xs text-muted-foreground">{text(prospect.customer_code)}</span>
                <span aria-hidden className="text-muted-foreground">
                  ·
                </span>
                <span className="text-xs text-muted-foreground">{text(prospect.type)}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            {action === "contact" && (
              <section className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                <h3 className="text-sm font-semibold text-foreground">Marketing input</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="prospect-probability" className="text-xs font-medium text-muted-foreground">
                      Probability (%) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="prospect-probability"
                      type="number"
                      min={0}
                      max={100}
                      inputMode="numeric"
                      placeholder="0–100"
                      value={probabilityInput}
                      onChange={(event) => setProbabilityInput(event.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="prospect-remarks" className="text-xs font-medium text-muted-foreground">
                      Remarks
                    </Label>
                    <Textarea
                      id="prospect-remarks"
                      rows={3}
                      placeholder="Notes from the contact…"
                      value={remarks}
                      onChange={(event) => setRemarks(event.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Schedule</Label>
                  <DateTimePicker value={schedule} onChange={setSchedule} />
                </div>
              </section>
            )}

            {imageUrl ? (
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                title="Open full size"
                className="block overflow-hidden rounded-xl border bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt={name} className="max-h-80 w-full object-contain" />
              </a>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
                No store image available
              </div>
            )}

            <Section title="Prospect">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Customer Code" value={text(prospect.customer_code)} />
                <Field label="Type" value={text(prospect.type)} />
                <Field label="Probability" value={<ProbabilityBadge value={prospect.percentage} />} />
                <Field label="Store Type" value={text(storeTypeName)} />
                <Field label="Prospect Date" value={formatDateValue(prospect.prospect_date)} />
                <Field label="Date Entered" value={formatDateTimeValue(prospect.date_entered)} />
              </dl>
            </Section>

            <Section title="Store">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Store Name" value={text(prospect.store_name)} />
                <Field label="Store Signage" value={text(prospect.store_signage)} />
                <Field label="Price Type" value={text(prospect.price_type)} />
                <Field label="Salesman" value={text(salesmanName)} />
              </dl>
            </Section>

            <Section title="Contact">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Contact Number" value={text(prospect.contact_number)} />
                <Field label="Telephone" value={text(prospect.tel_number)} />
                <Field label="Email" value={text(prospect.customer_email)} />
              </dl>
            </Section>

            <Section title="Financial">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Payment Term" value={text(prospect.payment_term)} />
                <Field label="Customer TIN" value={text(prospect.customer_tin)} />
                <Field label="Bank Details" value={text(prospect.bank_details)} />
              </dl>
            </Section>

            {(prospect.remarks || prospect.schedule) && (
              <Section title="Marketing Follow-up">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Schedule" value={formatPH(prospect.schedule)} />
                </dl>
                {prospect.remarks && (
                  <p className="text-sm whitespace-pre-wrap break-words text-foreground/80">
                    {prospect.remarks}
                  </p>
                )}
              </Section>
            )}

            <Section title="Location">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Barangay" value={text(prospect.brgy)} />
                <Field label="City / Municipality" value={text(prospect.city)} />
                <Field label="Province" value={text(prospect.province)} />
                <Field label="Coordinates" value={coordLabel} />
              </dl>
              {lat !== null && lng !== null ? (
                <div className="h-56 w-full overflow-hidden rounded-xl border">
                  <ProspectMap latitude={lat} longitude={lng} label={name} />
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
                  No pinned location for this prospect
                </div>
              )}

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <MapPin className="size-4" />
                  Open in Google Maps
                  <ExternalLink className="size-3.5 opacity-70" />
                </a>
              )}
            </Section>

            {prospect.otherDetails && (
              <Section title="Other Details">
                <p className="text-sm whitespace-pre-wrap break-words text-foreground/80">
                  {prospect.otherDetails}
                </p>
              </Section>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 border-t bg-muted/20 px-6 py-4 sm:justify-end">
          {action === null && (
            <>
              {canDrop && (
                <Button
                  variant="outline"
                  onClick={() => setAction("drop")}
                  disabled={isSubmitting}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Ban className="size-4" />
                  Mark Dropped
                </Button>
              )}
              {canContact && (
                <Button variant="outline" onClick={() => setAction("contact")} disabled={isSubmitting}>
                  <PhoneCall className="size-4" />
                  Mark Contacted
                </Button>
              )}
              {canConvert && (
                <Button onClick={() => setAction("convert")} disabled={isSubmitting}>
                  <CheckCheck className="size-4" />
                  Mark Converted
                </Button>
              )}
              {canToCustomer && (
                <Button onClick={() => setAction("toCustomer")} disabled={isSubmitting}>
                  <UserPlus className="size-4" />
                  Convert to Customer
                </Button>
              )}
              {status === "dropped" && (
                <p className="text-sm text-muted-foreground">
                  This prospect was dropped. No further actions.
                </p>
              )}
            </>
          )}

          {action === "contact" && (
            <>
              <Button variant="outline" onClick={() => setAction(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitAction}
                disabled={isSubmitting || probabilityInput.trim() === ""}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Working…
                  </>
                ) : (
                  confirmLabel.contact
                )}
              </Button>
            </>
          )}

          {(action === "drop" || action === "convert" || action === "toCustomer") && (
            <div className="w-full space-y-3">
              <p className="text-sm text-foreground">
                {action === "drop" && "Drop this prospect? This cannot be undone."}
                {action === "convert" && "Mark this prospect as converted?"}
                {action === "toCustomer" && "Create a customer record from this prospect?"}
              </p>
              <Separator />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAction(null)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  variant={action === "drop" ? "destructive" : "default"}
                  onClick={handleSubmitAction}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Working…
                    </>
                  ) : (
                    confirmLabel[action]
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
