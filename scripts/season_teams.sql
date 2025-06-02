-- Tabla para manejar la relación entre equipos y temporadas
CREATE TABLE season_teams (
    id SERIAL PRIMARY KEY,
    season_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    joined_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricciones de unicidad para evitar duplicados
    CONSTRAINT uk_season_team UNIQUE (season_id, team_id),
    
    -- Referencias a las tablas padre
    CONSTRAINT fk_season_teams_season 
        FOREIGN KEY (season_id) 
        REFERENCES seasons(id) 
        ON DELETE RESTRICT,
    
    CONSTRAINT fk_season_teams_team 
        FOREIGN KEY (team_id) 
        REFERENCES teams(id) 
        ON DELETE RESTRICT
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_season_teams_season_id ON season_teams(season_id);
CREATE INDEX idx_season_teams_team_id ON season_teams(team_id);
CREATE INDEX idx_season_teams_active ON season_teams(active);

-- Trigger para actualizar el updated_at automáticamente
CREATE OR REPLACE FUNCTION update_season_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_season_teams_timestamp
    BEFORE UPDATE ON season_teams
    FOR EACH ROW
    EXECUTE FUNCTION update_season_teams_updated_at();

-- Comentarios de la tabla y columnas
COMMENT ON TABLE season_teams IS 'Tabla que registra la participación de equipos en cada temporada';
COMMENT ON COLUMN season_teams.id IS 'Identificador único de la relación';
COMMENT ON COLUMN season_teams.season_id IS 'ID de la temporada';
COMMENT ON COLUMN season_teams.team_id IS 'ID del equipo';
COMMENT ON COLUMN season_teams.joined_date IS 'Fecha en que el equipo se unió a la temporada';
COMMENT ON COLUMN season_teams.active IS 'Indica si el equipo está activo en la temporada';
COMMENT ON COLUMN season_teams.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN season_teams.updated_at IS 'Fecha de última actualización del registro';

-- Función para agregar un equipo a una temporada
CREATE OR REPLACE FUNCTION add_team_to_season(
    p_season_id INTEGER,
    p_team_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
    v_id INTEGER;
BEGIN
    -- Verificar si la temporada existe y está activa
    IF NOT EXISTS (SELECT 1 FROM seasons WHERE id = p_season_id) THEN
        RAISE EXCEPTION 'La temporada especificada no existe';
    END IF;

    -- Verificar si el equipo existe y está activo
    IF NOT EXISTS (SELECT 1 FROM teams WHERE id = p_team_id AND active = TRUE) THEN
        RAISE EXCEPTION 'El equipo especificado no existe o no está activo';
    END IF;

    -- Insertar el registro
    INSERT INTO season_teams (season_id, team_id)
    VALUES (p_season_id, p_team_id)
    RETURNING id INTO v_id;

    RETURN v_id;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'El equipo ya está registrado en esta temporada';
END;
$$ LANGUAGE plpgsql;

-- Función para remover un equipo de una temporada
CREATE OR REPLACE FUNCTION remove_team_from_season(
    p_season_id INTEGER,
    p_team_id INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar si existe la relación y está activa
    IF NOT EXISTS (
        SELECT 1 
        FROM season_teams 
        WHERE season_id = p_season_id 
        AND team_id = p_team_id 
        AND active = TRUE
    ) THEN
        RAISE EXCEPTION 'El equipo no está activo en esta temporada';
    END IF;

    -- Desactivar el equipo en la temporada
    UPDATE season_teams
    SET active = FALSE
    WHERE season_id = p_season_id
    AND team_id = p_team_id;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Vista para obtener equipos activos por temporada
CREATE OR REPLACE VIEW v_active_season_teams AS
SELECT 
    st.id,
    st.season_id,
    s.name as season_name,
    st.team_id,
    t.name as team_name,
    t.assistant as team_assistant,
    t.emblem as team_emblem,
    st.joined_date,
    st.created_at,
    st.updated_at
FROM season_teams st
JOIN seasons s ON s.id = st.season_id
JOIN teams t ON t.id = st.team_id
WHERE st.active = TRUE
AND t.active = TRUE;

-- Índice para la vista
CREATE INDEX idx_v_active_season_teams_season_id ON v_active_season_teams(season_id); 