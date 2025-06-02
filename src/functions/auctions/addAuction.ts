import { APIGatewayEvent } from "aws-lambda";
import { Amplify } from 'aws-amplify';
import { events } from 'aws-amplify/data';
import { headersConfig } from "../../config/headers";
import { getDbConnection } from "../../commons/db-conecction";
import { DataSource, Repository } from "typeorm";
import { AuctionEntity } from "../../entities/auction.entity";
import { isWithinPeriod } from "../../utils/dateValidations";

interface CreateAuction {
    teamId: number;
    playerId: number;
    seasonId: number;
    value: number;
}

export async function handler(event: APIGatewayEvent) {
    try {
        if (!event.body) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El cuerpo de la petición no puede estar vacío' })
            };
        }

        const { teamId, playerId, value, seasonId } = JSON.parse(event.body);

        const dataSource: DataSource = await getDbConnection();

        // Obtener la temporada y sus fechas
        const [season] = await dataSource.query(`
            SELECT 
                auctionsStartDate,
                auctionsEndDate
            FROM seasons 
            WHERE id = ?
        `, [seasonId]);

        if (!season) {
            return {
                headers: headersConfig,
                statusCode: 404,
                body: JSON.stringify({ 
                    message: 'Temporada no encontrada',
                    code: 'SEASON_NOT_FOUND'
                })
            };
        }

        // Validar si estamos en período de subastas
        const utcNow = new Date();
        const canAuction = isWithinPeriod(
            utcNow,
            season.auctionsStartDate ? new Date(season.auctionsStartDate) : null,
            season.auctionsEndDate ? new Date(season.auctionsEndDate) : null
        );

        if (!canAuction) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'No se pueden realizar subastas en este momento',
                    code: 'AUCTION_PERIOD_CLOSED',
                    currentUTCTime: utcNow.toISOString(),
                    auctionPeriod: {
                        start: season.auctionsStartDate,
                        end: season.auctionsEndDate
                    }
                })
            };
        }

        // Registrar la subasta con timestamp UTC
        await dataSource.query(`
            INSERT INTO Auctions (teamId, playerId, seasonId, value, date)
            VALUES (?, ?, ?, ?, UTC_TIMESTAMP())
        `, [teamId, playerId, seasonId, value]);

        await dataSource.query(`
            UPDATE Negotiations SET transferValue = ? WHERE buyerTeamId = ? AND playerId = ? AND seasonId = ?`,
        [value, teamId, playerId, seasonId]);

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
            body: JSON.stringify({ 
                message: 'Subasta registrada correctamente',
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Error al crear la subasta:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al crear la subasta.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
}

async function fetchCurrentSeason(dataSource: DataSource): Promise<number> {
    const [season] = await dataSource.query(
        "SELECT value FROM Parameters WHERE code = 'CURRENT_SEASON'"
    );
    return Number(season.value);
}