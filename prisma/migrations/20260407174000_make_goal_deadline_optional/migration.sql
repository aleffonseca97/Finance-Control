-- Allow goals without a deadline.
ALTER TABLE "Goal"
ALTER COLUMN "deadline" DROP NOT NULL;
