"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const MARKER = "cyberweel-central-project-creation";

export function ClientProjectCreationRedirect() {
  const router = useRouter();

  useEffect(() => {
    const apply = () => {
      const forms = Array.from(document.querySelectorAll<HTMLFormElement>("form")).filter((form) => {
        const action = form.querySelector<HTMLInputElement>('input[name="action"][value="project"]');
        const projectId = form.querySelector<HTMLInputElement>('input[name="projectId"]');
        return Boolean(action && !projectId);
      });

      for (const form of forms) {
        const panel = form.closest<HTMLElement>("section");
        if (!panel || panel.dataset.centralProjectCreation === "true") continue;
        panel.dataset.centralProjectCreation = "true";
        form.classList.add("hidden");

        if (panel.querySelector(`.${MARKER}`)) continue;
        const note = document.createElement("div");
        note.className = `${MARKER} border-t border-[#D8D2C4] p-6`;
        note.innerHTML = `
          <div class="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm font-bold text-sky-900">
            إنشاء المشاريع أصبح مركزيًا من قسم «المشاريع» لضمان إنشاء المراحل والفواتير ومكافآت السفير وإسنادات التنفيذ من مصدر واحد.
          </div>
          <button type="button" data-open-central-projects class="mt-3 rounded-xl bg-[#111827] px-5 py-3 font-black text-white">فتح قسم المشاريع</button>
        `;
        panel.appendChild(note);
        note.querySelector<HTMLButtonElement>("[data-open-central-projects]")?.addEventListener("click", () => {
          router.push("/admin/partners?section=projects");
        });
      }
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [router]);

  return null;
}
