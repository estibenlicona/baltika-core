import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

export async function handler(event: APIGatewayEvent) {
    try {
        if (!event.pathParameters?.id) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El ID de la temporada es requerido' })
            };
        }

        const seasonId = Number(event.pathParameters.id);
        if (isNaN(seasonId)) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El ID de la temporada debe ser un número válido' })
            };
        }

        const dataSource: DataSource = await getDbConnection();

        const query = `
            SELECT 
                s.id,
                s.name,
                s.matchesEndDate,
                s.negotiationsStartDate,
                s.negotiationsEndDate,
                s.auctionsStartDate,
                s.auctionsEndDate,
                CASE WHEN p.value IS NOT NULL AND p.value COLLATE utf8mb4_unicode_ci = CAST(s.id as CHAR) COLLATE utf8mb4_unicode_ci
                     THEN TRUE 
                     ELSE FALSE 
                END as isCurrent,
                t.id as tournamentId,
                t.name as tournamentName
            FROM seasons s
            LEFT JOIN tournaments t ON s.tournamentId = t.id
            LEFT JOIN Parameters p ON p.code = 'CURRENT_SEASON'
            WHERE s.id = ?
        `;

        const [season] = await dataSource.query(query, [seasonId]);

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

        // Estructurar la respuesta con el objeto tournament y las fechas
        const response = {
            id: season.id,
            name: season.name,
            isCurrent: season.isCurrent,
            tournament: {
                id: season.tournamentId,
                name: season.tournamentName
            },
            matchesEndDate: season.matchesEndDate,
            negotiationsStartDate: season.negotiationsStartDate,
            negotiationsEndDate: season.negotiationsEndDate,
            auctionsStartDate: season.auctionsStartDate,
            auctionsEndDate: season.auctionsEndDate
        };

        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify(response)
        };

    } catch (error) {
        console.error('Error al obtener la temporada:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al obtener la temporada.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
} 