export interface Season {
    id?: number;
    tournamentId: number;
    name: string;
    matchesEndDate?: Date;
    negotiationsStartDate?: Date;
    negotiationsEndDate?: Date;
    auctionsStartDate?: Date;
    auctionsEndDate?: Date;
} 