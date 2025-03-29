import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

export async function handler(event: APIGatewayEvent) {
    try {
        const { 
            playerId, buyerTeamId, sellerTeamId, contractType, 
            salary, transferValue, sessionValue, status, seasons 
        } = JSON.parse(event.body || '{}');

        if (!playerId || !buyerTeamId || !contractType || !salary) {
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

        const seasonId = await fetchCurrentSeason(dataSource);

        const query = `
            SELECT COUNT(*) AS count 
            FROM Negotiations 
            WHERE playerId = ? AND buyerTeamId = ? AND seasonId = ?
        `;

        const params = [Number(playerId), Number(buyerTeamId), Number(seasonId)];
        const [result] = await dataSource.query(query, params);

        const hasNegotiation = (result?.count ?? 0) > 0;
        if(hasNegotiation) {
            return {
                headers: headersConfig,
                statusCode: 404,
                body: JSON.stringify({ message: 'Ya hay una negociación activa.' }),
            };
        }

        await dataSource.query(`
            INSERT INTO Negotiations(playerId, buyerTeamId, sellerTeamId, contractType, salary, transferValue, sessionValue, status, seasonId, seasons)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [playerId, buyerTeamId, sellerTeamId, contractType, salary, transferValue, sessionValue, status, seasonId, seasons]);
            
        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify({ message: 'Contract offer created successfully.' }),
        };
    } catch (error) {
        console.error('Error saving contract offer:', error);

        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({ message: 'An error occurred while creating the contract offer.' }),
        };
    }
}

async function fetchCurrentSeason(dataSource: DataSource): Promise<number> {
    const [season] = await dataSource.query("SELECT value FROM Parameters WHERE code = 'CURRENT_SEASON'");
    return Number(season.value);
}