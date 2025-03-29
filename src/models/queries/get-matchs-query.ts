export interface GetMatchsQuery {
    id: number;
    matchDay: number;
    homeId: number;
    awayId: number;
    homeGoals: number;
    awayGoals: number;
    home: string;
    away: string;
    homeEmblem: string;
    awayEmblem: string;
    homeAssistant: string;
    awayAssistant: string;
    played: boolean;
}