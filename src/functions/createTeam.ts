import { APIGatewayEvent } from "aws-lambda";
import { DataSource, Repository } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { TeamEntity } from "../entities/team.entity";
import { headersConfig } from "../config/headers";

interface CreateTeamRequest { name: string, assistant?: string, emblem?: string }

export async function handler(event: APIGatewayEvent) {
    const teams: Array<CreateTeamRequest> = JSON.parse(event.body || '[]');
    const dataSource: DataSource = await getDbConnection();
    const teamRepository: Repository<TeamEntity> = dataSource.getRepository(TeamEntity);
    const teamEntities = teamRepository.create(teams);
    await teamRepository.save(teamEntities);

    return {
        headers: headersConfig,
        statusCode: 200,
        body: JSON.stringify({ message: 'Teams created successfull.' })
    };

}