import { cn, initials } from "@/lib/utils";

/** Avatar image when the profile has one, otherwise initials. */
export function UserAvatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied host
    return <img src={src} alt="" className={cn("size-9 rounded-full object-cover ring-1 ring-line", className)} />;
  }
  return (
    <span
      className={cn("grid size-9 place-items-center rounded-full bg-iris-soft text-[13px] font-semibold text-iris ring-1 ring-line", className)}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
