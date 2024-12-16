-- CreateTable
CREATE TABLE "ContentObject" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "extensions" JSONB NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL,
    "updatedOn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentObject_pkey" PRIMARY KEY ("id")
);
