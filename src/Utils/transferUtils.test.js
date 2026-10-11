import { GetLoanTeams, GetNewTeams, GetRenewalPerformanceThreshold } from "./transferUtils";

describe("GetNewTeams", () => {
  const createTeam = (name, power) => ({ name, power });
  const currentPlayer = {
    age: 25,
    performance: 0,
    baseValue: 100,
    team: createTeam("Current", 50),
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
      { ...currentPlayer, age: 15 },
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
    const extraTeams = [
      createTeam("Extra A", 90),
      createTeam("Extra B", 89),
      createTeam("Extra C", 88)
    ];
    const result = GetNewTeams(currentPlayer, [{ highestLeague: { teams: leagueTeams } }], [], 0, [
      { name: "AFC", teams: extraTeams }
    ]);

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
      { ...currentPlayer, age: 15 },
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

  test("prioritizes teams above the power limit through peak and fills three offers", () => {
    const teams = [
      createTeam("Low", 7.5),
      createTeam("Below limit", 7.99),
      createTeam("At limit", 8),
      createTeam("Eligible A", 8.01),
      createTeam("Eligible B", 8.4),
      createTeam("Eligible C", 8.8)
    ];
    const player = { ...currentPlayer, age: 25, team: createTeam("Current", 9) };
    const result = GetNewTeams(player, [{ highestLeague: { teams } }], [], 0);
    const offers = result.contracts.map((contract) => contract.team);

    expect(offers).toHaveLength(3);
    expect(new Set(offers.map((team) => team.name)).size).toBe(3);
    expect(offers.every((team) => team.power > 8)).toBe(true);
  });

  test("prioritizes teams below the power limit after peak", () => {
    const teams = [
      createTeam("Eligible A", 7.2),
      createTeam("Eligible B", 7.6),
      createTeam("Eligible C", 7.99),
      createTeam("At limit", 8),
      createTeam("Above limit", 8.5),
      createTeam("High", 9)
    ];
    const player = { ...currentPlayer, age: 30, team: createTeam("Current", 7) };
    const result = GetNewTeams(player, [{ highestLeague: { teams } }], [], 0);

    expect(result.contracts).toHaveLength(3);
    expect(result.contracts.every((contract) => contract.team.power < 8)).toBe(true);
  });

  test("fills missing transfer offers with the closest available teams", () => {
    const teams = [
      createTeam("Closest", 8),
      createTeam("Next closest", 7.95),
      createTeam("Only eligible", 8.5),
      createTeam("Far", 6)
    ];
    const player = { ...currentPlayer, age: 25, team: createTeam("Current", 9) };
    const result = GetNewTeams(player, [{ highestLeague: { teams } }], [], 0);

    expect(result.contracts).toHaveLength(3);
    expect(result.contracts.map((contract) => contract.team.name)).toEqual(
      expect.arrayContaining(["Only eligible", "Closest", "Next closest"])
    );
  });

  test("applies the current-team power limit strictly after peak", () => {
    const teams = [
      createTeam("Below limit", 7.99),
      createTeam("At limit", 8),
      createTeam("Above limit", 8.1)
    ];
    const player = { ...currentPlayer, age: 26, team: createTeam("Current", 7) };
    const result = GetNewTeams(player, [{ highestLeague: { teams } }], [], 0);

    expect(result.contracts).toHaveLength(1);
    expect(result.contracts[0].team.name).toBe("Below limit");
  });

  test("applies the age-based power ceiling strictly and does not exceed it to fill offers", () => {
    const teams = [
      createTeam("Below age ceiling", 7.99),
      createTeam("At age ceiling", 8),
      createTeam("Above age ceiling", 8.1)
    ];
    const player = {
      ...currentPlayer,
      age: 30,
      team: createTeam("Current", 10)
    };
    const result = GetNewTeams(player, [{ highestLeague: { teams } }], [], 0);

    expect(result.contracts).toHaveLength(1);
    expect(result.contracts[0].team.name).toBe("Below age ceiling");
  });

  test("raises the renewal performance threshold with age and current club power", () => {
    expect(GetRenewalPerformanceThreshold(26, 25, 5)).toBeCloseTo(0.25);
    expect(GetRenewalPerformanceThreshold(26, 25, 9)).toBeCloseTo(0.45);
    expect(GetRenewalPerformanceThreshold(30, 25, 9)).toBeCloseTo(0.65);
    expect(GetRenewalPerformanceThreshold(33, 25, 10)).toBeCloseTo(0.8);
  });

  test("completes loan offers when a weaker team exists", () => {
    const teams = [
      createTeam("Weaker", 4.9),
      createTeam("Nearest", 5.1),
      createTeam("Next nearest", 5.2),
      createTeam("Farther", 7)
    ];
    const player = { ...currentPlayer, team: createTeam("Current", 5) };
    const loans = GetLoanTeams(player, [{ highestLeague: { teams } }], []);

    expect(loans).toHaveLength(3);
    expect(new Set(loans.map((contract) => contract.team.name)).size).toBe(3);
    expect(loans.some((contract) => contract.team.name === "Weaker")).toBe(true);
    expect(loans.every((contract) => contract.loan)).toBe(true);
  });

  test("does not offer loans when no team is weaker than the current team", () => {
    const teams = [createTeam("Equal", 5), createTeam("Stronger", 5.1)];
    const player = { ...currentPlayer, team: createTeam("Current", 5) };

    expect(GetLoanTeams(player, [{ highestLeague: { teams } }], [])).toEqual([]);
  });
});
