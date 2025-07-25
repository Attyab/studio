
"use client";

import { useTasks } from "@/context/task-store-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListTodo, Loader, CheckCircle2, User as UserIcon } from "lucide-react";
import TaskTable from "@/components/task-table";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/app-shell";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";

function DashboardContent() {
  const { currentUser, getTasksByUserId, loading, users } = useTasks();

  if (loading || !currentUser) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
          <Skeleton className="h-[126px]" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  const userTasks = getTasksByUserId(currentUser.id);
  const totalTasks = userTasks.length;

  const stats = {
    "To Do": userTasks.filter(t => t.status === 'To Do').length,
    "In Progress": userTasks.filter(t => t.status === 'In Progress').length,
    "Done": userTasks.filter(t => t.status === 'Done').length,
  };

  const chartData = [
    { name: "To Do", value: stats["To Do"] },
    { name: "In Progress", value: stats["In Progress"] },
    { name: "Done", value: stats["Done"] },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="space-y-6">
       <motion.div 
          className="flex flex-col gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
       >
            <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {currentUser.name.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground">
                Here&apos;s a summary of your tasks and activities.
            </p>
        </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <ListTodo className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasks}</div>
                <p className="text-xs text-muted-foreground">All tasks assigned to you</p>
              </CardContent>
            </Card>
        </motion.div>
        <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">To Do</CardTitle>
                <ListTodo className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats["To Do"]}</div>
                <p className="text-xs text-muted-foreground">{Math.round((stats["To Do"]/totalTasks) * 100) || 0}% of total tasks</p>
              </CardContent>
            </Card>
        </motion.div>
        <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Loader className="w-4 h-4 text-muted-foreground animate-spin" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats["In Progress"]}</div>
                <p className="text-xs text-muted-foreground">{Math.round((stats["In Progress"]/totalTasks) * 100) || 0}% of total tasks</p>
              </CardContent>
            </Card>
        </motion.div>
        <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Done</CardTitle>
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats["Done"]}</div>
                <p className="text-xs text-muted-foreground">{Math.round((stats["Done"]/totalTasks) * 100) || 0}% of total tasks</p>
              </CardContent>
            </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        <motion.div className="lg:col-span-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle>My Tasks</CardTitle>
                <CardDescription>A list of tasks assigned to you.</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] overflow-auto">
                <TaskTable tasks={userTasks} showAssignee={false} />
              </CardContent>
            </Card>
        </motion.div>
        <motion.div className="lg:col-span-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
            <Card>
                <CardHeader>
                    <CardTitle>Task Status Overview</CardTitle>
                    <CardDescription>A visual breakdown of your tasks by status.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                            <Tooltip
                                contentStyle={{ 
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)"
                                }}
                                cursor={{fill: 'hsl(var(--muted))'}}
                            />
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </motion.div>
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
