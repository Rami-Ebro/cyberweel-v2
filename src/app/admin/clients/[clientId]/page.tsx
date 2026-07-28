"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AdminClientEditor } from "@/components/admin-client-editor";
import { ClientDashboard } from "@/components/client-dashboard";

type EditableSection = "projects" | "files" | "invoices" | "account";

export default function AdminClientWorkspacePage() {
  const params = useParams<{ clientId: string }>();
  const [mode, setMode] = useState<"preview" | "manage">("preview");
  const [manageSection, setManageSection] = useState<EditableSection>("projects");
  const [previewNotice, setPreviewNotice] = useState("");

  function openEditor(section: EditableSection) {
    setManageSection(section);
    setPreviewNotice("");
    setMode("manage");
  }

  if (mode === "manage") {
    return (
      <AdminClientEditor
        initialSection={manageSection}
        onPreview={(notice = "") => {
          setPreviewNotice(notice);
          setMode("preview");
        }}
      />
    );
  }

  return (
    <ClientDashboard
      adminClientId={params.clientId}
      initialNotice={previewNotice}
      onManage={openEditor}
    />
  );
}
