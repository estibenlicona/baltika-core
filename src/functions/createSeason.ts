import { APIGatewayEvent } from "aws-lambda";
import { DataSource, Repository, DeepPartial } from "typeorm";
import { getDbConnection } from "../commons/db-conecction";
import { SeasonEntity } from "../entities/season.entity";
import { headersConfig } from "../config/headers";

// Lista de zonas horarias permitidas
const ALLOWED_TIMEZONES = [
    'America/Argentina/Buenos_Aires',
    'America/Bogota',
    'America/Costa_Rica',
    'America/Panama',
    'America/Guatemala',
    'America/El_Salvador',
    'America/Tegucigalpa',
    'America/Managua',
    'UTC'
];

interface CreateSeasonRequest { 
    tournamentId: number;
    name: string;
    matchesEndDate?: string;
    negotiationsStartDate?: string;
    negotiationsEndDate?: string;
    auctionsStartDate?: string;
    auctionsEndDate?: string;
    timezone?: string;
}

function isValidTimezone(timezone: string): boolean {
    try {
        // Verificar si la zona horaria está en la lista de permitidas
        if (!ALLOWED_TIMEZONES.includes(timezone)) {
            return false;
        }

        // Verificar si la zona horaria es válida intentando usarla
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
        return true;
    } catch (e) {
        return false;
    }
}

function convertToUTC(dateStr: string | undefined, timezone: string = 'UTC'): Date | undefined {
    if (!dateStr) return undefined;
    
    try {
        // Validar la zona horaria antes de usarla
        if (!isValidTimezone(timezone)) {
            console.error('Invalid timezone provided:', timezone);
            timezone = 'UTC';
        }

        // Crear fecha en la zona horaria del usuario
        const userDate = new Date(dateStr);
        
        // Convertir a UTC
        const utcDate = new Date(userDate.toLocaleString('en-US', { timeZone: 'UTC' }));
        
        return utcDate;
    } catch (error) {
        console.error('Error converting date to UTC:', error);
        return undefined;
    }
}

export async function handler(event: APIGatewayEvent) {
    try {
        if (!event.body) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'El cuerpo de la petición no puede estar vacío' })
            };
        }

        const { 
            tournamentId, 
            name, 
            matchesEndDate,
            negotiationsStartDate,
            negotiationsEndDate,
            auctionsStartDate,
            auctionsEndDate,
            timezone = 'UTC'
        }: CreateSeasonRequest = JSON.parse(event.body);

        // Validar la zona horaria
        if (!isValidTimezone(timezone)) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'Zona horaria no válida o no permitida',
                    code: 'INVALID_TIMEZONE',
                    allowedTimezones: ALLOWED_TIMEZONES
                })
            };
        }

        if (!tournamentId || !name) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ message: 'Se requiere tournamentId y name' })
            };
        }

        // Convertir todas las fechas a UTC
        const dates = {
            matchesEnd: convertToUTC(matchesEndDate, timezone),
            negotiationsStart: convertToUTC(negotiationsStartDate, timezone),
            negotiationsEnd: convertToUTC(negotiationsEndDate, timezone),
            auctionsStart: convertToUTC(auctionsStartDate, timezone),
            auctionsEnd: convertToUTC(auctionsEndDate, timezone)
        };

        // Validar el orden de las fechas si están presentes
        if (dates.matchesEnd && dates.negotiationsStart && dates.matchesEnd > dates.negotiationsStart) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'La fecha de fin de partidos debe ser anterior al inicio de negociaciones',
                    code: 'INVALID_DATES_ORDER'
                })
            };
        }

        if (dates.negotiationsStart && dates.negotiationsEnd && dates.negotiationsStart > dates.negotiationsEnd) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'La fecha de inicio de negociaciones debe ser anterior a su fin',
                    code: 'INVALID_DATES_ORDER'
                })
            };
        }

        if (dates.auctionsStart && dates.auctionsEnd && dates.auctionsStart > dates.auctionsEnd) {
            return {
                headers: headersConfig,
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'La fecha de inicio de subastas debe ser anterior a su fin',
                    code: 'INVALID_DATES_ORDER'
                })
            };
        }

        const dataSource: DataSource = await getDbConnection();
        const seasonRepository: Repository<SeasonEntity> = dataSource.getRepository(SeasonEntity);
        
        const seasonData: DeepPartial<SeasonEntity> = {
            tournamentId, 
            name,
            matchesEndDate: dates.matchesEnd,
            negotiationsStartDate: dates.negotiationsStart,
            negotiationsEndDate: dates.negotiationsEnd,
            auctionsStartDate: dates.auctionsStart,
            auctionsEndDate: dates.auctionsEnd
        };

        const seasonEntity = seasonRepository.create(seasonData);
        await seasonEntity.save();

        // Convertir las fechas de vuelta a la zona horaria del usuario para la respuesta
        const responseData = {
            ...seasonEntity,
            matchesEndDate: dates.matchesEnd?.toLocaleString('en-US', { timeZone: timezone }),
            negotiationsStartDate: dates.negotiationsStart?.toLocaleString('en-US', { timeZone: timezone }),
            negotiationsEndDate: dates.negotiationsEnd?.toLocaleString('en-US', { timeZone: timezone }),
            auctionsStartDate: dates.auctionsStart?.toLocaleString('en-US', { timeZone: timezone }),
            auctionsEndDate: dates.auctionsEnd?.toLocaleString('en-US', { timeZone: timezone })
        };

        return {
            headers: headersConfig,
            statusCode: 200,
            body: JSON.stringify({ 
                message: 'Temporada creada correctamente',
                season: responseData
            })
        };

    } catch (error) {
        console.error('Error al crear la temporada:', error);
        return {
            headers: headersConfig,
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno del servidor al crear la temporada.',
                error: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
}