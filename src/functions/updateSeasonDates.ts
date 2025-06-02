import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

interface UpdateSeasonDatesRequest {
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

        if (!event.body) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El cuerpo de la petición no puede estar vacío' })
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

        const dates: UpdateSeasonDatesRequest = JSON.parse(event.body);

        // Convertir las fechas a objetos Date para validación
        const parsedDates = {
            matchesEnd: dates.matchesEndDate ? new Date(dates.matchesEndDate) : null,
            negotiationsStart: dates.negotiationsStartDate ? new Date(dates.negotiationsStartDate) : null,
            negotiationsEnd: dates.negotiationsEndDate ? new Date(dates.negotiationsEndDate) : null,
            auctionsStart: dates.auctionsStartDate ? new Date(dates.auctionsStartDate) : null,
            auctionsEnd: dates.auctionsEndDate ? new Date(dates.auctionsEndDate) : null
        };

        // Validar el orden lógico de las fechas
        if (parsedDates.matchesEnd && parsedDates.negotiationsStart && 
            parsedDates.matchesEnd > parsedDates.negotiationsStart) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'La fecha de fin de partidos debe ser anterior al inicio de negociaciones',
                    code: 'INVALID_DATES_ORDER'
                })
            };
        }

        if (parsedDates.negotiationsStart && parsedDates.negotiationsEnd && 
            parsedDates.negotiationsStart > parsedDates.negotiationsEnd) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'La fecha de inicio de negociaciones debe ser anterior a su fin',
                    code: 'INVALID_DATES_ORDER'
                })
            };
        }

        if (parsedDates.auctionsStart && parsedDates.auctionsEnd && 
            parsedDates.auctionsStart > parsedDates.auctionsEnd) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'La fecha de inicio de subastas debe ser anterior a su fin',
                    code: 'INVALID_DATES_ORDER'
                })
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
            // Construir la consulta de actualización dinámicamente
            const updates = [];
            const params = [];
            
            if (dates.matchesEndDate !== undefined) {
                updates.push('matchesEndDate = ?');
                params.push(dates.matchesEndDate);
            }
            if (dates.negotiationsStartDate !== undefined) {
                updates.push('negotiationsStartDate = ?');
                params.push(dates.negotiationsStartDate);
            }
            if (dates.negotiationsEndDate !== undefined) {
                updates.push('negotiationsEndDate = ?');
                params.push(dates.negotiationsEndDate);
            }
            if (dates.auctionsStartDate !== undefined) {
                updates.push('auctionsStartDate = ?');
                params.push(dates.auctionsStartDate);
            }
            if (dates.auctionsEndDate !== undefined) {
                updates.push('auctionsEndDate = ?');
                params.push(dates.auctionsEndDate);
            }

            if (updates.length > 0) {
                const query = `
                    UPDATE seasons 
                    SET ${updates.join(', ')}
                    WHERE id = ?
                `;
                params.push(seasonId);
                await dataSource.query(query, params);
            }

            // Obtener la temporada actualizada
            const [updatedSeason] = await dataSource.query(`
                SELECT 
                    id, name, tournamentId,
                    matchesEndDate,
                    negotiationsStartDate, negotiationsEndDate,
                    auctionsStartDate, auctionsEndDate
                FROM seasons 
                WHERE id = ?
            `, [seasonId]);

            await dataSource.query('COMMIT');

            return {
                headers: headersConfig,
                statusCode: 200,
                body: JSON.stringify({ 
                    message: 'Fechas de la temporada actualizadas correctamente',
                    season: updatedSeason
                })
            };

        } catch (error) {
            await dataSource.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error al actualizar las fechas de la temporada:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al actualizar las fechas de la temporada.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
} 