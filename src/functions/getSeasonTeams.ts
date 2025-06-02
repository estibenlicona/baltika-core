import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

interface TeamResponse {
    id: number;
    name: string;
    assistant: string;
    emblem: string;
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

        const seasonId = Number(event.pathParameters.seasonId);
        if (isNaN(seasonId)) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El ID de la temporada debe ser un número válido' })
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

        // Obtener equipos añadidos a la temporada
        const addedTeams = await dataSource.query<TeamResponse[]>(`
            SELECT 
                t.id,
                t.name,
                t.assistant,
                t.emblem
            FROM teams t
            INNER JOIN season_teams st ON t.id = st.team_id
            WHERE st.season_id = ?
            AND st.active = TRUE
            AND t.active = TRUE
            ORDER BY t.name ASC
        `, [seasonId]);

        // Obtener equipos disponibles (no añadidos a la temporada)
        const availableTeams = await dataSource.query<TeamResponse[]>(`
            SELECT 
                t.id,
                t.name,
                t.assistant,
                t.emblem
            FROM teams t
            WHERE t.active = TRUE
            AND t.id NOT IN (
                SELECT team_id 
                FROM season_teams 
                WHERE season_id = ?
                AND active = TRUE
            )
            ORDER BY t.name ASC
        `, [seasonId]);

        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify({
                message: 'Equipos obtenidos correctamente',
                addedTeams,
                availableTeams
            })
        };

    } catch (error) {
        console.error('Error al obtener equipos de la temporada:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al obtener equipos de la temporada.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
} 