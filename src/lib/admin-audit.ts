import type { Prisma } from "@prisma/client";

type AuditClient = Pick<Prisma.TransactionClient, "adminAuditLog">;

export type AuditCategory = "POSITIVE" | "SENSITIVE" | "NORMAL";

type AuditInput = {
  actorId?: string | null;
  action: string;
  category: AuditCategory;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAdminAudit(client: AuditClient, input: AuditInput) {
  return client.adminAuditLog.create({
    data: {
      actorId: input.actorId || null,
      action: input.action,
      category: input.category,
      entityType: input.entityType,
      entityId: input.entityId || null,
      entityLabel: input.entityLabel || null,
      before: input.before,
      after: input.after,
      metadata: input.metadata,
    },
  });
}
