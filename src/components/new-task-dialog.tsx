"use client";

import { useState, ReactNode, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { CalendarIcon, Sparkles, Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { useTasks } from "@/context/task-store-provider";
import { Task, Priority, Status } from "@/lib/types";
import { suggestTaskPriority } from "@/ai/flows/suggest-task-priority";
import { useToast } from "@/hooks/use-toast";


const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  assigneeId: z.string().min(1, "Assignee is required"),
  status: z.enum(["To Do", "In Progress", "Done"]),
  priority: z.enum(["Low", "Medium", "High"]),
  dueDate: z.date().optional(),
});

type TaskFormValues = z.infer<typeof formSchema>;

interface NewTaskDialogProps {
  children?: ReactNode;
  taskToEdit?: Task;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewTaskDialog({ children, taskToEdit, open: controlledOpen, onOpenChange: setControlledOpen }: NewTaskDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ priority: string, reasoning: string } | null>(null);

  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  const { users, addTask, updateTask } = useTasks();
  const { toast } = useToast();
  
  const defaultValues = taskToEdit ? {
        ...taskToEdit,
        status: taskToEdit.status || "To Do",
        priority: taskToEdit.priority || "Medium",
        dueDate: taskToEdit.dueDate || undefined,
    } : {
      title: "",
      description: "",
      assigneeId: "",
      status: "To Do" as Status,
      priority: "Medium" as Priority,
      dueDate: undefined,
    };

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      setAiSuggestion(null);
    }
  }, [open, taskToEdit, form]);

  useEffect(() => {
    form.reset(defaultValues)
  }, [taskToEdit, form])

  const handleSuggestPriority = async () => {
    setIsAiLoading(true);
    setAiSuggestion(null);
    const description = form.getValues("description");
    const title = form.getValues("title");
    try {
      const result = await suggestTaskPriority({ taskDescription: `${title}: ${description}`, recentActivity: '' });
      setAiSuggestion({ priority: result.prioritySuggestion, reasoning: result.reasoning });
    } catch (error) {
      console.error("AI suggestion failed:", error);
      toast({
        variant: "destructive",
        title: "AI Suggestion Failed",
        description: "Could not get priority suggestion from AI.",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const onSubmit = (values: TaskFormValues) => {
    if (taskToEdit) {
      updateTask({ ...taskToEdit, ...values });
      toast({ title: "Task Updated", description: `"${values.title}" has been updated.` });
    } else {
      addTask(values);
      toast({ title: "Task Created", description: `"${values.title}" has been created.` });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {taskToEdit ? "Update the details of your task." : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} rows={4} placeholder="Add a detailed description..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="assigneeId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Assignee</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an assignee" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col pt-2">
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="To Do">To Do</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Done">Done</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {aiSuggestion && (
              <Alert>
                <Lightbulb className="w-4 h-4" />
                <AlertTitle>AI Suggestion: <span className="text-primary">{aiSuggestion.priority}</span> Priority</AlertTitle>
                <AlertDescription>
                  {aiSuggestion.reasoning}
                   <Button variant="link" className="p-0 h-auto ml-1" onClick={() => {
                       form.setValue('priority', aiSuggestion.priority as Priority, { shouldValidate: true });
                       setAiSuggestion(null);
                   }}>Apply suggestion</Button>
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleSuggestPriority} disabled={isAiLoading}>
                <Sparkles className="w-4 h-4 mr-2" />
                {isAiLoading ? "Analyzing..." : "Suggest Priority"}
              </Button>
              <Button type="submit">{taskToEdit ? "Save Changes" : "Create Task"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
