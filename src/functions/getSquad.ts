import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";
import { APIGatewayEvent } from "aws-lambda/trigger/api-gateway-proxy";

export async function handler(event: APIGatewayEvent) {
    const { teamId } = event.queryStringParameters || {};

    if (!teamId) {
        return {
            headers: headersConfig,
            statusCode: 400,
            body: JSON.stringify({ message: "teamId is required" }),
        };
    }

    const dataSource: DataSource = await getDbConnection();

    const squad = await dataSource.query(`
        SELECT 
            s.id,
            COALESCE(p.name, bp.name) AS name,
            COALESCE(p.photo, bp.photo) AS photo,
            COALESCE(p.position, bp.position) AS position,
            s.playerId, 
            s.seasonId, 
            s.basePlayer, 
            s.enrolled, 
            s.contractType, 
            s.salary, 
            s.remainingSeasons
        FROM Squads s
        LEFT JOIN Players p ON s.playerId = p.id AND s.basePlayer = FALSE
        LEFT JOIN BasePlayers bp ON s.playerId = bp.id AND s.basePlayer = TRUE
        WHERE s.seasonId = (SELECT value FROM Parameters WHERE code = 'CURRENT_SEASON') 
        AND s.teamId = ?
        ORDER BY s.salary DESC
    `, [teamId]);

    return {
        headers: headersConfig,
        statusCode: 200,
        body: JSON.stringify(squad),
    };
}