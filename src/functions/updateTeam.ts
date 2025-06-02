import { APIGatewayEvent } from "aws-lambda";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { headersConfig } from "../config/headers";

interface UpdateTeamRequest {
    id: number;
    name: string;
    assistant: string;
    emblem?: string;  // Hacemos el emblem opcional
    active: boolean;
}

export async function handler(event: APIGatewayEvent) {
    try {
        // Validar que el cuerpo de la petición no esté vacío
        if (!event.body) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El cuerpo de la petición no puede estar vacío.' })
            };
        }

        const request: UpdateTeamRequest = JSON.parse(event.body);

        // Validar campos requeridos
        if (!request.id) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El ID del equipo es requerido.' })
            };
        }

        if (!request.name || !request.assistant) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'Los campos name y assistant son requeridos.' })
            };
        }

        const dataSource: DataSource = await getDbConnection();

        // Validar que el equipo existe
        const [team] = await dataSource.query(`
            SELECT id, name, assistant, emblem, active
            FROM teams 
            WHERE id = ?
        `, [request.id.toString()]);

        if (!team) {
            return {
                headers: headersConfig,
                statusCode: 404,
                body: JSON.stringify({ message: 'Equipo no encontrado.' })
            };
        }

        // Construir la consulta SQL dinámicamente
        let updateQuery = `
            UPDATE teams 
            SET name = ?, 
                assistant = ?,
                active = ?`;
        
        let queryParams = [request.name, request.assistant, request.active];

        if (request.emblem) {
            updateQuery += `, emblem = ?`;
            queryParams.push(request.emblem);
        }

        updateQuery += ` WHERE id = ?`;
        queryParams.push(request.id.toString());

        // Actualizar el equipo
        await dataSource.query(updateQuery, queryParams);

        // Obtener el equipo actualizado
        const [updatedTeam] = await dataSource.query(`
            SELECT id, name, assistant, emblem, active
            FROM teams
            WHERE id = ?
        `, [request.id.toString()]);

        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify({ 
                message: 'Equipo actualizado correctamente.',
                team: updatedTeam
            })
        };

    } catch (error) {
        console.error('Error al actualizar el equipo:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({ 
                message: 'Error interno del servidor al actualizar el equipo.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
} 