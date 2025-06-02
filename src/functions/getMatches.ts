import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";
import { GetMatchsQuery } from "../models/queries/get-matchs-query";
import { APIGatewayEvent } from "aws-lambda";

export async function handler(event: APIGatewayEvent) {

    const teamId: number = Number(event.queryStringParameters?.teamId);
    
    const dataSource: DataSource = await getDbConnection();

    const seasonId = await fetchCurrentSeason(dataSource);
    
    const matchs = await dataSource
    .query<Array<GetMatchsQuery>>(`
        SELECT m.id, m.matchDay, m.homeId, m.awayId, m.homeGoals, m.awayGoals, 
               h.name AS home, a.name AS away, h.emblem AS homeEmblem, a.emblem AS awayEmblem, 
               h.assistant AS homeAssistant, a.assistant AS awayAssistant, m.played
        FROM matchs m 
        INNER JOIN teams h ON m.homeId = h.id 
        INNER JOIN teams a ON m.awayId = a.id
        WHERE m.seasonId = ? AND (m.homeId = ? OR m.awayId = ?)
         AND (m.homeId != 999 AND m.awayId != 999)
        ORDER BY m.matchDay ASC, m.played ASC
    `, [seasonId, teamId, teamId]);
    return {
        headers: headersConfig,
        statusCode: 200,
        body: JSON.stringify(matchs),
    };
}

async function fetchCurrentSeason(dataSource: DataSource): Promise<number> {
    const [season] = await dataSource.query(
        "SELECT value FROM Parameters WHERE code = 'CURRENT_SEASON'"
    );
    return Number(season.value);
}

