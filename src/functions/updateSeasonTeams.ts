import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

interface UpdateSeasonTeamsRequest {
    teamIds: number[];
}

export async function handler(event: APIGatewayEvent) {
    try {
        if (!event.pathParameters?.seasonId) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El ID de la temporada es requerido' })
            };
        }

        if (!event.body) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El cuerpo de la petición no puede estar vacío' })
            };
        }

        const seasonId = Number(event.pathParameters.seasonId);
        if (isNaN(seasonId)) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El ID de la temporada debe ser un número válido' })
            };
        }

        const { teamIds }: UpdateSeasonTeamsRequest = JSON.parse(event.body);
        if (!teamIds || !Array.isArray(teamIds)) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'Se debe proporcionar un array de IDs de equipos' })
            };
        }

        // Validar que el array no esté vacío
        if (teamIds.length === 0) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'Debe proporcionar al menos un ID de equipo' })
            };
        }

        const dataSource: DataSource = await getDbConnection();

        // Verificar que la temporada existe
        const [season] = await dataSource.query(
            'SELECT id FROM seasons WHERE id = ?',
            [seasonId]
        );

        if (!season) {
            return {
                headers: headersConfig,
                statusCode: 404,
                body: JSON.stringify({ 
                    message: 'Temporada no encontrada',
                    code: 'SEASON_NOT_FOUND'
                })
            };
        }

        // Verificar que todos los equipos nuevos existen y están activos
        const teams = await dataSource.query(
            'SELECT id FROM teams WHERE id IN (?) AND active = TRUE',
            [teamIds]
        );

        const validTeamIds = teams.map((t: { id: number }) => t.id);
        const invalidTeamIds = teamIds.filter((id: number) => !validTeamIds.includes(id));

        if (invalidTeamIds.length > 0) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'Algunos equipos no existen o no están activos',
                    invalidTeamIds
                })
            };
        }

        // Iniciar transacción
        await dataSource.query('START TRANSACTION');

        try {
            // Obtener todos los equipos de la temporada (activos e inactivos)
            const existingTeams = await dataSource.query(
                'SELECT team_id, active FROM season_teams WHERE season_id = ?',
                [seasonId]
            );

            const currentTeamIds = existingTeams
                .filter((t: { active: boolean }) => t.active)
                .map((t: { team_id: number }) => t.team_id);

            const existingTeamIds = existingTeams.map((t: { team_id: number }) => t.team_id);

            // Identificar equipos a agregar, reactivar y eliminar
            const teamsToAdd = teamIds.filter((id: number) => !existingTeamIds.includes(id));
            const teamsToReactivate = teamIds.filter((id: number) => 
                existingTeamIds.includes(id) && !currentTeamIds.includes(id)
            );
            const teamsToRemove = currentTeamIds.filter((id: number) => !teamIds.includes(id));

            // Desactivar equipos que ya no estarán en la temporada
            if (teamsToRemove.length > 0) {
                await dataSource.query(
                    'UPDATE season_teams SET active = FALSE WHERE season_id = ? AND team_id IN (?)',
                    [seasonId, teamsToRemove]
                );
            }

            // Reactivar equipos que estaban inactivos
            if (teamsToReactivate.length > 0) {
                await dataSource.query(
                    'UPDATE season_teams SET active = TRUE WHERE season_id = ? AND team_id IN (?)',
                    [seasonId, teamsToReactivate]
                );
            }

            // Agregar nuevos equipos
            if (teamsToAdd.length > 0) {
                const values = teamsToAdd.map(teamId => [seasonId, teamId]);
                await dataSource.query(
                    'INSERT INTO season_teams (season_id, team_id) VALUES ?',
                    [values]
                );
            }

            await dataSource.query('COMMIT');

            return {
                headers: headersConfig,
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Equipos actualizados correctamente'
                })
            };

        } catch (error) {
            await dataSource.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error al actualizar equipos de la temporada:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al actualizar equipos de la temporada.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
} 