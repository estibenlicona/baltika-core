import { APIGatewayEvent } from "aws-lambda";
import { 
    CognitoIdentityProviderClient,
    AdminUpdateUserAttributesCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { headersConfig } from "../config/headers";
import { DataSource } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";

interface UpdateUserTeamRequest {
    userId: string;  // Este será usado como username en Cognito
    teamId: number | null;  // Permitimos null para remover el equipo
}

export async function handler(event: APIGatewayEvent) {
    try {
        if (!event.body) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El cuerpo de la petición no puede estar vacío.' })
            };
        }

        const request: UpdateUserTeamRequest = JSON.parse(event.body);

        if (!request.userId || request.teamId === undefined) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El userId es requerido y teamId debe estar definido (puede ser null).' })
            };
        }

        let teamName: string | undefined;

        // Solo verificamos el equipo si teamId no es null
        if (request.teamId !== null) {
            // Verificar que el equipo existe y está activo
            const dataSource: DataSource = await getDbConnection();
            const [team] = await dataSource.query(
                'SELECT id, name FROM teams WHERE id = ? AND active = 1',
                [request.teamId]
            );

            if (!team) {
                return {
                    headers: headersConfig,
                    statusCode: 404,
                    body: JSON.stringify({ message: 'El equipo no existe o no está activo.' })
                };
            }
            teamName = team.name;
        }

        const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

        const command = new AdminUpdateUserAttributesCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: request.userId,  // Usamos el userId como username para Cognito
            UserAttributes: [
                {
                    Name: 'custom:teamId',
                    Value: request.teamId !== null ? request.teamId.toString() : ''  // String vacío cuando es null
                }
            ]
        });

        await client.send(command);

        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify({
                message: request.teamId !== null 
                    ? 'Equipo del usuario actualizado correctamente'
                    : 'Usuario removido del equipo correctamente',
                userId: request.userId,
                teamId: request.teamId,
                teamName: teamName
            })
        };

    } catch (error) {
        console.error('Error al actualizar equipo del usuario:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al actualizar equipo del usuario.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
} 