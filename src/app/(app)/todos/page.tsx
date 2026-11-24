import type { Metadata } from "next";
import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TodoForm, TodoList, TodoListSkeleton } from "@/features/todos";
import { getTodos } from "@/features/todos/server";

export const metadata: Metadata = {
  title: "Todos",
  description: "Example feature: Server Actions, Cache Components and optimistic UI.",
};

/**
 * Route files only COMPOSE features: no business logic, no data access.
 * The static parts render into the prerendered shell; the list streams in.
 */
export default function TodosPage() {
  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Todos</h1>
        <p className="text-muted-foreground">
          A reference feature that exercises every layer of the architecture.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Your list</CardTitle>
          <CardDescription>
            Stored in memory for the demo. Swap the repository for a real database.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <TodoForm />
          <Suspense fallback={<TodoListSkeleton />}>
            <TodosSection />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function TodosSection() {
  const todos = await getTodos();
  return <TodoList todos={todos} />;
}
