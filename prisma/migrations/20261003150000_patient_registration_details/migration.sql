ALTER TABLE "patient"
ADD COLUMN IF NOT EXISTS "emergencyContactName" TEXT,
ADD COLUMN IF NOT EXISTS "emergencyContactNumber" TEXT,
ADD COLUMN IF NOT EXISTS "emergencyContactRelationship" TEXT;
