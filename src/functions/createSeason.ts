import { APIGatewayEvent } from "aws-lambda";
import { DataSource, Repository } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { SeasonEntity } from "../entities/season.entity";
import { headersConfig } from "../config/headers";

interface CreateSeasonRequest { tournamentId: number, name: string }

export async function handler(event: APIGatewayEvent){
    const season = JSON.parse(event.body || '{}') as Partial<CreateSeasonRequest>;

    const dataSource: DataSource = await getDbConnection();
    const seasonRepository: Repository<SeasonEntity> = dataSource.getRepository(SeasonEntity);
    const seasonEntity = seasonRepository.create(season);
    await seasonEntity.save();

    return {
        headers: headersConfig,
        statusCode: 200,
        body: JSON.stringify({ message: 'Season created successfull.' })
    };

}