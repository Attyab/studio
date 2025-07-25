
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Task, User, Team, Status } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import type { PostgrestError, AuthError, User as SupabaseUser } from '@supabase/supabase-js';

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | AuthError | null>(null);
  const supabase = getSupabaseBrowserClient();

  const fetchUsers = useCallback(async () => {
    const { data: usersData, error: usersError } = await supabase.from('users').select('*');
    if (usersError) {
      console.error('Error fetching users:', usersError);
      setError(usersError);
      setUsers([]);
    } else {
      setUsers(usersData.map(u => ({...u, initials: u.name.split(' ').map((n:string) => n[0]).join('') })));
    }
  }, [supabase]);

  const fetchTasks = useCallback(async () => {
    const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*');
     if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      setError(tasksError);
    } else {
      const formattedTasks = tasksData.map(t => ({...t, id: t.id, dueDate: t.due_date ? new Date(t.due_date) : undefined, assigneeId: t.assignee_id, due_date: t.due_date}));
      setTasks(formattedTasks);
    }
  }, [supabase]);
  
  const fetchTeams = useCallback(async () => {
    const { data: teamsData, error: teamsError } = await supabase.from('teams').select(`*, members:team_members(users(*))`);
    if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        setError(teamsError as any);
        setTeams([]);
    } else {
        const formattedTeams = teamsData.map(team => ({
            ...team,
            members: team.members.map((m: any) => ({
                ...m.users,
                initials: m.users.name.split(' ').map((n: string) => n[0]).join('')
            }))
        }));
        setTeams(formattedTeams);
    }
  }, [supabase]);


  const handleUserSession = useCallback(async (sessionUser: SupabaseUser | null) => {
    if (sessionUser) {
        let { data: profile, error: profileError } = await supabase.from('users').select('*').eq('id', sessionUser.id).single();
        
        if (profileError && profileError.code === 'PGRST116') { // "PGRST116" is the code for "0 rows returned"
            console.warn("User profile not found in public.users, creating it now.");
            
            const { data: newProfile, error: insertError } = await supabase
              .from('users')
              .insert({
                id: sessionUser.id,
                email: sessionUser.email!,
                name: sessionUser.user_metadata?.full_name || sessionUser.email!.split('@')[0],
                avatar: sessionUser.user_metadata?.avatar_url || `https://placehold.co/128x128.png`
              })
              .select()
              .single();

            if (insertError) {
              console.error("Failed to create missing user profile.", insertError);
              setCurrentUser(null);
              setLoading(false);
              return;
            } 
            profile = newProfile;
        } else if (profileError) {
            console.error("Could not fetch user profile from DB.", profileError);
            setCurrentUser(null);
            setLoading(false);
            return;
        }
        
        const user: User = {...profile, initials: profile.name.split(' ').map((n: string) => n[0]).join('')};
        setCurrentUser(user);
        await Promise.all([fetchTasks(), fetchUsers(), fetchTeams()]);

    } else {
        setCurrentUser(null);
        setTasks([]);
        setUsers([]);
        setTeams([]);
    }
    setLoading(false);
  }, [supabase, fetchTasks, fetchUsers, fetchTeams]);


  useEffect(() => {
    setLoading(true);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        await handleUserSession(session?.user ?? null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        handleUserSession(session?.user ?? null);
    });

    return () => {
        subscription.unsubscribe();
    };
  }, [supabase, handleUserSession]);

  const getTasksByUserId = useCallback(
    (userId: string) => {
      return tasks.filter((task) => task.assigneeId === userId);
    },
    [tasks]
  );

  const getTaskById = useCallback(
    (taskId: string) => {
      return tasks.find((task) => task.id === taskId);
    },
    [tasks]
  );

  const addTask = async (task: Omit<Task, 'id'| 'assignee_id' | 'due_date'>) => {
    if (!currentUser) throw new Error("User must be logged in to add a task");
    
    // Create a new object for insertion, ensuring we don't send extra fields
    const { title, description, status, priority, assigneeId, dueDate } = task;
    const taskToInsert = {
      title,
      description,
      status,
      priority,
      assignee_id: assigneeId,
      due_date: dueDate ? dueDate.toISOString() : null,
    };

    const { data, error } = await supabase.from('tasks').insert([taskToInsert]).select().single();

    if (error) {
        console.error('Error adding task:', error);
        setError(error);
        return;
    }

    if (data) {
        const newTask: Task = {
          ...data, 
          id: data.id,
          dueDate: data.due_date ? new Date(data.due_date) : undefined, 
          assigneeId: data.assignee_id, 
          due_date: data.due_date
        };
        setTasks(prevTasks => [...prevTasks, newTask]);
    }
  };

  const updateTask = async (updatedTask: Task) => {
     // Create a new object for update, ensuring we don't send extra fields
    const { id, title, description, status, priority, assigneeId, dueDate } = updatedTask;
    const taskToUpdate = {
      id,
      title,
      description,
      status,
      priority,
      assignee_id: assigneeId,
      due_date: dueDate ? dueDate.toISOString() : null,
    };

    const { data, error } = await supabase
        .from('tasks')
        .update(taskToUpdate)
        .eq('id', updatedTask.id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating task:', error);
        setError(error);
        return;
    }
    
    if (data) {
        const newTask: Task = {
            ...data, 
            id: data.id,
            dueDate: data.due_date ? new Date(data.due_date) : undefined, 
            assigneeId: data.assignee_id,
            due_date: data.due_date
        };
        setTasks(prevTasks => prevTasks.map(task => task.id === newTask.id ? newTask : task));
    }
  };

  const updateTaskStatusInStore = (taskId: string, newStatus: Status) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
        console.error('Error deleting task:', error);
        setError(error);
    } else {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    }
  };
  
  const addTeam = async (name: string, description: string, memberIds: string[]) => {
      if (!currentUser) throw new Error("User must be logged in to create a team");

      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({ name, description, created_by: currentUser.id })
        .select()
        .single();

      if (teamError) {
          console.error("Error creating team:", teamError);
          setError(teamError);
          throw teamError;
      }
      
      const teamId = teamData.id;

      const membersToInsert = memberIds.map(userId => ({
          team_id: teamId,
          user_id: userId
      }));

      const { error: memberError } = await supabase
        .from('team_members')
        .insert(membersToInsert);
      
      if (memberError) {
          console.error("Error adding team members:", memberError);
          // Optional: handle rollback of team creation
          setError(memberError);
          throw memberError;
      }

      await fetchTeams(); // Refresh the teams list
  };


  const changeCurrentUser = useCallback(async (userId: string) => {
      const userToSwitchTo = users.find(u => u.id === userId);
      if (userToSwitchTo) {
        setCurrentUser(userToSwitchTo);
      } else {
           const { data: realUser, error } = await supabase.from('users').select('*').eq('id', userId).single();
            if (realUser) {
                setCurrentUser({...realUser, initials: realUser.name.split(' ').map((n:string) => n[0]).join('')});
            } else {
                console.error("Could not switch to user in DB.", error);
            }
      }
  }, [supabase, users]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: password || '' });
    if (error) {
      console.error('Login failed:', error.message);
      setError(error);
      setLoading(false);
      return false;
    }
    // Session change will be handled by onAuthStateChange
    return true;
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    // Session change will be handled by onAuthStateChange
  };

  const signup = async (name: string, email: string, password?: string) => {
    if (!password) {
        throw new Error("Password is required for signup.");
    }
    setLoading(true);

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        },
      },
    });

     if (error) {
      console.error('Signup failed:', error);
      setLoading(false);
      throw error;
    }
    
    if (!authData.user) {
      console.error('Signup failed: No user returned');
      setLoading(false);
      throw new Error('Signup failed: No user returned');
    }

    // Manually insert into public.users table
    const { error: insertError } = await supabase.from('users').insert({
      id: authData.user.id,
      name,
      email,
      avatar: `https://placehold.co/128x128.png`
    });

    if (insertError) {
      console.error('Failed to create user profile after signup:', insertError);
      // Even if this fails, auth user exists, so we proceed. 
      // The login logic will attempt to fix the profile.
    }
    
    // onAuthStateChange will handle setting the current user and fetching data
    setLoading(false);
  };

  return {
    tasks,
    users,
    teams,
    currentUser,
    loading,
    error,
    getTasksByUserId,
    getTaskById,
    addTask,
    updateTask,
    updateTaskStatusInStore,
    deleteTask,
    addTeam,
    changeCurrentUser,
    login,
    logout,
    signup,
  };
}
