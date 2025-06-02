import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

interface UpdateSeasonRequest {
    name: string;
    tournamentId: number;
    isCurrent: string;
    matchesEndDate?: string | null;
    negotiationsStartDate?: string | null;
    negotiationsEndDate?: string | null;
    auctionsStartDate?: string | null;
    auctionsEndDate?: string | null;
}

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

        if (!event.body) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El cuerpo de la petición no puede estar vacío' })
            };
        }

        const updateData: UpdateSeasonRequest = JSON.parse(event.body);

        // Validar datos requeridos
        if (!updateData.name || !updateData.tournamentId) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El nombre y el ID del torneo son requeridos' })
            };
        }

        const dataSource: DataSource = await getDbConnection();

        // Verificar que la temporada existe
        const [existingSeason] = await dataSource.query(
            'SELECT id FROM seasons WHERE id = ?',
            [seasonId]
        );

        if (!existingSeason) {
            return {
                headers: headersConfig,
                statusCode: 404,
                body: JSON.stringify({ 
                    message: 'Temporada no encontrada',
                    code: 'SEASON_NOT_FOUND'
                })
            };
        }

        // Verificar que el torneo existe
        const [tournament] = await dataSource.query(
            'SELECT id FROM tournaments WHERE id = ?',
            [updateData.tournamentId]
        );

        if (!tournament) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'El torneo especificado no existe',
                    code: 'TOURNAMENT_NOT_FOUND'
                })
            };
        }

        // Iniciar transacción
        await dataSource.query('START TRANSACTION');

        try {
            // Actualizar la temporada con las fechas
            await dataSource.query(
                `UPDATE seasons 
                SET name = ?, 
                    tournamentId = ?,
                    matchesEndDate = ?,
                    negotiationsStartDate = ?,
                    negotiationsEndDate = ?,
                    auctionsStartDate = ?,
                    auctionsEndDate = ?
                WHERE id = ?`,
                [
                    updateData.name, 
                    updateData.tournamentId,
                    updateData.matchesEndDate,
                    updateData.negotiationsStartDate,
                    updateData.negotiationsEndDate,
                    updateData.auctionsStartDate,
                    updateData.auctionsEndDate,
                    seasonId
                ]
            );

            // Actualizar el parámetro de temporada actual si es necesario
            if (updateData.isCurrent === '1') {
                await dataSource.query(
                    "UPDATE Parameters SET value = ? WHERE code = 'CURRENT_SEASON'",
                    [seasonId.toString()]
                );
            } else if (updateData.isCurrent === '0') {
                // Solo remover si esta temporada era la actual
                await dataSource.query(
                    "UPDATE Parameters SET value = NULL WHERE code = 'CURRENT_SEASON' AND value = ?",
                    [seasonId.toString()]
                );
            }

            await dataSource.query('COMMIT');

            // Obtener la temporada actualizada
            const query = `
                SELECT 
                    s.id,
                    s.name,
                    s.tournamentId,
                    s.matchesEndDate,
                    s.negotiationsStartDate,
                    s.negotiationsEndDate,
                    s.auctionsStartDate,
                    s.auctionsEndDate,
                    t.name as tournamentName,
                    CASE WHEN p.value IS NOT NULL AND p.value COLLATE utf8mb4_unicode_ci = CAST(s.id as CHAR) COLLATE utf8mb4_unicode_ci
                         THEN TRUE 
                         ELSE FALSE 
                    END as isCurrent
                FROM seasons s
                LEFT JOIN tournaments t ON s.tournamentId = t.id
                LEFT JOIN Parameters p ON p.code = 'CURRENT_SEASON'
                WHERE s.id = ?
            `;

            const [updatedSeason] = await dataSource.query(query, [seasonId]);

            return {
                headers: headersConfig,
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Temporada actualizada correctamente',
                    season: updatedSeason
                })
            };

        } catch (error) {
            await dataSource.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error al actualizar la temporada:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al actualizar la temporada.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
} 