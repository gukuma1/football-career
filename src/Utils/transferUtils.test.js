import { GetNewTeams } from "./transferUtils";

describe("GetNewTeams", () => {
  const createTeam = (name, power) => ({ name, power });
  const currentPlayer = {
    age: 25,
    performance: 0,
    baseValue: 100,
    position: { peak: 25, abbreviation: "GO" }
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("applies the extra-team chance independently to all three offers", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.05);

    const extraTeams = [
      createTeam("Extra A", 100),
      createTeam("Extra B", 99),
      createTeam("Extra C", 98)
    ];
    const leagueTeams = Array.from({ length: 17 }, (_, index) =>
      createTeam(`League ${index}`, 90 - index)
    );
    const result = GetNewTeams(
      currentPlayer,
      [{ highestLeague: { teams: leagueTeams } }],
      [],
      0,
      [{ name: "AFC", teams: extraTeams }]
    );

    expect(result.contracts.map((contract) => contract.team.name)).toEqual([
      "Extra A",
      "Extra B",
      "Extra C"
    ]);
  });

  test("selects league teams in each offer when the extra chance fails", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    const leagueTeams = [
      createTeam("League A", 100),
      createTeam("League B", 99),
      createTeam("League C", 98),
      ...Array.from({ length: 14 }, (_, index) => createTeam(`League ${index}`, 80 - index))
    ];
    const extraTeams = [createTeam("Extra A", 90), createTeam("Extra B", 89), createTeam("Extra C", 88)];
    const result = GetNewTeams(
      currentPlayer,
      [{ highestLeague: { teams: leagueTeams } }],
      [],
      0,
      [{ name: "AFC", teams: extraTeams }]
    );

    expect(result.contracts.map((contract) => contract.team.name)).toEqual([
      "League B",
      "League C",
      "League A"
    ]);
  });

  test("falls back to league teams when extra teams run out", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.05);

    const leagueTeams = [
      createTeam("League A", 100),
      createTeam("League B", 99),
      createTeam("League C", 98),
      createTeam("League D", 97),
      ...Array.from({ length: 15 }, (_, index) => createTeam(`League ${index}`, 80 - index))
    ];
    const result = GetNewTeams(
      currentPlayer,
      [{ highestLeague: { teams: leagueTeams } }],
      [],
      0,
      [{ name: "AFC", teams: [createTeam("Extra A", 90)] }]
    );

    expect(result.contracts.map((contract) => contract.team.name)).toEqual([
      "Extra A",
      "League A",
      "League B"
    ]);
  });
});