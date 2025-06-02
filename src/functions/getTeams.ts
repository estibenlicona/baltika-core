import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";
import { GetTeamsQuery } from "../models/queries/get-teams-query";

export async function handler() {
    try {
        const dataSource: DataSource = await getDbConnection();
        const teams = await dataSource
        .query<Array<GetTeamsQuery>>(`
            SELECT 
                id,
                name,
                emblem,
                assistant,
                CAST(active AS UNSIGNED) as active
            FROM teams
        `);
        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify(teams),
        };
    } catch (error) {
        console.error('Error al obtener equipos:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({ 
                message: 'Error interno del servidor al obtener equipos.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
}

