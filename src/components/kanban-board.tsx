
"use client";

import { useEffect, useState } from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { Task, User, Status } from "@/lib/types";
import { KanbanColumn } from "./kanban-column";
import { useTasks } from "@/context/task-store-provider";
import { useToast } from "@/hooks/use-toast";

interface KanbanBoardProps {
  tasks: Task[];
  users: User[];
}

const statusMap: Record<string, Status> = {
  "column-1": "To Do",
  "column-2": "In Progress",
  "column-3": "Done",
};
const reverseStatusMap: Record<Status, string> = {
  "To Do": "column-1",
  "In Progress": "column-2",
  Done: "column-3",
};

export function KanbanBoard({ tasks, users }: KanbanBoardProps) {
  const { updateTask, updateTaskStatusInStore } = useTasks();
  const { toast } = useToast();
  
  const [columns, setColumns] = useState<{ [key: string]: Task[] }>({
    "column-1": [],
    "column-2": [],
    "column-3": [],
  });

  useEffect(() => {
    const newColumns: { [key: string]: Task[] } = {
      "column-1": [],
      "column-2": [],
      "column-3": [],
    };
    tasks.forEach((task) => {
      const columnId = reverseStatusMap[task.status];
      if (columnId) {
        newColumns[columnId].push(task);
      }
    });
    setColumns(newColumns);
  }, [tasks]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const startColumnId = source.droppableId;
    const endColumnId = destination.droppableId;
    const newStatus = statusMap[endColumnId];
    
    const taskToMove = tasks.find(t => t.id === draggableId);
    if (!taskToMove) return;

    // Optimistically update the UI
    updateTaskStatusInStore(draggableId, newStatus);
    
    const startColumn = Array.from(columns[startColumnId]);
    const endColumn = Array.from(columns[endColumnId]);
    const [removed] = startColumn.splice(source.index, 1);
    
    if (startColumnId === endColumnId) {
        startColumn.splice(destination.index, 0, removed);
        setColumns({ ...columns, [startColumnId]: startColumn });
    } else {
        endColumn.splice(destination.index, 0, removed);
        setColumns({
            ...columns,
            [startColumnId]: startColumn,
            [endColumnId]: endColumn
        });
    }

    try {
      // Update the database
      await updateTask({ ...taskToMove, status: newStatus });
       toast({
        title: "Task Updated",
        description: `"${taskToMove.title}" moved to ${newStatus}.`,
      });
    } catch (error) {
      console.error("Failed to update task", error);
       toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update task status. Reverting changes.",
      });
      // Revert the optimistic update on failure
      updateTaskStatusInStore(draggableId, taskToMove.status);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-3">
        <KanbanColumn
          id="column-1"
          title="To Do"
          tasks={columns["column-1"] || []}
          users={users}
        />
        <KanbanColumn
          id="column-2"
          title="In Progress"
          tasks={columns["column-2"] || []}
          users={users}
        />
        <KanbanColumn
          id="column-3"
          title="Done"
          tasks={columns["column-3"] || []}
          users={users}
        />
      </div>
    </DragDropContext>
  );
}
