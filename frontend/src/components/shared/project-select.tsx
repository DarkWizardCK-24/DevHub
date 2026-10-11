"use client";

import { forwardRef } from "react";
import { SelectField, type SelectFieldProps } from "@/components/ui/select-field";
import { useApi } from "@/hooks/use-api";
import type { ProjectOption } from "@/lib/types";

/** Project picker for forms, loaded from GET /api/projects/options. */
export const ProjectSelect = forwardRef<HTMLSelectElement, Omit<SelectFieldProps, "options"> & { noneLabel?: string }>(
  function ProjectSelect({ label = "Project", noneLabel = "No project", ...props }, ref) {
    const { data, isLoading } = useApi<ProjectOption[]>("/projects/options");
    return (
      <SelectField
        // Remount once options arrive: a native <select> can't hold a value
        // whose <option> doesn't exist yet, so the saved project would be lost.
        key={data ? "loaded" : "loading"}
        ref={ref}
        label={label}
        placeholder={isLoading ? "Loading projects…" : noneLabel}
        options={(data ?? []).filter((p) => p.status !== "archived").map((p) => ({ value: p.id, label: p.name }))}
        {...props}
      />
    );
  },
);

export function useProjectOptions() {
  return useApi<ProjectOption[]>("/projects/options").data ?? [];
}
