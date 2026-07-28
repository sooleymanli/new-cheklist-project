-- CreateTable
CREATE TABLE "inspection_assignments" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "assignee_ids" UUID[],
    "recurrence_type" VARCHAR(20) NOT NULL,
    "custom_interval_hours" INTEGER,
    "custom_interval_type" VARCHAR(20),
    "custom_date_range_start" TIMESTAMP(3),
    "custom_date_range_end" TIMESTAMP(3),
    "date_range_interval_hours" INTEGER,
    "exclude_weekends" BOOLEAN NOT NULL DEFAULT false,
    "exclude_holidays" BOOLEAN NOT NULL DEFAULT false,
    "exclude_holiday_dates" TIMESTAMP(3)[],
    "exclude_vacation_dates" TIMESTAMP(3)[],
    "time_window_start" VARCHAR(5) NOT NULL,
    "time_window_end" VARCHAR(5) NOT NULL,
    "requires_qr_start" BOOLEAN NOT NULL DEFAULT false,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,

    CONSTRAINT "inspection_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_approval_steps" (
    "id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "step_order" INTEGER NOT NULL,
    "approver_id" UUID NOT NULL,

    CONSTRAINT "inspection_approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_instances" (
    "id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "assignee_id" UUID NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "due_date" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "current_approval_step" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_approval_history" (
    "id" UUID NOT NULL,
    "instance_id" UUID NOT NULL,
    "step_order" INTEGER NOT NULL,
    "approver_id" UUID NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_approval_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_instance_history" (
    "id" UUID NOT NULL,
    "instance_id" UUID NOT NULL,
    "action" VARCHAR(30) NOT NULL,
    "performed_by" UUID,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_instance_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_instance_history" (
    "id" UUID NOT NULL,
    "instance_id" UUID NOT NULL,
    "action" VARCHAR(30) NOT NULL,
    "performed_by" UUID,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_instance_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inspection_assignments_template_id_idx" ON "inspection_assignments"("template_id");

-- CreateIndex
CREATE INDEX "inspection_assignments_is_active_idx" ON "inspection_assignments"("is_active");

-- CreateIndex
CREATE INDEX "inspection_approval_steps_assignment_id_idx" ON "inspection_approval_steps"("assignment_id");

-- CreateIndex
CREATE INDEX "inspection_instances_assignment_id_idx" ON "inspection_instances"("assignment_id");

-- CreateIndex
CREATE INDEX "inspection_instances_assignee_id_idx" ON "inspection_instances"("assignee_id");

-- CreateIndex
CREATE INDEX "inspection_instances_status_idx" ON "inspection_instances"("status");

-- CreateIndex
CREATE INDEX "inspection_instances_due_date_idx" ON "inspection_instances"("due_date");

-- CreateIndex
CREATE INDEX "inspection_approval_history_instance_id_idx" ON "inspection_approval_history"("instance_id");

-- CreateIndex
CREATE INDEX "inspection_instance_history_instance_id_idx" ON "inspection_instance_history"("instance_id");

-- CreateIndex
CREATE INDEX "checklist_instance_history_instance_id_idx" ON "checklist_instance_history"("instance_id");

-- AddForeignKey
ALTER TABLE "inspection_assignments" ADD CONSTRAINT "inspection_assignments_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_approval_steps" ADD CONSTRAINT "inspection_approval_steps_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "inspection_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_instances" ADD CONSTRAINT "inspection_instances_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "inspection_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_approval_history" ADD CONSTRAINT "inspection_approval_history_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "inspection_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_instance_history" ADD CONSTRAINT "inspection_instance_history_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "inspection_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instance_history" ADD CONSTRAINT "checklist_instance_history_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "checklist_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
