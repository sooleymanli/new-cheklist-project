-- AlterTable
ALTER TABLE "checklist_responses" ADD COLUMN     "location_id" UUID;

-- AlterTable
ALTER TABLE "checklist_template_fields" ADD COLUMN     "category" VARCHAR(100);

-- CreateIndex
CREATE INDEX "checklist_responses_location_id_idx" ON "checklist_responses"("location_id");

-- AddForeignKey
ALTER TABLE "checklist_responses" ADD CONSTRAINT "checklist_responses_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
