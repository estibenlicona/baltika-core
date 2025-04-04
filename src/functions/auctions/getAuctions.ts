import { DataSource } from "typeorm";
import { getDbConnection } from "../../commons/db-conecction";
import { headersConfig } from "../../config/headers";
import { APIGatewayEvent } from "aws-lambda";

export async function handler(event: APIGatewayEvent) {
    try {
        const teamId: number = Number(event.queryStringParameters?.teamId);
        const dataSource: DataSource = await getDbConnection();

        // Obtiene la temporada actual
        const season = await fetchCurrentSeason(dataSource);

        // Obtiene los jugadores que cumplen el criterio de subasta
        const players = await fetchPlayers(dataSource, teamId, season);
        const playerIds = extractPlayerIds(players);

        // Inicializa el objeto para agrupar subastas
        let auctionsGroupedByPlayer: { [key: string]: any[] } = {};

        if (playerIds.length > 0) {
            // Consulta de todas las subastas para los playerIds encontrados
            const auctions = await fetchAuctions(dataSource, playerIds);
            auctionsGroupedByPlayer = groupAuctionsByPlayer(auctions);
        }

        // Combina la información de jugadores con sus respectivas subastas
        const playersWithAuctions = mapPlayersWithAuctions(players, auctionsGroupedByPlayer);

        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify(playersWithAuctions),
        };

    } catch (error: any) {
        console.error("Error en handler:", error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "Internal Server Error" }),
        };
    }
}

async function fetchCurrentSeason(dataSource: DataSource): Promise<number> {
    const [season] = await dataSource.query(
        "SELECT value FROM Parameters WHERE code = 'CURRENT_SEASON'"
    );
    return Number(season.value);
}

async function fetchPlayers(dataSource: DataSource, teamId: number, season: number): Promise<any[]> {

    const players = await dataSource.query("SELECT n.playerId FROM Negotiations n WHERE n.buyerTeamId = ? AND n.seasonId = ?",
        [teamId, season]
    );

    const playerIds = extractPlayerIds(players);

    return await dataSource.query(
        `
        SELECT n.id, n.playerId, p.position, p.photo, p.name, n.status, n.seasonId, COUNT(*) AS total
        FROM Players p 
        INNER JOIN Negotiations n ON p.id = n.playerId
        WHERE n.playerId IN (?)
        GROUP BY p.id
        HAVING COUNT(*) > 1
        ORDER BY p.name ASC
    `,
        [playerIds]
    );
}

function extractPlayerIds(players: any[]): number[] {
    return players.map((player: any) => player.playerId);
}

async function fetchAuctions(dataSource: DataSource, playerIds: number[]): Promise<any[]> {
    return await dataSource.query(
    `
        SELECT a.id, a.teamId, t.name AS teamName, t.emblem, a.playerId, a.value, a.date 
        FROM Auctions a
        INNER JOIN teams t ON a.teamId = t.id
        WHERE a.playerId IN (?)

        UNION

        SELECT NULL AS id, t.id AS teamId, t.name AS teamName, t.emblem, n.playerId, n.transferValue AS value, n.createdAt AS date
        FROM Negotiations n
        INNER JOIN teams t ON n.buyerTeamId = t.id 
        WHERE n.playerId IN (?)

        ORDER BY value DESC, date DESC
    `,
        [playerIds, playerIds]
    );
}

function groupAuctionsByPlayer(auctions: any[]): { [key: string]: any[] } {
    return auctions.reduce((acc: { [key: string]: any[] }, auction: any) => {
        const key = auction.playerId;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(auction);
        return acc;
    }, {});
}

function mapPlayersWithAuctions(players: any[], auctionsGrouped: { [key: string]: any[] }): any[] {
    return players.map((player: any) => ({
        ...player,
        auctions: auctionsGrouped[player.playerId] || [],
    }));
}
