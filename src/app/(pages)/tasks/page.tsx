"use client";

import { useTasks } from "@/context/task-store-provider";
import TaskTable from "@/components/task-table";
import { NewTaskDialog } from "@/components/new-task-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function TasksPage() {
  const { tasks, users } = useTasks();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTasks = tasks.filter(task => {
    const assignee = users.find(u => u.id === task.assigneeId);
    return task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (assignee && assignee.name.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xs">
            <Input 
                placeholder="Search tasks..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-8"
            />
        </div>
        <NewTaskDialog>
            <Button className="w-full md:w-auto">
                <PlusCircle className="w-4 h-4 mr-2" />
                New Task
            </Button>
        </NewTaskDialog>
      </div>
      <TaskTable tasks={filteredTasks} showAssignee={true} />
    </div>
  );
}
