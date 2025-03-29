import { APIGatewayEvent } from "aws-lambda/trigger/api-gateway-proxy";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";

export async function handler(event: APIGatewayEvent) {
    try {
        const playerId = event.pathParameters?.id;
        if (!playerId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Player ID is required" }),
            };
        }

        // Get database connection
        const dataSource: DataSource = await getDbConnection();

        // Query to get player general information
        const playerQuery = `
            SELECT p.id, p.photo, p.name, p.position, p.transferValue, p.sessionValue, p.salary,
                p.height, p.weight, p.age, p.preferredFoot, p.nationalityId, p.nationality, n.emblem
            FROM Players p LEFT JOIN Nationalities n ON p.nationalityId = n.id
            WHERE p.id = ?
        `;
        const [player] = await dataSource.query(playerQuery, [playerId]);
        
        if (!player) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Player not found" }),
            };
        }

        // Query to get player stats
        const statsQuery = `
            SELECT attack, defence, balance, stamina, speed, acceleration,
                response, agility, dribbleAccuracy, dribbleSpeed, shortPassAccuracy, 
                shortPassSpeed, longPassAccuracy, longPassSpeed, shotAccuracy, 
                shotPower, shotTechnique, freeKickAccuracy, swerve, heading, jump, 
                technique, aggression, mentality, gkSkills, teamWork, consistency, 
                conditionFitness, weakFootAccuracy, weakFootFrequency
            FROM PlayerStats 
            WHERE playerId = ?;
        `;
        const [stats] = await dataSource.query(statsQuery, [playerId]);

        // Query to get player positions
        const positionsQuery = `
            SELECT position 
            FROM PlayerPositions 
            WHERE playerId = ?
        `;
        const positions = await dataSource.query(positionsQuery, [playerId]);

        // Query to get player special skills
        const skillsQuery = `
            SELECT ability 
            FROM PlayerSpecialAbilities 
            WHERE playerId = ?
        `;
        const skills = await dataSource.query(skillsQuery, [playerId]);

        return {
            statusCode: 200,
            body: JSON.stringify({
                ...player,
                stats: stats || {},
                positions: positions.map((p: any) => p.position),
                skills: skills.map((s: any) => s.ability)
            }),
        };
    } catch (error) {
        console.error("Error fetching player information:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
}
