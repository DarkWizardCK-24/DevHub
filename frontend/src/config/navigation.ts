import {
  CodeXml,
  FolderKanban,
  History,
  KeyRound,
  LayoutDashboard,
  Link2,
  ListChecks,
  NotebookPen,
  Package,
  Paperclip,
  Settings,
  ShieldCheck,
  ScrollText,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Short description shown in the mobile "More" sheet. */
  hint: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/** Single source of truth: sidebar, tab bar and More sheet all read from here. */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Work",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, hint: "Today at a glance" },
      { label: "Projects", href: "/projects", icon: FolderKanban, hint: "Everything you're building" },
      { label: "Tasks", href: "/tasks", icon: ListChecks, hint: "List, board and calendar" },
      { label: "Builds", href: "/builds", icon: Package, hint: "Releases and artifacts" },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { label: "Notes", href: "/notes", icon: NotebookPen, hint: "Markdown docs per project" },
      { label: "Snippets", href: "/snippets", icon: CodeXml, hint: "Reusable code" },
      { label: "Files", href: "/files", icon: Paperclip, hint: "Screenshots, PDFs, designs" },
      { label: "Links", href: "/links", icon: Link2, hint: "Dashboards, repos, docs" },
    ],
  },
  {
    label: "Private",
    items: [
      { label: "Vault", href: "/vault", icon: KeyRound, hint: "Keys and dev credentials" },
      { label: "Activity", href: "/activity", icon: History, hint: "What changed, when" },
      { label: "Settings", href: "/settings", icon: Settings, hint: "Profile and preferences" },
    ],
  },
];

export const ADMIN_NAV_ITEM: NavItem = { label: "Admin", href: "/admin", icon: ShieldCheck, hint: "Users and system health" };

export const ADMIN_SECTIONS: NavItem[] = [
  { label: "Overview", href: "/admin", icon: ShieldCheck, hint: "System health" },
  { label: "Users", href: "/admin/users", icon: Users, hint: "Roles and access" },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban, hint: "All workspace projects" },
  { label: "Audit log", href: "/admin/audit", icon: ScrollText, hint: "Every action, timestamped" },
];

const ALL_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

/** Tabs pinned to the mobile bottom bar (the center slot is the create button). */
export const MOBILE_TABS: NavItem[] = ["/dashboard", "/projects", "/tasks"].map(
  (href) => ALL_ITEMS.find((item) => item.href === href)!,
);

export function isActive(pathname: string, href: string, exact = false) {
  return pathname === href || (!exact && pathname.startsWith(`${href}/`));
}
