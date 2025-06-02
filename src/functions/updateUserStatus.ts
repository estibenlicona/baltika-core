import { APIGatewayEvent } from "aws-lambda";
import { 
    CognitoIdentityProviderClient,
    AdminDisableUserCommand,
    AdminEnableUserCommand,
    ListUsersCommand,
    AttributeType
} from "@aws-sdk/client-cognito-identity-provider";
import { headersConfig } from "../config/headers";

interface UpdateUserStatusRequest {
    userId: string;  // ID de Cognito (sub)
    active: boolean; // true para habilitar, false para inhabilitar
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

        const request: UpdateUserStatusRequest = JSON.parse(event.body);

        if (!request.userId || request.active === undefined) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El ID del usuario y el estado activo son requeridos.' })
            };
        }

        const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

        // Primero buscamos el usuario por su ID (sub)
        const listCommand = new ListUsersCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Filter: `sub = "${request.userId}"`
        });

        const listResponse = await client.send(listCommand);
        const user = listResponse.Users?.[0];

        if (!user) {
            return {
                headers: headersConfig,
                statusCode: 404,
                body: JSON.stringify({ message: 'Usuario no encontrado.' })
            };
        }

        // Actualizamos el estado del usuario según el campo active
        const updateCommand = request.active
            ? new AdminEnableUserCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: user.Username
            })
            : new AdminDisableUserCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: user.Username
            });

        await client.send(updateCommand);

        const email = user.Attributes?.find((attr: AttributeType) => attr.Name === 'email')?.Value;

        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify({
                message: `Usuario ${request.active ? 'habilitado' : 'inhabilitado'} correctamente`,
                userId: request.userId,
                username: user.Username,
                email: email,
                active: request.active
            })
        };

    } catch (error) {
        console.error('Error al actualizar estado del usuario:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al actualizar estado del usuario.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
} 