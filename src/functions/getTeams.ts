import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";
import { GetTeamsQuery } from "../models/queries/get-teams-query";

export async function handler() {
    const dataSource: DataSource = await getDbConnection();
    const teams = await dataSource
    .query<Array<GetTeamsQuery>>(`
        SELECT id, name, assistant, emblem FROM teams WHERE active = 1
    `);
    return {
        headers: headersConfig,
        statusCode: 200,
        body: JSON.stringify(teams),
    };
}

