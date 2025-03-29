import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

export async function handler(event: APIGatewayEvent) {
    try {
        const { id } = event.queryStringParameters || {};

        if (!id) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: "id es requerido." }),
            };
        }

        const dataSource: DataSource = await getDbConnection();
        
        // Validación para prevenir SQL Injection
        await dataSource
            .createQueryBuilder()
            .delete()
            .from("PlayerStatistics")
            .where("id = :id", { id })
            .execute();

        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify({ message: "Registro eliminado correctamente." }),
        };
    } catch (error) {
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({ error: "Ha ocurrido un error" }),
        };
    }
}
