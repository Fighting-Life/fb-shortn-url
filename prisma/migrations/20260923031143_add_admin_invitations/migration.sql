-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "invited_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations"("token_hash");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "invitations"("email");

-- CreateIndex
CREATE INDEX "invitation_expiry_idx" ON "invitations"("expires_at");

-- CreateIndex
CREATE INDEX "invitation_sender_idx" ON "invitations"("invited_by_id");

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
