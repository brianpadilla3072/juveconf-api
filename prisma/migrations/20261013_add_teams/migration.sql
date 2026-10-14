-- CreateTable
CREATE TABLE "TeamType" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minPlayers" INTEGER NOT NULL DEFAULT 1,
    "maxPlayers" INTEGER NOT NULL DEFAULT 10,
    "maxTeams" INTEGER,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TeamType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "teamTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leaderName" TEXT NOT NULL,
    "leaderPhone" TEXT NOT NULL,
    "leaderEmail" TEXT,
    "editToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPlayer" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "inviteeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamType_eventId_isActive_idx" ON "TeamType"("eventId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TeamType_eventId_name_key" ON "TeamType"("eventId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_editToken_key" ON "Team"("editToken");

-- CreateIndex
CREATE INDEX "Team_teamTypeId_idx" ON "Team"("teamTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_teamTypeId_name_key" ON "Team"("teamTypeId", "name");

-- CreateIndex
CREATE INDEX "TeamPlayer_teamId_idx" ON "TeamPlayer"("teamId");

-- CreateIndex
CREATE INDEX "TeamPlayer_inviteeId_idx" ON "TeamPlayer"("inviteeId");

-- AddForeignKey
ALTER TABLE "TeamType" ADD CONSTRAINT "TeamType_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_teamTypeId_fkey" FOREIGN KEY ("teamTypeId") REFERENCES "TeamType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer" ADD CONSTRAINT "TeamPlayer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer" ADD CONSTRAINT "TeamPlayer_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "Invitee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

