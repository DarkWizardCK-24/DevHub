import type { Metadata } from "next";
import { VaultHub } from "@/features/vault/vault-hub";

export const metadata: Metadata = { title: "Vault" };

export default async function VaultPage({ searchParams }: PageProps<"/vault">) {
  const { new: openNew } = await searchParams;
  return <VaultHub openNew={openNew === "1"} />;
}
