-- RemoveOldAttendanceColumns
ALTER TABLE "Invitee" DROP COLUMN IF EXISTS "attendedDay1";
ALTER TABLE "Invitee" DROP COLUMN IF EXISTS "attendedDay2";
