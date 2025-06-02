import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

export async function handler(event: APIGatewayEvent) {
    try {
        const dataSource: DataSource = await getDbConnection();
        
        const query = `
            SELECT 
                t.id,
                t.name,
                (
                    SELECT COUNT(s.id)
                    FROM seasons s
                    WHERE s.tournamentId = t.id
                ) as seasonsCount,
                EXISTS (
                    SELECT 1
                    FROM seasons s
                    JOIN Parameters p ON p.code = 'CURRENT_SEASON' 
                        AND p.value COLLATE utf8mb4_unicode_ci = CAST(s.id as CHAR) COLLATE utf8mb4_unicode_ci
                    WHERE s.tournamentId = t.id
                ) as hasCurrentSeason
            FROM tournaments t
            ORDER BY t.name ASC
        `;

        const tournaments = await dataSource.query(query);

        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify(tournaments)
        };

    } catch (error) {
        console.error('Error al obtener los torneos:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al obtener los torneos.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
} 