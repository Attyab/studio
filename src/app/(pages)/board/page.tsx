
"use client";

import { KanbanBoard } from "@/components/kanban-board";
import { useTasks } from "@/context/task-store-provider";
import { Skeleton } from "@/components/ui/skeleton";

export default function BoardPage() {
    const { tasks, users, loading } = useTasks();

    if(loading) {
        return (
            <div className="flex justify-between h-full gap-6">
                <Skeleton className="w-1/3" />
                <Skeleton className="w-1/3" />
                <Skeleton className="w-1/3" />
            </div>
        )
    }

    return (
       <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
                <p className="text-muted-foreground">
                    Visualize your workflow and drag tasks to update their status.
                </p>
            </div>
            <KanbanBoard tasks={tasks} users={users} />
        </div>
    );
}
