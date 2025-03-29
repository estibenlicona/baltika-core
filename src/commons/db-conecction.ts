import "reflect-metadata";
import { DataSource } from 'typeorm';
import { MatchEntity } from '../entities/match.entity';
import { TournamentEntity } from '../entities/tournament.entity';
import { SeasonEntity } from '../entities/season.entity';
import { TeamEntity } from '../entities/team.entity';
import { PositionEntity } from '../entities/position.entity';
import { ContractOfferEntity } from '../entities/contract-offer.entity';
import { AuctionEntity } from "../entities/auction.entity";

let dataSource: DataSource | null = null;

export async function getDbConnection(): Promise<DataSource> {
    if (!dataSource) {
        dataSource = new DataSource({
            type: 'mysql',
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT) || 3306,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            entities: [MatchEntity, TournamentEntity, SeasonEntity, TeamEntity, PositionEntity, ContractOfferEntity, AuctionEntity],
            synchronize: false,
            logging: false
        });

        await dataSource.initialize();
    }

    return dataSource;
}
