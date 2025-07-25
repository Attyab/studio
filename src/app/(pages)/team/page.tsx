
"use client";

import { useTasks } from "@/context/task-store-provider";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { NewTeamDialog } from "@/components/new-team-dialog";
import { TeamCard } from "@/components/team-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamPage() {
    const { teams, loading } = useTasks();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
                    <p className="text-muted-foreground">
                        Organize your users into teams for projects or departments.
                    </p>
                </div>
                <NewTeamDialog>
                    <Button className="w-full md:w-auto">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Create Team
                    </Button>
                </NewTeamDialog>
            </div>

            {loading ? (
                 <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            ) : teams.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {teams.map(team => (
                        <TeamCard key={team.id} team={team} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg h-80 bg-card/50">
                    <h3 className="text-xl font-semibold">No teams found</h3>
                    <p className="text-muted-foreground">Get started by creating a new team.</p>
                    <div className="mt-4">
                        <NewTeamDialog>
                            <Button>Create Team</Button>
                        </NewTeamDialog>
                    </div>
                </div>
            )}
        </div>
    );
}
