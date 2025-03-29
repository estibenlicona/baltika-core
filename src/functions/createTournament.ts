import { APIGatewayEvent } from "aws-lambda";
import { Repository } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { TournamentEntity } from "../entities/tournament.entity";
import { headersConfig } from "../config/headers";

interface CreateTournamentRequest { name: string }

export async function handler(event: APIGatewayEvent) {
    const { name } = JSON.parse(event.body || '{}') as Partial<CreateTournamentRequest>;

    const dataSource = await getDbConnection();
    const tournamentRepository: Repository<TournamentEntity> = dataSource.getRepository(TournamentEntity);
    const tournamentEntity = tournamentRepository.create({ name });
    await tournamentEntity.save();

    return {
        headers: headersConfig,
        statusCode: 200,
        body: JSON.stringify({ message: 'Tournament created successfull.' }),
    };
}