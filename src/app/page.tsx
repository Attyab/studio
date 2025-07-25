
"use client";

import { useTasks } from "@/context/task-store-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, Loader, CheckCircle2 } from "lucide-react";
import TaskTable from "@/components/task-table";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/app-shell";

function DashboardContent() {
  const { currentUser, getTasksByUserId, loading } = useTasks();

  if (loading || !currentUser) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  const userTasks = getTasksByUserId(currentUser.id);

  const stats = {
    "To Do": userTasks.filter(t => t.status === 'To Do').length,
    "In Progress": userTasks.filter(t => t.status === 'In Progress').length,
    "Done": userTasks.filter(t => t.status === 'Done').length,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
            <ListTodo className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats["To Do"]}</div>
            <p className="text-xs text-muted-foreground">Tasks to start</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Loader className="w-4 h-4 text-muted-foreground animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats["In Progress"]}</div>
            <p className="text-xs text-muted-foreground">Tasks currently being worked on</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Done</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats["Done"]}</div>
            <p className="text-xs text-muted-foreground">Completed tasks</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold font-headline">My Tasks</h2>
        <TaskTable tasks={userTasks} showAssignee={false} />
      </div>
    </div>
  );
}


export default function Dashboard() {
    return (
        <AppShell>
            <DashboardContent />
        </AppShell>
    );
}
