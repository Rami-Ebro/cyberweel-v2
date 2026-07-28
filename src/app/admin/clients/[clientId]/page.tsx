"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AdminClientEditor } from "@/components/admin-client-editor";
import { ClientDashboard } from "@/components/client-dashboard";

export default function AdminClientWorkspacePage() {
  const params = useParams<{ clientId: string }>();
  const [mode, setMode] = useState<"preview" | "manage">("preview");

  if (mode === "manage") {
    return <AdminClientEditor onPreview={() => setMode("preview")} />;
  }

  return <ClientDashboard adminClientId={params.clientId} onManage={() => setMode("manage")} />;
}
