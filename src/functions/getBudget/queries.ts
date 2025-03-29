export const BudgetQueries = {
    GetConcepts: `
        SELECT TeamId, Concept, Amount, Season, IsActive
        FROM Budgets
        WHERE TeamId = ? AND Season = ?
    `,
    GetNegotiations: `
        SELECT n.id, p.position, p.name, n.contractType, n.salary,
                (CASE WHEN n.contractType = 'TRANSFER' THEN n.transferValue ELSE n.sessionValue END) AS OperationValue,
                (n.salary + (CASE WHEN n.contractType = 'TRANSFER' THEN n.transferValue ELSE n.sessionValue END)) AS TotalOperationValue
        FROM Negotiations n
        INNER JOIN Players p ON n.playerId = p.id
        WHERE n.buyerTeamId = ? AND n.seasonId = ? AND n.status IN ('ENVIADA', 'ACEPTADA', 'SUBASTA')
    `,
    GetTeamMatchPerformance: "CALL GetTeamMatchPerformance(?, ?)",
    GetTeamMatchCompletionBonuses: "CALL GetTeamMatchCompletionBonuses(?, ?)",
    GetTeamCardsConcepts: "CALL GetTeamCardsConcepts(?, ?)",
    GetTeamPenaltiesConcepts: "CALL GetTeamPenaltiesConcepts(?, ?)"
};