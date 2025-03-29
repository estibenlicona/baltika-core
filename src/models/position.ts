export interface Position {
    id?: number;
    teamId?: number;
    tournamentId?: number;
    seasonId?: number;
    round?: number;
    position?: number;
    points?: number;
    goalsScored?: number;
    goalsConceded?: number;
    goalsDifference?: number;
    wins?: number;
    draws?: number;
    losses?: number;
    played?: number;
}