/**
 * Utilidad para validar plazos y fechas de manera segura.
 * Todas las validaciones se hacen en UTC para evitar manipulaciones de zona horaria.
 */

export function isWithinPeriod(currentDate: Date, startDate: Date | null, endDate: Date | null): boolean {
    // Convertir todas las fechas a UTC
    const utcNow = new Date(currentDate.toISOString());
    
    if (startDate && endDate) {
        // Si hay fecha de inicio y fin, validar que esté entre ambas
        const utcStart = new Date(startDate.toISOString());
        const utcEnd = new Date(endDate.toISOString());
        return utcNow >= utcStart && utcNow <= utcEnd;
    } else if (startDate) {
        // Si solo hay fecha de inicio, validar que sea posterior
        const utcStart = new Date(startDate.toISOString());
        return utcNow >= utcStart;
    } else if (endDate) {
        // Si solo hay fecha de fin, validar que sea anterior
        const utcEnd = new Date(endDate.toISOString());
        return utcNow <= utcEnd;
    }
    
    return true; // Si no hay fechas definidas, se considera válido
}

export function getRemainingTime(endDate: Date): number {
    const utcNow = new Date();
    const utcEnd = new Date(endDate.toISOString());
    return utcEnd.getTime() - utcNow.getTime();
}

export function getSeasonPeriodStatus(
    currentDate: Date,
    matchesEndDate: Date | null,
    negotiationsStartDate: Date | null,
    negotiationsEndDate: Date | null,
    auctionsStartDate: Date | null,
    auctionsEndDate: Date | null
): {
    canPlayMatches: boolean;
    canNegotiate: boolean;
    canAuction: boolean;
    currentPeriod: 'MATCHES' | 'NEGOTIATIONS' | 'AUCTIONS' | 'CLOSED';
} {
    const utcNow = new Date(currentDate.toISOString());

    // Validar período de partidos
    const canPlayMatches = matchesEndDate ? utcNow <= new Date(matchesEndDate.toISOString()) : true;

    // Validar período de negociaciones
    const canNegotiate = isWithinPeriod(utcNow, negotiationsStartDate, negotiationsEndDate);

    // Validar período de subastas
    const canAuction = isWithinPeriod(utcNow, auctionsStartDate, auctionsEndDate);

    // Determinar el período actual
    let currentPeriod: 'MATCHES' | 'NEGOTIATIONS' | 'AUCTIONS' | 'CLOSED' = 'CLOSED';
    
    if (canPlayMatches) {
        currentPeriod = 'MATCHES';
    } else if (canNegotiate) {
        currentPeriod = 'NEGOTIATIONS';
    } else if (canAuction) {
        currentPeriod = 'AUCTIONS';
    }

    return {
        canPlayMatches,
        canNegotiate,
        canAuction,
        currentPeriod
    };
} 