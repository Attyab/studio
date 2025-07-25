
"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  CalendarDays,
  ListTodo,
  Flame,
  Bell,
  LogOut,
  Loader2,
  Moon,
  Sun,
  Users,
  LayoutGrid,
} from 'lucide-react';
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { useTasks } from '@/context/task-store-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from './ui/skeleton';


function ThemeToggle() {
    const { setTheme, theme } = useTheme();

    return (
         <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Toggle theme"
        >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { users, currentUser, changeCurrentUser, logout, loading } = useTasks();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const menuItems = [
    { href: '/', label: 'My Dashboard', icon: LayoutDashboard },
    { href: '/tasks', label: 'All Tasks', icon: ListTodo },
    { href: '/board', label: 'Board', icon: LayoutGrid },
    { href: '/calendar', label: 'Calendar', icon: CalendarDays },
    { href: '/team', label: 'Teams', icon: Users },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Flame className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold font-headline">FIRE Tasks</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <div className="p-2 space-y-2">
                <label htmlFor="user-select" className="text-xs font-medium text-sidebar-foreground/70">CURRENT USER</label>
                {loading && <Skeleton className="h-10 w-full" />}
                {!loading && currentUser && (
                    <Select value={currentUser.id} onValueChange={changeCurrentUser}>
                        <SelectTrigger id="user-select" className="w-full">
                           <SelectValue>
                                <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                        <AvatarImage src={currentUser.avatar} alt={currentUser.name} data-ai-hint="woman portrait"/>
                                        <AvatarFallback>{currentUser.initials}</AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">{currentUser.name}</span>
                                </div>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {users.map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="w-6 h-6">
                                            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="man portrait"/>
                                            <AvatarFallback>{user.initials}</AvatarFallback>
                                        </Avatar>
                                        <span>{user.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b bg-card">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
                <ThemeToggle />
                <Button variant="ghost" size="icon" aria-label="Notifications">
                    <Bell className="w-5 h-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="relative w-8 h-8 rounded-full">
                       {loading ? <Skeleton className="w-8 h-8 rounded-full"/> : 
                        <Avatar>
                          <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} data-ai-hint="woman portrait"/>
                          <AvatarFallback>{currentUser?.initials}</AvatarFallback>
                        </Avatar>
                       }
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useTasks();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !currentUser && pathname !== '/login' && pathname !== '/signup') {
      router.push('/login');
    }
  }, [currentUser, loading, pathname, router]);

  if (loading && pathname !== '/login' && pathname !== '/signup') {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );
  }

  if (!currentUser && (pathname === '/login' || pathname === '/signup')) {
    return <>{children}</>;
  }
  
  if (!currentUser && !loading) {
    return null;
  }
  
  if (currentUser) {
    return <AppShellContent>{children}</AppShellContent>;
  }

  return <>{children}</>;
}
