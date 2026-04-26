"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCard } from "@/components/custom/TaskCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Task } from "@/types";
import api from "@/lib/api";

export default function TasksPage() {
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [verifyingTasks, setVerifyingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [myRes, verRes] = await Promise.all([
          api.get("/tasks/my"),
          api.get("/tasks/verifying"),
        ]);
        setMyTasks(myRes.data);
        setVerifyingTasks(verRes.data);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Link href="/tasks/new">
          <Button>New Task</Button>
        </Link>
      </div>

      <Tabs defaultValue="my">
        <TabsList>
          <TabsTrigger value="my">My Tasks ({myTasks.length})</TabsTrigger>
          <TabsTrigger value="verifying">Verifying ({verifyingTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="space-y-3 mt-4">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : myTasks.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No tasks yet.</p>
          ) : (
            myTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="verifying" className="space-y-3 mt-4">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : verifyingTasks.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No tasks to verify.</p>
          ) : (
            verifyingTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
