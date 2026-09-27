import { prioritizeChampionQualification } from "./tournamentUtils";

describe("prioritizeChampionQualification", () => {
  const firstPlace = { name: "First FC", country: "England" };
  const secondPlace = { name: "Second FC", country: "England" };
  const defendingChampion = { name: "Champion FC", country: "England" };

  test("keeps the champion in the list when already qualified", () => {
    const qualifiedTeams = [firstPlace, defendingChampion];

    const result = prioritizeChampionQualification(
      qualifiedTeams,
      defendingChampion,
      [defendingChampion],
      2
    );

    expect(result).toEqual(qualifiedTeams);
  });

  test("replaces the last qualified team when the champion is outside the spots", () => {
    const result = prioritizeChampionQualification(
      [firstPlace, secondPlace],
      defendingChampion,
      [defendingChampion],
      2
    );

    expect(result).toEqual([firstPlace, defendingChampion]);
  });

  test("keeps the spot count and removes duplicate teams", () => {
    const result = prioritizeChampionQualification(
      [firstPlace, firstPlace, secondPlace],
      defendingChampion,
      [defendingChampion],
      2
    );

    expect(result).toEqual([firstPlace, defendingChampion]);
    expect(result).toHaveLength(2);
  });

  test("does not add a champion outside the eligible team pool", () => {
    const result = prioritizeChampionQualification(
      [firstPlace, secondPlace],
      defendingChampion,
      [],
      2
    );

    expect(result).toEqual([firstPlace, secondPlace]);
  });
});