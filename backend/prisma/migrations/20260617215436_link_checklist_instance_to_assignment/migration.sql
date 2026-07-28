-- AlterTable
ALTER TABLE "checklist_instances" ADD COLUMN     "assignment_id" UUID,
ADD COLUMN     "current_approval_step" INTEGER;

-- CreateIndex
CREATE INDEX "checklist_instances_assignment_id_idx" ON "checklist_instances"("assignment_id");

-- AddForeignKey
ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "inspection_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
