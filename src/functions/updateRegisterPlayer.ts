import { APIGatewayEvent } from "aws-lambda";
import { headersConfig } from "../config/headers";
import { getDbConnection } from "../commons/db-conecction";
import { DataSource } from "typeorm";

export async function handler(event: APIGatewayEvent) {

    const { id, enrolled } = event.queryStringParameters || {};

    if (!id || !enrolled) {
        return {
            headers: headersConfig,
            statusCode: 404,
            body: JSON.stringify({ message: 'squadId es obligatorio.' })
        };
    }

    const dataSource: DataSource = await getDbConnection();

    const enrolledCast = enrolled === "true";
    await dataSource.query("UPDATE Squads SET enrolled = ? WHERE id = ?", [enrolledCast, id]);

    return {
        headers: headersConfig,
        statusCode: 200,
        body: JSON.stringify({ message: "El jugador ha sido desinscrito exitosamente." })
    };
}