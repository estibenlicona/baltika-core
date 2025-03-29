import { Match } from "../models/match";

const UNSCHEDULED: number = 999;

export class FixtureService {
    private teamsIds: number[] = [];

    private initializeTeams(teamIds: number[]): void {
        this.teamsIds = [...teamIds];
        if (this.teamsIds.length % 2 !== 0) {
            this.teamsIds.push(UNSCHEDULED);
        }
    }

    public generateFixture(tournamentId: number, seasonId: number, round: number, teamIds: number[]): Match[][] {
        this.initializeTeams(teamIds);
        
        const numMatchDays = this.teamsIds.length - 1;
        const matchesPerRound = this.teamsIds.length / 2;        

        const firstLeg: Match[][] = this.createMatrix(numMatchDays, matchesPerRound, tournamentId, seasonId, round);
        this.populateFirstColumn(firstLeg);
        this.populateHomeTeams(firstLeg);
        this.populateAwayTeams(firstLeg);        

        const secondLeg: Match[][] = firstLeg.map(round =>
            round.map(match => ({
                ...match,
                homeId: match.awayId,
                awayId: match.homeId,
                matchDay: Number(match.matchDay) + numMatchDays
            }))
        );

        const fixture = [...firstLeg, ...secondLeg];
        return fixture;
    }

    private createMatrix(numMatchDays: number, matchesPerRound: number, tournamentId: number, seasonId: number, round: number): Match[][] {
        return Array.from({ length: numMatchDays }, (_, matchDayIndex) =>
            Array.from({ length: matchesPerRound }, (_, matchNumberIndex) => ({
                tournamentId,
                seasonId,
                round,
                matchDay: matchDayIndex + 1,
                matchNumber: matchNumberIndex + 1,
            } as Match))
        );
    }

    private populateFirstColumn(fixture: Match[][]): void {
        const lastTeamIndex = this.teamsIds.length - 1;
    
        fixture.forEach((round, index) => {
            const isEvenRound = index % 2 === 0;
            round[0] = {
                ...round[0],
                homeId: isEvenRound ? this.teamsIds[0] : this.teamsIds[lastTeamIndex],
                awayId: isEvenRound ? this.teamsIds[lastTeamIndex] : this.teamsIds[0],
            };
        });
    }

    private populateHomeTeams(fixture: Match[][]): void {
        const lastPlayableTeam = this.teamsIds.length - 2;
        let currentIndex = 0;

        fixture.forEach((round) => {
            for (let matchIndex = 1; matchIndex < round.length; matchIndex++) {
                round[matchIndex].homeId = this.teamsIds[currentIndex];
                currentIndex = (currentIndex === lastPlayableTeam) ? 0 : currentIndex + 1;
            }
        });
    }

    private populateAwayTeams(fixture: Match[][]): void {
        const lastPlayableTeam = this.teamsIds.length - 2;
        let currentIndex = 0;

        for (let roundIndex = fixture.length - 1; roundIndex >= 0; roundIndex--) {
            const round = fixture[roundIndex];
            const isEvenRound = roundIndex % 2 === 0;

            for (let matchIndex = round.length - 1; matchIndex >= 0; matchIndex--) {
                const isFirstMatch = matchIndex === 0;
                if (isFirstMatch && isEvenRound) {
                    round[matchIndex].homeId = this.teamsIds[currentIndex];
                } else {
                    round[matchIndex].awayId = this.teamsIds[currentIndex];
                }
                currentIndex = (currentIndex + 1) % (lastPlayableTeam + 1);
            }
        }
    }
}