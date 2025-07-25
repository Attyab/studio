
"use client";

import { Team, User } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "./ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface TeamCardProps {
    team: Team;
}

export function TeamCard({ team }: TeamCardProps) {
    const displayedMembers = team.members.slice(0, 5);
    const remainingMembersCount = Math.max(0, team.members.length - 5);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle>{team.name}</CardTitle>
                    <CardDescription className="h-10 line-clamp-2">{team.description || "No description provided."}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="flex -space-x-2">
                        <TooltipProvider>
                            {displayedMembers.map(member => (
                                <Tooltip key={member.id}>
                                    <TooltipTrigger asChild>
                                        <Avatar className="border-2 border-card">
                                            <AvatarImage src={member.avatar} data-ai-hint="person portrait"/>
                                            <AvatarFallback>{member.initials}</AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{member.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </TooltipProvider>
                        {remainingMembersCount > 0 && (
                            <Avatar className="border-2 border-card">
                                <AvatarFallback>+{remainingMembersCount}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" disabled>
                        <Pencil className="w-4 h-4" />
                        <span className="sr-only">Edit Team</span>
                    </Button>
                     <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled>
                        <Trash2 className="w-4 h-4" />
                         <span className="sr-only">Delete Team</span>
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
