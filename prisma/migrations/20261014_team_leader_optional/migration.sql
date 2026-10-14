-- Los datos del lider del equipo pasan a ser opcionales (el formulario publico ya no los pide).
-- Solo quita la restriccion NOT NULL: no borra ni modifica datos existentes.
ALTER TABLE "Team" ALTER COLUMN "leaderName" DROP NOT NULL;
ALTER TABLE "Team" ALTER COLUMN "leaderPhone" DROP NOT NULL;
