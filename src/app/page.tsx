import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { WorkflowBuilder } from "@/components/canvas/WorkflowBuilder";

export default async function HomePage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <WorkflowBuilder />;
}