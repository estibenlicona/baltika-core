import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { headersConfig } from "../../config/headers";
import { getDbConnection } from "../../commons/db-conecction";
import { Amplify } from "aws-amplify";
import { events } from "aws-amplify/api";

export async function handler(event: APIGatewayEvent) {
    try {
        const teamId: number = Number(event.queryStringParameters?.teamId);
        const playerId: number = Number(event.queryStringParameters?.playerId);

        const dataSource: DataSource = await getDbConnection();

        await dataSource.query(`UPDATE Negotiations SET status = 'CANCELADA' WHERE playerId = ? AND buyerTeamId = ?`,
            [playerId, teamId]);

        const negotiations = await dataSource.query("SELECT n.id FROM Negotiations n WHERE playerId = ? AND status = 'SUBASTA'", [playerId]);
        if (negotiations.length === 1) {
            await dataSource.query(
                `UPDATE Negotiations SET status = 'ACEPTADA' WHERE id = ?`,
                [negotiations[0].id]
            );
        }

        Amplify.configure({
            API: {
                Events: {
                    endpoint: "https://ksazrbsv3nb2djpelmb3g5vwna.appsync-api.us-east-1.amazonaws.com/event",
                    region: "us-east-1",
                    defaultAuthMode: "apiKey",
                    apiKey: "da2-hjodummkqndpdbynjpbebwkkim"
                }
            }
        });

        await events.post('/default/channel', { sync: true });

        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify({ message: 'Offer update successfully.' }),
        };
    } catch (error) {
        console.error('Error saving offer:', error);

        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({ message: 'An error occurred while saving the contract offer.' }),
        };
    }
}
