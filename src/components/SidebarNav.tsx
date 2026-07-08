"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Library,
  StickyNote,
  Bookmark,
  BookOpen,
  Archive,
  Settings,
  Users,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Library', href: '/library', icon: Library },
  { name: 'Notes', href: '/notes', icon: StickyNote },
  { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { name: 'Journal', href: '/journal', icon: BookOpen },
  { name: 'Users', href: '/users?v=1', icon: Users },
  { name: 'Database', href: '/database', icon: Database },
  { name: 'Archive', href: '/archive', icon: Archive },
];

export function SidebarNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();
  const filteredNav = isSuperAdmin ? navigation : navigation.filter(item => item.name !== 'Users' && item.name !== 'Database');

  return (
    <>
      <nav className="flex flex-1 flex-col gap-1">
        {filteredNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground',
                isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground',
            pathname.startsWith('/settings') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </>
  );
}
