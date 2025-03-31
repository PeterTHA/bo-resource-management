/*
  Warnings:

  - You are about to drop the column `approved_at` on the `leaves` table. All the data in the column will be lost.
  - You are about to drop the column `approved_by_id` on the `leaves` table. All the data in the column will be lost.
  - You are about to drop the column `cancel_approved_at` on the `leaves` table. All the data in the column will be lost.
  - You are about to drop the column `cancel_approved_by_id` on the `leaves` table. All the data in the column will be lost.
  - You are about to drop the column `cancel_comment` on the `leaves` table. All the data in the column will be lost.
  - You are about to drop the column `cancel_reason` on the `leaves` table. All the data in the column will be lost.
  - You are about to drop the column `cancel_requested_at` on the `leaves` table. All the data in the column will be lost.
  - You are about to drop the column `cancel_status` on the `leaves` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `leaves` table. All the data in the column will be lost.
  - You are about to drop the column `is_cancelled` on the `leaves` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "leaves" DROP CONSTRAINT "leaves_approved_by_id_fkey";

-- DropForeignKey
ALTER TABLE "leaves" DROP CONSTRAINT "leaves_cancel_approved_by_id_fkey";

-- AlterTable
ALTER TABLE "leaves" DROP COLUMN "approved_at",
DROP COLUMN "approved_by_id",
DROP COLUMN "cancel_approved_at",
DROP COLUMN "cancel_approved_by_id",
DROP COLUMN "cancel_comment",
DROP COLUMN "cancel_reason",
DROP COLUMN "cancel_requested_at",
DROP COLUMN "cancel_status",
DROP COLUMN "comment",
DROP COLUMN "is_cancelled",
ALTER COLUMN "status" SET DEFAULT 'waiting_for_approve';

-- CreateTable
CREATE TABLE "leave_approvals" (
    "id" TEXT NOT NULL,
    "leave_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_approvals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "leave_approvals" ADD CONSTRAINT "leave_approvals_leave_id_fkey" FOREIGN KEY ("leave_id") REFERENCES "leaves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_approvals" ADD CONSTRAINT "leave_approvals_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
