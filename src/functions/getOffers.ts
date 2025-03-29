import { APIGatewayEvent } from "aws-lambda";
import { headersConfig } from "../config/headers";
import { getDbConnection } from "../commons/db-conecction";
import { DataSource } from "typeorm";

export async function handler(event: APIGatewayEvent) {
    const { teamId } = event.queryStringParameters || {};

    if (!teamId) {
        return {
            headers: headersConfig,
            statusCode: 404,
            body: JSON.stringify({ message: 'Payload incompleto.' })
        };
    }

    const dataSource: DataSource = await getDbConnection();
    const [season] = await dataSource.query("SELECT value FROM Parameters WHERE code = 'CURRENT_SEASON'");

    const query = `
        SELECT 
            n.id, n.playerId, n.buyerTeamId, n.seasonId, n.sellerTeamId, n.contractType, n.salary, n.transferValue, n.sessionValue, 
            n.status, n.seasons, p.position, p.name, p.photo
        FROM Negotiations n INNER JOIN Players p ON n.playerId = p.id
        WHERE n.buyerTeamId  = ? AND n.seasonId = ?;
    `;

    const params = [Number(teamId), season.value];
    const sentOffers = await dataSource.query(query, params);

    return {
        headers: headersConfig,
        statusCode: 200,
        body: JSON.stringify(sentOffers),
    };
}