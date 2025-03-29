import { APIGatewayEvent } from "aws-lambda";
import { headersConfig } from "../config/headers";
import { getDbConnection } from "../commons/db-conecction";
import { DataSource } from "typeorm";

export async function handler(event: APIGatewayEvent) {
    const { username } = event.pathParameters || {};

    if (!username) {
        return {
            headers: headersConfig,
            statusCode: 404,
            body: JSON.stringify({ message: 'username is required.' })
        };
    }

    const dataSource: DataSource = await getDbConnection();

    const query = `
        SELECT teamId
        FROM UsersTeams
        WHERE username = ?
    `;

    const params = [username];
    const [team] = await dataSource.query(query, params);

    const user = {
        teamId: team.teamId
    }
    return {
        headers: headersConfig,
        statusCode: 200,
        body: JSON.stringify(user),
    };
}