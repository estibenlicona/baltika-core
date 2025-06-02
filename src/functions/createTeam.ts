import { APIGatewayEvent } from "aws-lambda";
import { DataSource, Repository } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { TeamEntity } from "../entities/team.entity";
import { headersConfig } from "../config/headers";

interface CreateTeamRequest { 
    name: string;
    assistant?: string;
    emblem?: string;
    active: number;
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

        const teams: Array<CreateTeamRequest> = JSON.parse(event.body);
        
        // Validar que al menos haya un equipo y que todos tengan nombre
        if (!teams.length || teams.some(team => !team.name)) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'Se requiere al menos un equipo y todos deben tener nombre.' })
            };
        }

        const dataSource: DataSource = await getDbConnection();
        const teamRepository: Repository<TeamEntity> = dataSource.getRepository(TeamEntity);

        // Asegurarnos que todos los equipos tengan active = 1
        const teamsWithActive = teams.map(team => ({
            ...team,
            active: 1 // Forzamos active a 1 independientemente del valor enviado
        }));

        const teamEntities = teamRepository.create(teamsWithActive);
        const savedTeams = await teamRepository.save(teamEntities);

        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify({ 
                message: 'Equipos creados correctamente.',
                teams: savedTeams
            })
        };

    } catch (error) {
        console.error('Error al crear equipos:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({ 
                message: 'Error interno del servidor al crear equipos.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
}