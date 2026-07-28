-- AlterTable
ALTER TABLE "inspection_assignments" ADD COLUMN     "last_run_at" TIMESTAMP(3),
ADD COLUMN     "next_run_at" TIMESTAMP(3),
ADD COLUMN     "scheduled_date" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "inspection_assignments_next_run_at_idx" ON "inspection_assignments"("next_run_at");
