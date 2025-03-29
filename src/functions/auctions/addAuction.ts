import { APIGatewayEvent } from "aws-lambda";
import { Amplify } from 'aws-amplify';
import { events } from 'aws-amplify/data';
import { headersConfig } from "../../config/headers";
import { getDbConnection } from "../../commons/db-conecction";
import { DataSource, Repository } from "typeorm";
import { AuctionEntity } from "../../entities/auction.entity";

interface CreateAuction {
    teamId: number;
    playerId: number;
    seasonId: number;
    value: number;
}

export async function handler(event: APIGatewayEvent) {
    try {
        const dataSource: DataSource = await getDbConnection();
        const request = JSON.parse(event.body || '{}') as Partial<CreateAuction>;

        const seasonId = await fetchCurrentSeason(dataSource);
        const auction = { ...request, seasonId };

        const repository: Repository<AuctionEntity> = dataSource.getRepository(AuctionEntity);
        const entity = repository.create(auction);
        await repository.save(entity);

        await dataSource.query(`
            UPDATE Negotiations SET transferValue = ? WHERE buyerTeamId = ? AND playerId = ? AND seasonId = ?`,
        [auction.value, auction.teamId, auction.playerId, auction.seasonId]);

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
            statusCode: 200,
            body: JSON.stringify({ message: "Puja creada correctamente." }),
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
    const [season] = await dataSource.query(
        "SELECT value FROM Parameters WHERE code = 'CURRENT_SEASON'"
    );
    return Number(season.value);
}