"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { errorMessage } from "@/lib/api/client";

interface ConfirmRequest {
  title: string;
  description: string;
  confirmLabel: string;
  /** Toast shown when the action succeeds, e.g. "Project deleted". */
  successMessage?: string;
  action: () => Promise<unknown>;
}

/**
 * Confirmation for destructive actions without repeating dialog state on
 * every page:
 *   const [confirm, dialog] = useConfirm();
 *   confirm({ title: "Delete task?", ..., action: () => api.delete(...) });
 *   return <>{...}{dialog}</>;
 */
export function useConfirm(): [(request: ConfirmRequest) => void, ReactNode] {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!request) return;
    setLoading(true);
    try {
      await request.action();
      if (request.successMessage) toast.success(request.successMessage);
      setRequest(null);
    } catch (error) {
      toast.error(`${request.confirmLabel} failed`, { description: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  const dialog = (
    <ConfirmDialog
      open={request !== null}
      onClose={() => setRequest(null)}
      onConfirm={run}
      loading={loading}
      title={request?.title ?? ""}
      description={request?.description ?? ""}
      confirmLabel={request?.confirmLabel ?? ""}
    />
  );

  return [setRequest, dialog];
}
