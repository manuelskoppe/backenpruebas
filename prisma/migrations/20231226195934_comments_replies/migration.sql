-- AlterTable
ALTER TABLE "comment_delete" ADD COLUMN     "parent_id" TEXT;

-- AddForeignKey
ALTER TABLE "comment_delete" ADD CONSTRAINT "comment_delete_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comment_delete"("id") ON DELETE SET NULL ON UPDATE CASCADE;
