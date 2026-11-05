ALTER TABLE "CandidateProfile"
ADD COLUMN "resumeStorageKey" TEXT,
ADD COLUMN "resumeFileName" TEXT,
ADD COLUMN "resumeMimeType" TEXT,
ADD COLUMN "resumeFileSize" INTEGER;

CREATE UNIQUE INDEX "CandidateProfile_resumeStorageKey_key"
ON "CandidateProfile"("resumeStorageKey");
