import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

interface AddTeamsToSeasonRequest {
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

        const { teamIds }: AddTeamsToSeasonRequest = JSON.parse(event.body);
        if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'Se debe proporcionar un array de IDs de equipos' })
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

        // Iniciar transacción
        await dataSource.query('START TRANSACTION');

        try {
            for (const teamId of teamIds) {
                // Verificar que el equipo existe y está activo
                const [team] = await dataSource.query(
                    'SELECT id FROM teams WHERE id = ? AND active = TRUE',
                    [teamId]
                );

                if (!team) {
                    await dataSource.query('ROLLBACK');
                    return {
                        headers: headersConfig,
                        statusCode: 400,
                        body: JSON.stringify({ 
                            message: `El equipo ${teamId} no existe o no está activo`,
                            code: 'TEAM_NOT_FOUND'
                        })
                    };
                }

                // Verificar si el equipo ya está en la temporada
                const [existingTeam] = await dataSource.query(
                    'SELECT id FROM season_teams WHERE season_id = ? AND team_id = ? AND active = TRUE',
                    [seasonId, teamId]
                );

                if (existingTeam) {
                    await dataSource.query('ROLLBACK');
                    return {
                        headers: headersConfig,
                        statusCode: 400,
                        body: JSON.stringify({ 
                            message: `El equipo ${teamId} ya está registrado en esta temporada`,
                            code: 'TEAM_ALREADY_IN_SEASON'
                        })
                    };
                }

                // Agregar el equipo a la temporada
                await dataSource.query(
                    'INSERT INTO season_teams (season_id, team_id) VALUES (?, ?)',
                    [seasonId, teamId]
                );
            }

            await dataSource.query('COMMIT');

            return {
                headers: headersConfig,
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Equipos agregados correctamente a la temporada',
                    seasonId
                })
            };

        } catch (error) {
            await dataSource.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error al agregar equipos a la temporada:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al agregar equipos a la temporada.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
} 