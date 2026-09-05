"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, BookOpen, ListChecks } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classes", label: "Classes", icon: BookOpen },
  { href: "/assignments", label: "Assignments", icon: ListChecks },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-4 flex items-center gap-6 h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold shrink-0">
          <GraduationCap className="size-5 text-indigo-600" />
          <span>SchoolWork</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
