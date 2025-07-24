"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useTasks } from "@/context/task-store-provider";
import { Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import TaskTable from "@/components/task-table";
import { format } from "date-fns";

export default function CalendarPage() {
  const { tasks } = useTasks();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const tasksWithDueDate = tasks.filter(task => task.dueDate);
  const taskDates = tasksWithDueDate.map(task => task.dueDate);

  const selectedDateTasks = date
    ? tasks.filter(
        (task) =>
          task.dueDate &&
          format(task.dueDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      )
    : [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
            <CardContent className="p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="flex justify-center p-3"
                    modifiers={{
                        hasTask: taskDates,
                    }}
                    modifiersStyles={{
                        hasTask: { 
                            border: '2px solid hsl(var(--primary))',
                            borderRadius: '9999px',
                        },
                    }}
                />
            </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
            <CardHeader>
                <CardTitle>
                    Tasks for {date ? format(date, "PPP") : "selected date"}
                </CardTitle>
                <CardDescription>
                    {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''} due on this day.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <TaskTable tasks={selectedDateTasks} showAssignee={true} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
