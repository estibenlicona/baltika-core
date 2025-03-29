import { APIGatewayEvent } from "aws-lambda";
import { headersConfig } from "../../config/headers";
import { getDbConnection } from "../../commons/db-conecction";
import { DataSource } from "typeorm";
import { BudgetQueries } from "./queries";

export async function handler(event: APIGatewayEvent) {
    try {
        const teamId = validateInput(event.queryStringParameters);
        const dataSource = await getDbConnection();
        const season = await fetchCurrentSeason(dataSource);
        
        const [concepts, performance, bonuses, negotiations, cards, penalties] = await Promise.all([
            fetchBudgetConcepts(dataSource, teamId, season),
            fetchTeamMatchPerformance(dataSource, teamId, season),
            fetchTeamMatchCompletionBonuses(dataSource, teamId, season),
            fetchNegotiations(dataSource, teamId, season),
            fetchTeamCardsConcepts(dataSource, teamId, season),
            fetchTeamPenaltiesConcepts(dataSource, teamId, season)
        ]);

        const financials = calculateFinancials(concepts, performance, bonuses, negotiations, cards, penalties);

        return buildResponse(200, financials);
    } catch (error) {
        console.error("Error processing request:", error);
        return buildErrorResponse(error);
    }
}

// Validar parámetros de entrada
function validateInput(queryParams: any): number {
    const { teamId } = queryParams || {};
    if (!teamId) {
        throw new Error('Payload incompleto.');
    }
    return Number(teamId);
}

// Obtener la temporada actual
async function fetchCurrentSeason(dataSource: DataSource): Promise<number> {
    const [season] = await dataSource.query("SELECT value FROM Parameters WHERE code = 'CURRENT_SEASON'");
    return Number(season.value);
}

// Consultar conceptos desde la tabla Budgets
async function fetchBudgetConcepts(dataSource: DataSource, teamId: number, season: number) {
    return await dataSource.query(BudgetQueries.GetConcepts, [teamId, season]);
}

// Consultar rendimientos por partidos de la temporada actual
async function fetchTeamMatchPerformance (dataSource: DataSource, teamId: number, seasonId: number) {
    const [performance] = await dataSource.query(BudgetQueries.GetTeamMatchPerformance, [teamId, seasonId]);
    return performance;
}

// Consultar bonos por partidos de la temporada actual
async function fetchTeamMatchCompletionBonuses (dataSource: DataSource, teamId: number, seasonId: number) {
    const [bonuses] = await dataSource.query(BudgetQueries.GetTeamMatchCompletionBonuses, [teamId, seasonId]);
    return bonuses;
}

// Consultar conceptos de tarjetas
async function fetchTeamCardsConcepts(dataSource: DataSource, teamId: number, seasonId: number) {
    const [cards] = await dataSource.query(BudgetQueries.GetTeamCardsConcepts, [teamId, seasonId]);
    return cards;
}

// Consultar multas por capturas incompletas
async function fetchTeamPenaltiesConcepts(dataSource: DataSource, teamId: number, seasonId: number) {
    const [penalties] = await dataSource.query(BudgetQueries.GetTeamPenaltiesConcepts, [teamId, seasonId]);
    return penalties;
}

// Consultar gastos en negociaciones
async function fetchNegotiations(dataSource: DataSource, teamId: number, season: number) {
    const negotiations = await dataSource.query(BudgetQueries.GetNegotiations, [teamId, season]);
    return negotiations.map((player: any) => {
        return {
            Concept: player.name,
            Amount: (player.TotalOperationValue * -1)
        }
    });
}

// Calcular los valores financieros
function calculateFinancials(concepts: any[], performance: any[], bonuses: any[], negotiations: any[], cards: any[], penalties: any[]) {
    
    const allIncomes = [...concepts, ...performance, ...bonuses];
    const income = allIncomes.reduce((total, item) => total + Number(item.Amount), 0);

    const allExpenses = [...negotiations, ...cards, ...penalties];
    const expense = allExpenses.reduce((total, item) => total + Number(item.Amount), 0);

    const balance = income + expense;

    return { incomes: allIncomes, expenses: allExpenses, income, expense, balance };
}

// Construir respuesta HTTP exitosa
function buildResponse(statusCode: number, body: any) {
    return {
        headers: headersConfig,
        statusCode,
        body: JSON.stringify(body),
    };
}

// Construir respuesta HTTP de error
function buildErrorResponse(error: any) {
    const statusCode = error.message === 'Payload incompleto.' ? 404 : 500;
    const message = statusCode === 404 ? error.message : 'Error interno al consultar el presupuesto y las negociaciones.';

    return buildResponse(statusCode, { message });
}
