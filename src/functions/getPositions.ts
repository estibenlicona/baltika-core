import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

interface PositionsQuery {
    teamId: number;
    teamName: string;
    assistant: string;
    emblem: string;
    matches_played: number;
    wins: number;
    losses: number;
    draws: number;
    goals_for: number;
    goals_against: number;
    goal_difference: number;
    points: number;
}


export async function handler(event: APIGatewayEvent) {

    const dataSource: DataSource = await getDbConnection();

    const seasonId = await fetchCurrentSeason(dataSource);

    const positions = await dataSource.query<Array<PositionsQuery>>(
        `
        WITH home_stats AS (
            SELECT 
                homeId AS teamId,
                COUNT(*) AS matches_played,
                SUM(CASE WHEN homeGoals > awayGoals THEN 1 ELSE 0 END) AS wins,
                SUM(CASE WHEN homeGoals < awayGoals THEN 1 ELSE 0 END) AS losses,
                SUM(CASE WHEN homeGoals = awayGoals THEN 1 ELSE 0 END) AS draws,
                SUM(homeGoals) AS goals_for,
                SUM(awayGoals) AS goals_against
            FROM matchs
            WHERE played = 1
              AND seasonId = ?
            GROUP BY homeId
        ),
        away_stats AS (
            SELECT 
                awayId AS teamId,
                COUNT(*) AS matches_played,
                SUM(CASE WHEN awayGoals > homeGoals THEN 1 ELSE 0 END) AS wins,
                SUM(CASE WHEN awayGoals < homeGoals THEN 1 ELSE 0 END) AS losses,
                SUM(CASE WHEN awayGoals = homeGoals THEN 1 ELSE 0 END) AS draws,
                SUM(awayGoals) AS goals_for,
                SUM(homeGoals) AS goals_against
            FROM matchs
            WHERE played = 1
              AND seasonId = ?
            GROUP BY awayId
        ),
        team_stats AS (
            SELECT 
                teamId,
                SUM(matches_played) AS matches_played,
                SUM(wins) AS wins,
                SUM(losses) AS losses,
                SUM(draws) AS draws,
                SUM(goals_for) AS goals_for,
                SUM(goals_against) AS goals_against
            FROM (
                SELECT * FROM home_stats
                UNION ALL
                SELECT * FROM away_stats
            ) stats
            GROUP BY teamId
        )
        SELECT 
            t.id AS teamId,
            t.name AS teamName,
            t.assistant,
            t.emblem,
            COALESCE(s.matches_played, 0) AS matches_played,
            COALESCE(s.wins, 0) AS wins,
            COALESCE(s.losses, 0) AS losses,
            COALESCE(s.draws, 0) AS draws,
            COALESCE(s.goals_for, 0) AS goals_for,
            COALESCE(s.goals_against, 0) AS goals_against,
            (COALESCE(s.goals_for, 0) - COALESCE(s.goals_against, 0)) AS goal_difference,
            (COALESCE(s.wins, 0) * 3 + COALESCE(s.draws, 0)) AS points
        FROM teams t
        LEFT JOIN team_stats s ON t.id = s.teamId
        WHERE t.active = 1
        ORDER BY points DESC, goal_difference DESC, wins DESC, goals_for DESC;
        `,
        [seasonId, seasonId] // Duplicamos los parámetros
    );

    return {
        headers: headersConfig,
        statusCode: 200,
        body: JSON.stringify(positions),
    };
}

async function fetchCurrentSeason(dataSource: DataSource): Promise<number> {
    const [season] = await dataSource.query(
        "SELECT value FROM Parameters WHERE code = 'CURRENT_SEASON'"
    );
    return Number(season.value);
}