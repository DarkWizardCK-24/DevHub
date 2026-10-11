"use client";

import { Button, type ButtonVariant } from "./button";
import { Modal } from "./modal";

/**
 * Confirmation step for destructive or high-impact actions. The confirm
 * button repeats the action's name ("Delete project"), never just "OK".
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  variant = "danger",
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: ButtonVariant;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title={title} description={description}>
      <div className="flex flex-col-reverse gap-2 pt-2 md:flex-row md:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading} className="h-12 md:h-10">
          Cancel
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading} className="h-12 md:h-10">
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
