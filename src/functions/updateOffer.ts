import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

export async function handler(event: APIGatewayEvent) {
    try {
        const offerId: number = Number(event.queryStringParameters?.id);

        const { 
            contractType, salary, transferValue, sessionValue, status, seasons 
        } = JSON.parse(event.body || '{}');

        if (!contractType || !salary || !status || !seasons) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'Payload incorrecto.'}),
            };
        }

        if(contractType === 'TRANSFER' && !transferValue){
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'Transfer value is required.'}),
            };
        }

        if(contractType === 'SESION' && !sessionValue){
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'Sesion value is required.'}),
            };
        }

        const dataSource: DataSource = await getDbConnection();

        await dataSource.query(`
            UPDATE Negotiations SET contractType = ?, salary = ?, transferValue = ?, sessionValue = ?, status = ?, seasons = ?
            WHERE id = ?`,
        [contractType, salary, transferValue, sessionValue, status, seasons, offerId]);

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
