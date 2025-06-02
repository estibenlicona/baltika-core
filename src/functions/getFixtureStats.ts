import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

interface FixtureStats {
    hasFixture: boolean;
    stats?: {
        totalTeams: number;
        totalRounds: number;
        totalMatches: number;
        playedMatches: number;
    }
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

        // Obtener información del fixture
        const [fixtureInfo] = await dataSource.query(`
            SELECT 
                CAST((
                    SELECT COUNT(DISTINCT id)
                    FROM teams
                    WHERE id IN (
                        SELECT homeId FROM matchs WHERE seasonId = ?
                        UNION
                        SELECT awayId FROM matchs WHERE seasonId = ?
                    )
                ) AS SIGNED) as totalTeams,
                CAST(MAX(matchDay) AS SIGNED) as totalRounds,
                CAST(COUNT(*) AS SIGNED) as totalMatches,
                CAST(COALESCE(SUM(CASE WHEN played = 1 THEN 1 ELSE 0 END), 0) AS SIGNED) as playedMatches
            FROM matchs
            WHERE seasonId = ?
        `, [seasonId, seasonId, seasonId]);

        const response: FixtureStats = {
            hasFixture: fixtureInfo.totalMatches > 0
        };

        if (response.hasFixture) {
            response.stats = {
                totalTeams: Number(fixtureInfo.totalTeams) || 0,
                totalRounds: Number(fixtureInfo.totalRounds) || 0,
                totalMatches: Number(fixtureInfo.totalMatches) || 0,
                playedMatches: Number(fixtureInfo.playedMatches) || 0
            };
        }

        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify(response)
        };

    } catch (error) {
        console.error('Error al obtener estadísticas del fixture:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al obtener estadísticas del fixture.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
} 