import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { LogoMark } from "@/components/shell/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <LogoMark className="mx-auto size-12" />
        <p className="mt-6 font-mono text-sm text-accent">404</p>
        <h1 className="mt-2 text-3xl font-bold">This page doesn&apos;t exist</h1>
        <p className="mt-2 text-muted">The link may be old, or the item was deleted.</p>
        <Link href="/dashboard" className={`${buttonStyles()} mt-6`}>
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
