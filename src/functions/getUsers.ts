import { APIGatewayEvent } from "aws-lambda";
import { 
    CognitoIdentityProviderClient, 
    ListUsersCommand,
    ListUsersCommandOutput,
    UserType,
    AttributeType
} from "@aws-sdk/client-cognito-identity-provider";
import { headersConfig } from "../config/headers";
import { getDbConnection } from "../commons/db-conecction";
import { DataSource } from "typeorm";

interface CognitoUser {
    id: string;
    email: string;
    username: string;
    teamId?: number;
    teamName?: string;
    active: boolean;
}

interface TeamInfo {
    id: number;
    name: string;
}

export async function handler(event: APIGatewayEvent) {
    try {
        const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

        const command = new ListUsersCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
        });

        const response: ListUsersCommandOutput = await client.send(command);

        // Primero obtenemos los usuarios de Cognito
        const users: CognitoUser[] = response.Users?.map((user: UserType) => {
            const teamIdAttr = user.Attributes?.find((attr: AttributeType) => attr.Name === 'custom:teamId')?.Value;
            return {
                id: user.Attributes?.find((attr: AttributeType) => attr.Name === 'sub')?.Value || '',
                email: user.Attributes?.find((attr: AttributeType) => attr.Name === 'email')?.Value || '',
                username: user.Attributes?.find((attr: AttributeType) => attr.Name === 'nickname')?.Value || '',
                teamId: teamIdAttr ? parseInt(teamIdAttr) : undefined,
                active: user.Enabled || false
            };
        }) || [];

        // Obtenemos los IDs únicos de equipos
        const teamIds = [...new Set(users.map(user => user.teamId).filter(Boolean))];

        if (teamIds.length > 0) {
            // Obtenemos la conexión a la base de datos
            const dataSource: DataSource = await getDbConnection();

            // Obtenemos los nombres de los equipos en una sola consulta
            const teams: TeamInfo[] = await dataSource.query(
                `SELECT id, name FROM teams WHERE id IN (?) AND active = 1`,
                [teamIds]
            );

            // Creamos un mapa para acceso rápido
            const teamMap = new Map(teams.map(team => [team.id, team.name]));

            // Asignamos los nombres de los equipos a los usuarios
            users.forEach(user => {
                if (user.teamId) {
                    user.teamName = teamMap.get(user.teamId);
                }
            });
        }

        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify({
                message: 'Usuarios obtenidos correctamente',
                users
            })
        };

    } catch (error) {
        console.error('Error al obtener usuarios de Cognito:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al obtener usuarios.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
} 