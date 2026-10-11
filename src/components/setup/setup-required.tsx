import { LogoMark } from "@/components/shell/logo";
import { Card } from "@/components/ui/card";

const STEPS = [
  { title: "Create frontend/.env.local", body: "Copy frontend/.env.example and fill in your Supabase URL and publishable key." },
  { title: "Create backend/.env", body: "Copy backend/.env.example and add the database URL, secret key and vault key." },
  { title: "Run the migration", body: "Paste supabase/migrations/…_initial_schema.sql into the Supabase SQL editor and run it." },
  { title: "Restart both servers", body: "Next.js reads environment variables at startup." },
];

/** Shown instead of the app until Supabase environment variables exist. */
export function SetupRequired() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-lg">
        <LogoMark className="size-11" />
        <h1 className="mt-5 text-3xl font-bold">Connect DevHub to Supabase</h1>
        <p className="mt-2 text-muted">The app is running, but it doesn&apos;t have Supabase credentials yet.</p>
        <Card className="mt-6 p-2">
          <ol className="divide-y divide-line">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4 p-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </main>
  );
}
