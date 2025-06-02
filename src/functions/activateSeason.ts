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
            // Actualizar el parámetro CURRENT_SEASON
            await dataSource.query(`
                UPDATE Parameters 
                SET value = ? 
                WHERE code = 'CURRENT_SEASON'
            `, [seasonId]);

            await dataSource.query('COMMIT');

            return {
                headers: headersConfig,
                statusCode: 200,
                body: JSON.stringify({ 
                    message: 'Temporada activada correctamente'
                })
            };

        } catch (error) {
            await dataSource.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error al activar la temporada:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al activar la temporada.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
} 