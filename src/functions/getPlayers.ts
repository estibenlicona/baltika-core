import { APIGatewayEvent } from "aws-lambda/trigger/api-gateway-proxy";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { PlayerList } from "../models/queries/get-players-query";

interface SearchParams {
    search: string;
    positions: string | null;
    transferValue: Array<number> | null;
    page: number;
    stats?: Record<string, { min: number; max: number }>;
}

export async function handler(event: APIGatewayEvent) {
    try {
        // Parse and validate input parameters
        const params: SearchParams = {
            search: event.queryStringParameters?.search || "",
            positions: event.queryStringParameters?.positions || null,
            transferValue: parseTransferValue(event),
            page: parseInt(event.queryStringParameters?.page || "1", 10),
        };

        if (isNaN(params.page) || params.page < 1) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "'page' must be a valid positive number" }),
            };
        }

        const stats: Record<string, { min: number; max: number }> = {};
        const queryStats = event.queryStringParameters || {};

        const statMapping = [
            { field: "defence", queryMin: "defence_min", queryMax: "defence_max" },
            { field: "attack", queryMin: "attack_min", queryMax: "attack_max" },
            { field: "speed", queryMin: "top_speed_min", queryMax: "top_speed_max" },
            { field: "acceleration", queryMin: "acceleration_min", queryMax: "acceleration_max" },
            { field: "balance", queryMin: "body_balance_min", queryMax: "body_balance_max" },
            { field: "stamina", queryMin: "stamina_min", queryMax: "stamina_max" },
            { field: "response", queryMin: "response_min", queryMax: "response_max" },
            { field: "agility", queryMin: "agility_min", queryMax: "agility_max" },
            { field: "dribbleAccuracy", queryMin: "dribble_accuracy_min", queryMax: "dribble_accuracy_max" },
            { field: "dribbleSpeed", queryMin: "dribble_speed_min", queryMax: "dribble_speed_max" },
            { field: "shotAccuracy", queryMin: "shot_accuracy_min", queryMax: "shot_accuracy_max" },
            { field: "shotPower", queryMin: "shot_power_min", queryMax: "shot_power_max" },
            { field: "shotTechnique", queryMin: "shot_technique_min", queryMax: "shot_technique_max" },
            { field: "teamWork", queryMin: "team_work_min", queryMax: "team_work_max" },
        ];

        for (const { field, queryMin, queryMax } of statMapping) {
            const min = parseInt(queryStats[queryMin] || "");
            const max = parseInt(queryStats[queryMax] || "");
            if (!isNaN(min) || !isNaN(max)) {
              stats[field] = {
                min: isNaN(min) ? 50 : min,
                max: isNaN(max) ? 99 : max,
              };
            }
          }

        if (Object.keys(stats).length > 0) {
            params.stats = stats;
        }

        // Set pagination constants
        const pageSize = 30;
        const offset = (params.page - 1) * pageSize;

        // Get database connection
        const dataSource: DataSource = await getDbConnection();

        // Build query
        let query = `
            SELECT p.id, p.photo, p.name, p.position, p.transferValue, p.sessionValue, p.salary, t.id AS teamId, 
                IFNULL(t.name, 'libre') as teamName, COUNT(n.id) offers
            FROM Players p 
            LEFT JOIN Squads s ON p.id = s.playerId
            LEFT JOIN teams t ON s.teamId = t.id
            LEFT JOIN Negotiations n ON p.id = n.playerId AND n.status != 'CANCELADA'
        `;

        // Si hay filtros de estadísticas, hacemos el INNER JOIN con PlayerStats
        if (params.stats) {
            query += ` INNER JOIN PlayerStats ps ON p.id = ps.playerId `;
        }

        // WHERE con filtros fijos
        query += ` WHERE p.active = 1 AND p.contractValidUntil > 0 AND p.transferValue > 0 AND p.name LIKE ? `;
        
        const queryParams: any[] = [`%${params.search}%`];

        if(params.transferValue){
            query += " AND p.transferValue BETWEEN ? AND ? ";
            queryParams.push(params.transferValue[0]);
            queryParams.push(params.transferValue[1]);
        }


        if (params.positions) {
            const positionsSplit = params.positions.split(",") || [];
            // Convertimos cada posición en una cadena con comillas y removemos espacios extras
            const inPositions = positionsSplit
            .map(position => `'${position.trim()}'`)
            .join(", ");
            query += ` AND p.position IN (${inPositions})`;
        }

        // Agregamos filtros dinámicos de estadísticas
        if (params.stats) {
            for (const [key, { min, max }] of Object.entries(params.stats)) {
                query += ` AND ps.${key} BETWEEN ? AND ? `;
                queryParams.push(min, max);
            }
        }

        // Agrupacion por jugador
        query += ` GROUP BY p.id`;

        // Ordenación y paginación
        query += ` ORDER BY p.transferValue DESC LIMIT ? OFFSET ? `;
        queryParams.push(pageSize, offset);
        queryParams.push(pageSize, offset);

        const result = await dataSource.query(query, queryParams);
        const players = result.map((player: any) => (<PlayerList>{
            ...player,
            value: parseFloat(player.value),
            salary: parseFloat(player.salary),
        }));

        // Get total count for pagination metadata
        let countQuery = `
        SELECT COUNT(*) as total 
        FROM Players p
        `;

        // Si hay filtros de estadísticas, agregamos el INNER JOIN
        if (params.stats && Object.keys(params.stats).length > 0) {
            countQuery += ` INNER JOIN PlayerStats ps ON p.id = ps.playerId `;
        }

        // Agregamos el WHERE con la condición base
        countQuery += ` WHERE p.name LIKE ? `;
        const countParams: any[] = [`%${params.search}%`];

        if (params.positions) {
            const positionsSplit = params.positions.split(",") || [];
            // Convertimos cada posición en una cadena con comillas y removemos espacios extras
            const inPositions = positionsSplit
            .map(position => `'${position.trim()}'`)
            .join(", ");
            countQuery += ` AND p.position IN (${inPositions})`;
        }

        // Agregar condiciones dinámicas de estadísticas
        if (params.stats && Object.keys(params.stats).length > 0) {
            for (const [key, { min, max }] of Object.entries(params.stats)) {
                countQuery += ` AND ps.${key} BETWEEN ? AND ? `;
                countParams.push(min, max);
            }
        }

        const [{ total }] = await dataSource.query(countQuery, countParams);
        const totalPages = Math.ceil(total / pageSize);

        return {
            statusCode: 200,
            body: JSON.stringify({
                page: params.page,
                pageSize,
                totalItems: total,
                totalPages,
                items: players,
            }),
        };
    } catch (error) {
        console.error("Error processing request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
}


function parseTransferValue(event: any): number[] | null {
    const transferParam = event.queryStringParameters?.transferValue;
    if (!transferParam) {
      return null;
    }
    if (Array.isArray(transferParam)) {
      return transferParam.map(num => Number(num));
    }
    return transferParam.split(',').map((num: string) => Number(num));
  }