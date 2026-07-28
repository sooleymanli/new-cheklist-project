/*
  Warnings:

  - Added the required column `name` to the `inspection_assignments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "inspection_assignments" ADD COLUMN "description" TEXT;
ALTER TABLE "inspection_assignments" ADD COLUMN "name" VARCHAR(255) NOT NULL DEFAULT '';
-- Remove default after backfill
UPDATE "inspection_assignments" SET "name" = 'Untitled' WHERE "name" = '';
ALTER TABLE "inspection_assignments" ALTER COLUMN "name" DROP DEFAULT;
