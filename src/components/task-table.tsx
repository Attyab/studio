
"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/lib/types";
import { useTasks } from "@/context/task-store-provider";
import { cn } from "@/lib/utils";
import TaskActions from "./task-actions";
import { NewTaskDialog } from "./new-task-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListTodo, Loader, CheckCircle2, Edit } from "lucide-react";
import { motion } from "framer-motion";


interface TaskTableProps {
  tasks: Task[];
  showAssignee?: boolean;
}

const priorityClasses: Record<Task['priority'], string> = {
  High: 'bg-destructive/80',
  Medium: 'bg-yellow-500', // Changed for better visibility in dark theme
  Low: 'bg-green-500',
};

const statusIcon: Record<Task['status'], React.ReactNode> = {
  "To Do": <ListTodo className="w-4 h-4 text-muted-foreground" />,
  "In Progress": <Loader className="w-4 h-4 text-muted-foreground animate-spin" />,
  "Done": <CheckCircle2 className="w-4 h-4 text-green-500" />,
};


export default function TaskTable({ tasks, showAssignee = true }: TaskTableProps) {
  const { users } = useTasks();
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);

  const getAssignee = (userId: string) => users.find((u) => u.id === userId);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg h-80 bg-card/50">
        <h3 className="text-xl font-semibold">No tasks found</h3>
        <p className="text-muted-foreground">Get started by creating a new task.</p>
        <div className="mt-4">
            <NewTaskDialog>
                <Button>Create Task</Button>
            </NewTaskDialog>
        </div>
      </div>
    )
  }

  return (
    <>
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            {showAssignee && <TableHead>Assignee</TableHead>}
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const assignee = getAssignee(task.assigneeId);
            return (
              <motion.tr 
                key={task.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-2">
                    {statusIcon[task.status]}
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="gap-2 text-foreground/80">
                     <span className={cn("h-2 w-2 rounded-full", priorityClasses[task.priority])} />
                    {task.priority}
                  </Badge>
                </TableCell>
                {showAssignee && (
                  <TableCell>
                    {assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={assignee.avatar} alt={assignee.name} />
                          <AvatarFallback>{assignee.initials}</AvatarFallback>
                        </Avatar>
                        <span>{assignee.name}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                )}
                <TableCell>{task.dueDate?.toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <TaskActions task={task} onEdit={() => setTaskToEdit(task)} />
                </TableCell>
              </motion.tr>
            );
          })}
        </TableBody>
      </Table>
    </Card>
    {taskToEdit && (
        <NewTaskDialog 
            key={taskToEdit.id} // Re-mount the dialog when the task changes
            taskToEdit={taskToEdit} 
            open={!!taskToEdit} 
            onOpenChange={(isOpen) => !isOpen && setTaskToEdit(undefined)}
        >
            {/* The trigger is not needed here as we control the dialog programmatically */}
            <button className="hidden" />
        </NewTaskDialog>
    )}
    </>
  );
}
