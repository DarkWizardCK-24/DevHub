import { GitBranch, KeyRound, ListChecks, NotebookPen } from "lucide-react";
import { Logo } from "@/components/shell/logo";
import { SetupRequired } from "@/components/setup/setup-required";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { isSupabaseConfigured } from "@/lib/env";

const HIGHLIGHTS = [
  { icon: ListChecks, label: "Kanban tasks", hint: "Plan sprints with drag and drop" },
  { icon: NotebookPen, label: "Markdown notes", hint: "Docs that live next to your code" },
  { icon: KeyRound, label: "Encrypted vault", hint: "AES-256 secrets, always masked" },
  { icon: GitBranch, label: "Release builds", hint: "Track every version you ship" },
];

/**
 * Split layout for sign-in screens. Desktop: aurora brand panel on the left,
 * form on the right. Mobile: the form fills the screen like a native app.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  if (!isSupabaseConfigured) return <SetupRequired />;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#0c0d1d] p-12 text-white lg:flex">
        <div aria-hidden className="absolute -top-32 -left-24 size-[28rem] rounded-full bg-[#6a6cf5] opacity-40 blur-[110px]" />
        <div aria-hidden className="absolute right-[-6rem] bottom-[-4rem] size-[26rem] rounded-full bg-[#9061f9] opacity-35 blur-[120px]" />
        <div aria-hidden className="absolute top-1/2 left-1/3 size-60 rounded-full bg-[#22b8cf] opacity-15 blur-[100px]" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:36px_36px] [mask-image:radial-gradient(ellipse_70%_60%_at_30%_20%,black,transparent)]"
        />

        <div className="relative">
          <Logo className="[&_span]:!text-white" />
        </div>

        <div className="relative max-w-lg">
          <h2 className="text-[40px] leading-[1.1] font-medium tracking-[-0.035em]">
            Everything you build,
            <br />
            <span className="bg-gradient-to-r from-[#a5a7ff] to-[#d0b4ff] bg-clip-text font-normal text-transparent">in one calm workspace.</span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed font-medium text-white/60">
            Projects, tasks, notes, snippets, files and releases, unified and fast, and only for the people your admin invites.
          </p>

          <ul className="mt-10 grid grid-cols-2 gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, label, hint }) => (
              <li key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md">
                <span className="grid size-8 place-items-center rounded-xl bg-white/10 text-[#c4c6ff]">
                  <Icon className="size-4" />
                </span>
                <p className="mt-3 text-sm font-medium">{label}</p>
                <p className="mt-0.5 text-xs font-medium text-white/50">{hint}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs font-medium text-white/40">© DevHub · Private workspace</p>
      </aside>

      <main className="relative flex flex-col px-5 pt-safe pb-safe sm:px-8">
        <div className="flex h-16 items-center justify-between lg:justify-end">
          <Logo className="lg:hidden" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[400px] rounded-[var(--radius-sheet)] border border-line/70 bg-surface/80 p-7 shadow-pop backdrop-blur-xl sm:p-9">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
