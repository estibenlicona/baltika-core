import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";
import { FixtureService } from "../services/fixture.service";
import { MatchEntity } from "../entities/match.entity";
import { Repository } from "typeorm";

interface RecreateFixtureRequest {
    tournamentId: number;
    seasonId: number;
    round: number;
    teamIds: number[];
}

export async function handler(event: APIGatewayEvent) {
    try {
        if (!event.body) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El cuerpo de la petición no puede estar vacío' })
            };
        }

        const { tournamentId, seasonId, round, teamIds }: RecreateFixtureRequest = JSON.parse(event.body);

        if (!tournamentId || !seasonId || !round || !teamIds) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'Se requiere tournamentId, seasonId, round y teamIds' })
            };
        }

        if (teamIds.length === 0) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'Se debe proporcionar al menos un equipo' })
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

        // Verificar si hay partidos jugados ANTES de iniciar la transacción
        const [playedMatches] = await dataSource.query(`
            SELECT COUNT(*) as played
            FROM matchs
            WHERE seasonId = ? AND played = TRUE
        `, [seasonId]);

        if (playedMatches.played > 0) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'No se puede recrear el calendario porque ya hay partidos jugados',
                    code: 'MATCHES_ALREADY_PLAYED'
                })
            };
        }

        // Verificar que todos los equipos existan y estén activos
        const teams = await dataSource.query(
            'SELECT id FROM teams WHERE id IN (?) AND active = TRUE',
            [teamIds]
        );

        const validTeamIds = teams.map((t: { id: number }) => t.id);
        const invalidTeamIds = teamIds.filter((id: number) => !validTeamIds.includes(id));

        if (invalidTeamIds.length > 0) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'Algunos equipos no existen o no están activos',
                    invalidTeamIds
                })
            };
        }

        // Iniciar transacción
        await dataSource.query('START TRANSACTION');

        try {
            // Eliminar calendario existente
            await dataSource.query(
                'DELETE FROM matchs WHERE seasonId = ?',
                [seasonId]
            );

            // Generar nuevo calendario
            const fixture = new FixtureService().generateFixture(tournamentId, seasonId, round, teamIds);
            const matchRepository: Repository<MatchEntity> = dataSource.getRepository(MatchEntity);
            const matches = fixture.flatMap(match => match);
            const matchEntities = matchRepository.create(matches);
            await matchRepository.save(matchEntities);

            await dataSource.query('COMMIT');

            // Calcular estadísticas del nuevo fixture
            const stats = {
                totalTeams: teamIds.length,
                totalRounds: fixture.length,
                totalMatches: matches.length,
                playedMatches: 0
            };

            return {
                headers: headersConfig,
                statusCode: 200,
                body: JSON.stringify({ 
                    stats,
                    message: 'Calendario recreado correctamente'
                })
            };

        } catch (error) {
            await dataSource.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Error al recrear el calendario:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al recrear el calendario.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
} 