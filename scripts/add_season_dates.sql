-- Agregar campo para la fecha de fin de partidos
ALTER TABLE seasons
ADD COLUMN matchesEndDate TIMESTAMP NULL COMMENT 'Stored in UTC';

-- Agregar campo para la fecha de inicio de negociaciones
ALTER TABLE seasons
ADD COLUMN negotiationsStartDate TIMESTAMP NULL COMMENT 'Stored in UTC';

-- Agregar campo para la fecha de fin de negociaciones
ALTER TABLE seasons
ADD COLUMN negotiationsEndDate TIMESTAMP NULL COMMENT 'Stored in UTC';

-- Agregar campo para la fecha de inicio de subastas
ALTER TABLE seasons
ADD COLUMN auctionsStartDate TIMESTAMP NULL COMMENT 'Stored in UTC';

-- Agregar campo para la fecha de fin de subastas
ALTER TABLE seasons
ADD COLUMN auctionsEndDate TIMESTAMP NULL COMMENT 'Stored in UTC';

-- Script de rollback en caso necesario
/*
ALTER TABLE seasons
DROP COLUMN matchesEndDate,
DROP COLUMN negotiationsStartDate,
DROP COLUMN negotiationsEndDate,
DROP COLUMN auctionsStartDate,
DROP COLUMN auctionsEndDate;
*/ 