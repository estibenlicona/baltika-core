import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

export async function handler(event: APIGatewayEvent) {
    try {
        const { homeId, awayId, seasonId } = event.queryStringParameters || {}

        const dataSource: DataSource = await getDbConnection();
        const [match] = await dataSource.query(`
            SELECT id, matchDay, homeGoals, awayGoals, homeYellowCards, homeRedCards, awayYellowCards, awayRedCards, played, homePenalty, awayPenalty
            FROM matchs WHERE homeId = ? AND awayId = ? AND seasonId = ?
        `, [homeId, awayId, seasonId]);

        const players = await dataSource.query<Array<any>>(`
            SELECT p.id, p.name, p.photo, s.teamId FROM Players p INNER JOIN Squads s ON p.id = s.playerId
            WHERE s.seasonId = ? AND s.basePlayer = 0 AND s.teamId IN (?, ?) 
        `, [seasonId, homeId, awayId])

        const playerStatistics = await dataSource.query<Array<any>>(`
        SELECT id, matchId, playerId, goals FROM PlayerStatistics WHERE matchId = ?
        `, [match.id]);

        const matchInfo = {
            ...match,
            players,
            playerStatistics
        }

        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify(matchInfo),
        };
    } catch (error) {
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({ error: "Ha ocurrido un error." })
        };
    }

}