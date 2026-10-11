"use client";

import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api/client";

/**
 * Open or download a stored file. The API returns a signed URL valid for
 * 60 seconds, so we request it at click time rather than ahead of time.
 *
 * The tab is opened synchronously (before the await) so popup blockers treat
 * it as a direct result of the click.
 */
export async function openFile(fileId: string, { download = false } = {}) {
  const tab = download ? null : window.open("about:blank", "_blank");
  try {
    const { url } = await api.get<{ url: string }>(`/files/${fileId}/url`, { download });
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else {
      window.location.href = url; // download disposition: the page stays put
    }
  } catch (error) {
    tab?.close();
    toast.error("Couldn't open the file", { description: errorMessage(error) });
  }
}
