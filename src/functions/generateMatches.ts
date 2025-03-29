import { APIGatewayEvent } from "aws-lambda";
import { FixtureService } from "../services/fixture.service";
import { getDbConnection } from "../commons/db-conecction";
import { MatchEntity } from "../entities/match.entity";
import { Repository } from "typeorm";
import { headersConfig } from "../config/headers";

export async function handler(event: APIGatewayEvent) {
    const { tournamentId, seasonId, round, teamIds }: { 
        tournamentId: number; 
        seasonId: number; 
        round: number; 
        teamIds: number[]; 
    } = JSON.parse(event.body || '{}');

    if (teamIds.length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "No teams provided" }),
        };
    }

    const fixture = new FixtureService().generateFixture(tournamentId, seasonId, round, teamIds);
    const dataSource = await getDbConnection();
    const matchRepository: Repository<MatchEntity> = dataSource.getRepository(MatchEntity);
    const matchs = fixture.flatMap(match => match);
    const matchEntities = matchRepository.create(matchs);
    await matchRepository.save(matchEntities);

    return {
        headers: headersConfig,
        statusCode: 200,
        body: JSON.stringify({ message: 'Fixture generated successfull.' }),
    };
}