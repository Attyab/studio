"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
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
  Bell
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { TaskStoreProvider, useTasks } from '@/context/task-store-provider';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { users, currentUser, changeCurrentUser } = useTasks();

  const menuItems = [
    { href: '/', label: 'My Dashboard', icon: LayoutDashboard },
    { href: '/tasks', label: 'All Tasks', icon: ListTodo },
    { href: '/calendar', label: 'Calendar', icon: CalendarDays },
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
                {currentUser && (
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
                <Button variant="ghost" size="icon" aria-label="Notifications">
                    <Bell className="w-5 h-5" />
                </Button>
                <Avatar>
                  <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} data-ai-hint="woman portrait"/>
                  <AvatarFallback>{currentUser?.initials}</AvatarFallback>
                </Avatar>
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
  return (
    <TaskStoreProvider>
      <AppShellContent>{children}</AppShellContent>
    </TaskStoreProvider>
  )
}
