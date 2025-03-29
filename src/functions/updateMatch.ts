import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

interface PlayerStatistic {
    id?: number;
    playerId: number;
    goals: number;
}

interface UpdateMatchRequest {
    id: number;
    homeGoals: number;
    awayGoals: number;
    homeYellowCards: number;
    homeRedCards: number;
    awayYellowCards: number;
    awayRedCards: number;
    played: boolean;
    homePenalty: boolean;
    awayPenalty: boolean;
    playerStatistics: PlayerStatistic[];
}

export async function handler(event: APIGatewayEvent) {
    const request: UpdateMatchRequest = JSON.parse(event.body || '{}');
    const dataSource: DataSource = await getDbConnection();

    // 1️⃣ Actualizar los goles del partido
    await dataSource.query(`
        UPDATE matchs SET homeGoals = ?, awayGoals = ?, homeYellowCards = ?, homeRedCards = ?, awayYellowCards = ?, awayRedCards = ?, 
        played = ?, homePenalty = ?, awayPenalty = ? WHERE id = ? 
    `, [request.homeGoals, request.awayGoals, request.homeYellowCards, request.homeRedCards, 
        request.awayYellowCards, request.awayRedCards, request.played, request.homePenalty, request.awayPenalty, request.id]
    );

    // 2️⃣ Obtener las estadísticas existentes de los jugadores en este partido
    const existingStats = await dataSource.query(`
        SELECT id, playerId FROM PlayerStatistics WHERE matchId = ?
    `, [request.id]);

    // Mapa de estadísticas existentes (clave: playerId, valor: id)
    const existingStatsMap = new Map(existingStats.map((stat: { playerId: any; id: any; }) => [stat.playerId, stat.id]));

    // 3️⃣ Separar registros en "actualizar" y "crear"
    const updates = [];
    const inserts = [];

    for (const stat of request.playerStatistics) {
        if (stat.id || existingStatsMap.has(stat.playerId)) {
            // 🔹 Si tiene `id` o ya existe en la base de datos → ACTUALIZAR
            updates.push({
                id: stat.id || existingStatsMap.get(stat.playerId),
                goals: stat.goals
            });
        } else {
            // 🔹 Si no tiene `id` y no existe en la base de datos → INSERTAR
            inserts.push({
                matchId: request.id,
                playerId: stat.playerId,
                goals: stat.goals
            });
        }
    }

    // 4️⃣ Ejecutar actualizaciones en batch
    for (const update of updates) {
        await dataSource.query(`
            UPDATE PlayerStatistics 
            SET goals = ?
            WHERE id = ?
        `, [update.goals, update.id]);
    }

    const [season] = await dataSource.query("SELECT value FROM Parameters WHERE code = 'CURRENT_SEASON'");

    // 5️⃣ Ejecutar inserciones en batch
    if (inserts.length > 0) {
        const insertValues = inserts.map(stat => `(${stat.matchId}, ${stat.playerId}, ${stat.goals}, ${season.value})`).join(",");
        await dataSource.query(`
            INSERT INTO PlayerStatistics (matchId, playerId, goals, seasonId)
            VALUES ${insertValues}
        `);
    }

    // 6️⃣ Responder con éxito
    return {
        headers: headersConfig,
        statusCode: 200,
        body: JSON.stringify({ message: `Partido actualizado correctamente.` })
    };
}
