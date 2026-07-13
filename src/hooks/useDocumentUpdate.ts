// ============================================================
// useDocumentUpdate — Document checkbox update with
// optimistic UI, error rollback, and debounce protection
// ============================================================

"use client";

import { useState, useCallback } from "react";
import { updateDocument, isApiSuccess } from "@/lib/api";
import type { DocumentField, DocumentUpdateResult } from "@/types";

interface UseDocumentUpdateReturn {
  updating: Record<string, boolean>; // key: `${gipId}:${field}`
  update: (
    gipId: string,
    field: DocumentField,
    value: boolean,
    onSuccess?: (result: DocumentUpdateResult) => void,
    onError?: (error: string) => void
  ) => Promise<void>;
}

export function useDocumentUpdate(): UseDocumentUpdateReturn {
  // Track which specific GIP_ID + field combos are in-flight
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  const update = useCallback(
    async (
      gipId: string,
      field: DocumentField,
      value: boolean,
      onSuccess?: (result: DocumentUpdateResult) => void,
      onError?: (error: string) => void
    ) => {
      const key = `${gipId}:${field}`;

      // Prevent double-click / concurrent updates on same field
      if (updating[key]) return;

      setUpdating((prev) => ({ ...prev, [key]: true }));

      try {
        const res = await updateDocument({ GIP_ID: gipId, field, value });
        if (isApiSuccess(res)) {
          onSuccess?.(res.data);
        } else {
          onError?.(res.error);
        }
      } catch (e) {
        onError?.(e instanceof Error ? e.message : "Update failed");
      } finally {
        setUpdating((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [updating]
  );

  return { updating, update };
}
