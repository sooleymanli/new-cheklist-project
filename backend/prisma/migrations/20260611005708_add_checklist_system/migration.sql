-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "original_name" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "bucket" VARCHAR(100) NOT NULL,
    "path" VARCHAR(1000) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "uploaded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_template_fields" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "order_no" INTEGER NOT NULL,
    "field_key" VARCHAR(100) NOT NULL,
    "field_label" VARCHAR(255) NOT NULL,
    "field_type" VARCHAR(50) NOT NULL,
    "field_config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_template_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_template_locations" (
    "template_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,

    CONSTRAINT "checklist_template_locations_pkey" PRIMARY KEY ("template_id","location_id")
);

-- CreateTable
CREATE TABLE "checklist_schedules" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "frequency" VARCHAR(20) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "due_time" VARCHAR(5),
    "days_of_week" INTEGER[],
    "day_of_month" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "checklist_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_assignments" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "user_id" UUID,
    "role_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "checklist_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_instances" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "schedule_id" UUID,
    "location_id" UUID,
    "assigned_user_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "due_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_responses" (
    "id" UUID NOT NULL,
    "checklist_instance_id" UUID NOT NULL,
    "field_id" UUID NOT NULL,
    "value" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "files_entity_type_entity_id_idx" ON "files"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "checklist_templates_status_idx" ON "checklist_templates"("status");

-- CreateIndex
CREATE INDEX "checklist_templates_name_idx" ON "checklist_templates"("name");

-- CreateIndex
CREATE INDEX "checklist_template_fields_template_id_idx" ON "checklist_template_fields"("template_id");

-- CreateIndex
CREATE INDEX "checklist_schedules_template_id_idx" ON "checklist_schedules"("template_id");

-- CreateIndex
CREATE INDEX "checklist_schedules_is_active_idx" ON "checklist_schedules"("is_active");

-- CreateIndex
CREATE INDEX "checklist_assignments_template_id_idx" ON "checklist_assignments"("template_id");

-- CreateIndex
CREATE INDEX "checklist_assignments_user_id_idx" ON "checklist_assignments"("user_id");

-- CreateIndex
CREATE INDEX "checklist_assignments_role_id_idx" ON "checklist_assignments"("role_id");

-- CreateIndex
CREATE INDEX "checklist_instances_template_id_idx" ON "checklist_instances"("template_id");

-- CreateIndex
CREATE INDEX "checklist_instances_assigned_user_id_idx" ON "checklist_instances"("assigned_user_id");

-- CreateIndex
CREATE INDEX "checklist_instances_location_id_idx" ON "checklist_instances"("location_id");

-- CreateIndex
CREATE INDEX "checklist_instances_status_idx" ON "checklist_instances"("status");

-- CreateIndex
CREATE INDEX "checklist_instances_due_at_idx" ON "checklist_instances"("due_at");

-- CreateIndex
CREATE INDEX "checklist_responses_checklist_instance_id_idx" ON "checklist_responses"("checklist_instance_id");

-- CreateIndex
CREATE INDEX "checklist_responses_field_id_idx" ON "checklist_responses"("field_id");

-- AddForeignKey
ALTER TABLE "checklist_template_fields" ADD CONSTRAINT "checklist_template_fields_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_template_locations" ADD CONSTRAINT "checklist_template_locations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_template_locations" ADD CONSTRAINT "checklist_template_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_schedules" ADD CONSTRAINT "checklist_schedules_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_assignments" ADD CONSTRAINT "checklist_assignments_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "checklist_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_responses" ADD CONSTRAINT "checklist_responses_checklist_instance_id_fkey" FOREIGN KEY ("checklist_instance_id") REFERENCES "checklist_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
