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

        // Verificar si es la temporada actual
        const [currentSeason] = await dataSource.query(
            "SELECT value FROM Parameters WHERE code = 'CURRENT_SEASON'"
        );
        
        if (currentSeason && currentSeason.value === seasonId.toString()) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'No se puede eliminar la temporada actual',
                    code: 'CURRENT_SEASON'
                })
            };
        }

        // Verificar si la temporada tiene datos relacionados
        const [relatedData] = await dataSource.query(`
            SELECT 
                (SELECT COUNT(*) FROM matchs WHERE seasonId = ?) as matchCount,
                (SELECT COUNT(*) FROM Squads WHERE seasonId = ?) as squadCount,
                (SELECT COUNT(*) FROM Negotiations WHERE seasonId = ?) as negotiationCount,
                (SELECT COUNT(*) FROM Auctions WHERE seasonId = ?) as auctionCount
        `, [seasonId, seasonId, seasonId, seasonId]);

        if (relatedData.squadCount > 0 || 
            relatedData.negotiationCount > 0 || relatedData.auctionCount > 0) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'No se puede eliminar la temporada porque tiene datos relacionados',
                    code: 'HAS_RELATED_DATA',
                    relatedData
                })
            };
        }

        // Iniciar transacción
        await dataSource.query('START TRANSACTION');

        try {
            // Eliminar registros relacionados
            await dataSource.query('DELETE FROM season_teams WHERE season_id = ?', [seasonId]);
            await dataSource.query('DELETE FROM matchs WHERE seasonId = ?', [seasonId]);
            
            // Eliminar la temporada
            await dataSource.query('DELETE FROM seasons WHERE id = ?', [seasonId]);

            // Confirmar transacción
            await dataSource.query('COMMIT');

            return {
                headers: headersConfig,
                statusCode: 200,
                body: JSON.stringify({ 
                    message: 'Temporada y sus datos relacionados eliminados correctamente',
                    seasonId
                })
            };

        } catch (error) {
            // Revertir transacción en caso de error
            await dataSource.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error al eliminar la temporada:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al eliminar la temporada.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
} 