
"use client";

import { Droppable } from "react-beautiful-dnd";
import { Task, User } from "@/lib/types";
import { KanbanCard } from "./kanban-card";

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  users: User[];
}

export function KanbanColumn({ id, title, tasks, users }: KanbanColumnProps) {
  return (
    <div className="flex flex-col">
      <div className="p-4 mb-4 border-b">
        <h2 className="text-lg font-semibold tracking-tight">{title} <span className="text-sm font-normal text-muted-foreground">{tasks.length}</span></h2>
      </div>
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-grow min-h-[500px] p-2 rounded-lg transition-colors duration-200 ${
              snapshot.isDraggingOver ? "bg-muted" : "bg-card/50"
            }`}
          >
            {tasks.map((task, index) => (
              <KanbanCard key={task.id} task={task} index={index} users={users} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
