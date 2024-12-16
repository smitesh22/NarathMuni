ALTER TABLE "User" ADD COLUMN "hashedPassword" TEXT NOT NULL DEFAULT 'default_password';

-- After adding the default value, you can optionally remove it:
ALTER TABLE "User" ALTER COLUMN "hashedPassword" DROP DEFAULT;

