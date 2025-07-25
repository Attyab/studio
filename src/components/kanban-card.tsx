
"use client";

import { Draggable } from "react-beautiful-dnd";
import { Task, User } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface KanbanCardProps {
  task: Task;
  index: number;
  users: User[];
}

const priorityClasses: Record<Task["priority"], string> = {
  High: "bg-destructive/20 border-destructive/50",
  Medium: "bg-accent/20 border-accent/50",
  Low: "bg-primary/10 border-primary/20",
};

export function KanbanCard({ task, index, users }: KanbanCardProps) {
  const assignee = users.find((u) => u.id === task.assigneeId);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-4"
        >
          <Card
            className={cn(
              "hover:shadow-md transition-shadow duration-200",
              snapshot.isDragging ? "shadow-lg" : "",
              priorityClasses[task.priority]
            )}
          >
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-medium">{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                <p className="line-clamp-2">{task.description}</p>
            </CardContent>
            <CardFooter className="flex justify-between p-4 pt-0">
                <div className="flex items-center gap-2">
                    <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'secondary' : 'outline'}>{task.priority}</Badge>
                    {task.dueDate && (
                        <Badge variant="outline">
                            {formatDistanceToNow(task.dueDate, { addSuffix: true })}
                        </Badge>
                     )}
                </div>
                {assignee && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Avatar className="w-8 h-8">
                                <AvatarImage src={assignee.avatar} alt={assignee.name} />
                                <AvatarFallback>{assignee.initials}</AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{assignee.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </CardFooter>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
