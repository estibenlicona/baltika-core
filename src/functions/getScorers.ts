import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

export async function handler() {
    const dataSource: DataSource = await getDbConnection();
    
    const scorers = await dataSource
    .query(`
        SELECT
            p.name,
            p.photo,
            t.name AS team,
            t.emblem AS teamEmblem,
            SUM(ps.goals) AS goals
        FROM PlayerStatistics ps
        INNER JOIN Players p ON ps.playerId = p.id
        INNER JOIN Squads s ON p.id = s.playerId
        INNER JOIN teams t ON s.teamId = t.id
        INNER JOIN Parameters pr ON pr.code = 'CURRENT_SEASON' AND ps.seasonId = pr.value
        GROUP BY
            p.id, p.name, p.photo, t.name, t.emblem
        ORDER BY goals DESC
    `);

    return {
        headers: headersConfig,
        statusCode: 200,
        body: JSON.stringify(scorers),
    };
}