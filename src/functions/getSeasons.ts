import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

export async function handler(event: APIGatewayEvent) {
    try {
        const dataSource: DataSource = await getDbConnection();
        
        // Obtener el ID del torneo si se proporciona como parámetro
        const tournamentId = event.queryStringParameters?.tournamentId;
        
        let query = `
            SELECT 
                s.id,
                s.name,
                s.tournamentId,
                t.name as tournamentName,
                CASE WHEN p.value IS NOT NULL AND p.value COLLATE utf8mb4_unicode_ci = CAST(s.id as CHAR) COLLATE utf8mb4_unicode_ci
                     THEN TRUE 
                     ELSE FALSE 
                END as isCurrent
            FROM seasons s
            LEFT JOIN tournaments t ON s.tournamentId = t.id
            LEFT JOIN Parameters p ON p.code = 'CURRENT_SEASON'
        `;

        const params: any[] = [];
        
        if (tournamentId) {
            query += ' WHERE s.tournamentId = ?';
            params.push(tournamentId);
        }

        query += ' ORDER BY s.name ASC';

        const seasons = await dataSource.query(query, params);

        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify(seasons)
        };

    } catch (error) {
        console.error('Error al obtener las temporadas:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al obtener las temporadas.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
} 