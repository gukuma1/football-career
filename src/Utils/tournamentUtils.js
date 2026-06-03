/**
 * tournamentUtils.js
 * Funções de simulação de torneios e ligas.
 * Depende de matchUtils e de RandomNumber/DeepClone/shuffleArray do Utils.
 */

import { RandomNumber, DeepClone, shuffleArray } from "../Utils";
import { GetMatch } from "./matchUtils";

// ─── Auxiliares de chaveamento ────────────────────────────────────────────────

/**
 * Inverte um array em blocos de 2.
 * Exemplo: [A, B, C, D] → [C, D, A, B]
 */
export function customReverse(arr) {
  const chunkSize = 2;
  let chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  chunks.reverse();
  return chunks.flat();
}

// ─── Funções de sorteio de chaveamento ───────────────────────────────────────

export function euroCupDraw(firstPlaces, secondPlaces, thirdPlaces) {
  const validPositionsByGroup = {
    A: [1, 0],
    B: [0, 1],
    C: [0, 2],
    D: [1, 3],
    E: [2, 3],
    F: [3, 2]
  };
  const groupLabels = ["A", "B", "C", "D", "E", "F"];
  let thirdDraw = new Array(4).fill(null);

  let survivingThirds = thirdPlaces
    .map((team, index) => {
      if (team === null) return null;
      const group = groupLabels[index];
      return { team, positions: validPositionsByGroup[group] };
    })
    .filter(Boolean);

  while (survivingThirds.length > 0) {
    const positionFrequency = [0, 0, 0, 0];
    for (const third of survivingThirds) {
      for (const pos of third.positions) {
        positionFrequency[pos]++;
      }
    }

    let minFrequency = Infinity;
    let chosenPosition = null;

    for (let i = 0; i < 4; i++) {
      if (thirdDraw[i] !== null) continue;
      if (positionFrequency[i] < minFrequency && positionFrequency[i] > 0) {
        minFrequency = positionFrequency[i];
        chosenPosition = i;
      }
    }

    if (chosenPosition === null) break;

    const index = survivingThirds.findIndex((third) => third.positions.includes(chosenPosition));
    if (index !== -1) {
      const [third] = survivingThirds.splice(index, 1);
      thirdDraw[chosenPosition] = third.team;
    }
  }

  return firstPlaces.concat(secondPlaces, thirdDraw);
}

export function americanCupDraw(firstPlaces, secondPlaces, thirdPlaces) {
  secondPlaces = customReverse(secondPlaces);
  return firstPlaces.concat(secondPlaces);
}

export function africanAsianCupDraw(firstPlaces, secondPlaces, thirdPlaces) {
  let thirdDraw = [];

  if (thirdPlaces[0]) thirdDraw.push(thirdPlaces[0]);
  if (thirdPlaces[1]) thirdDraw.push(thirdPlaces[1]);
  if (!thirdDraw[0]) {
    thirdDraw[0] = thirdPlaces[2];
  } else if (!thirdDraw[1]) {
    thirdDraw[1] = thirdPlaces[2];
  }

  let secTemp = secondPlaces[0];
  secondPlaces[0] = secondPlaces[2];
  secondPlaces[2] = secTemp;

  return firstPlaces.concat(secondPlaces, thirdDraw);
}

export function worldCupDraw(firstPlaces, secondPlaces, thirdPlaces) {
  console.log("Primeiros colocados:", firstPlaces);
  console.log("Segundos colocados:", secondPlaces);
  console.log("Terceiros colocados:", thirdPlaces);

  const setMapping = ["T1", "T1", "T2", "T2", "T2", "T2", "T1", "T1", "T1", "T1", "T2", "T2"];
  const subsetsMapping = ["S1", "S2", "S2", "S1", "S1", "S2"];
  const allocationPriority = {
    "T1-S1": { main: [2, 5, 3, 4], exchange: [1, 6] },
    "T1-S2": { main: [3, 4, 2, 5], exchange: [0, 7] },
    "T2-S1": { main: [0, 7, 1, 6], exchange: [3, 4] },
    "T2-S2": { main: [1, 6, 0, 7], exchange: [2, 5] }
  };
  const secondPlaceSwapMap = {
    0: 3,
    1: 2,
    2: 1,
    3: 0,
    4: 7,
    5: 6,
    6: 5,
    7: 4,
    8: 11,
    9: 10,
    10: 9,
    11: 8
  };

  let sets = { T1: [], T2: [] };
  let thirdDraw = new Array(8).fill(null);

  function subsetHandler(subset, subsetKey, isSecond = false) {
    const priorities = allocationPriority[subsetKey];
    const exchangePriorities = priorities["exchange"];
    const mainPriorities = priorities["main"];

    for (let teamIndex = 0; teamIndex < subset.length; teamIndex++) {
      let allocated = false;

      if (isSecond) {
        if (thirdDraw[exchangePriorities[0]] == null) {
          thirdDraw[exchangePriorities[0]] = subset[teamIndex];
          allocated = true;
        } else if (thirdDraw[exchangePriorities[1]] == null) {
          thirdDraw[exchangePriorities[1]] = subset[teamIndex];
          allocated = true;
        }
      }

      if (!allocated) {
        for (let i = 0; i < mainPriorities.length; i++) {
          if (!thirdDraw[mainPriorities[i]]) {
            thirdDraw[mainPriorities[i]] = subset[teamIndex];
            allocated = true;
            break;
          }
        }
      }

      if (!allocated) {
        for (let i = 0; i < 2; i++) {
          const drawIndex = exchangePriorities[i];
          if (!thirdDraw[drawIndex]) {
            thirdDraw[drawIndex] = subset[teamIndex];
            allocated = true;

            const originalIndex = thirdPlaces.indexOf(subset[teamIndex]);
            const swapIndex = secondPlaceSwapMap[originalIndex];
            if (swapIndex !== undefined) {
              const temp = secondPlaces[originalIndex];
              secondPlaces[originalIndex] = secondPlaces[swapIndex];
              secondPlaces[swapIndex] = temp;
            }
            break;
          }
        }
      }
    }
  }

  function setHandler(set, setKey, isSecond = false) {
    let subsets = { S1: [], S2: [] };
    set.forEach((place, i) => {
      if (!place) return;
      const group = subsetsMapping[i];
      if (!subsets[group]) subsets[group] = [];
      subsets[group].push(place);
    });

    if (subsets.S1.length <= subsets.S2.length) {
      subsetHandler(subsets.S1, `${setKey}-S1`, isSecond);
      subsetHandler(subsets.S2, `${setKey}-S2`, isSecond);
    } else {
      subsetHandler(subsets.S2, `${setKey}-S2`, isSecond);
      subsetHandler(subsets.S1, `${setKey}-S1`, isSecond);
    }
  }

  thirdPlaces.forEach((place, i) => {
    const group = setMapping[i];
    if (!sets[group]) sets[group] = [];
    sets[group].push(place);
  });

  if (sets.T1.filter((n) => n).length <= sets.T2.filter((n) => n).length) {
    setHandler(sets.T1, "T1");
    setHandler(sets.T2, "T2", true);
  } else {
    setHandler(sets.T2, "T2");
    setHandler(sets.T1, "T1", true);
  }

  secondPlaces = customReverse(secondPlaces);
  return firstPlaces.concat(secondPlaces, thirdDraw);
}

export function clubWorldCupDraw(firstPlaces, secondPlaces, thirdPlaces) {
  secondPlaces = customReverse(secondPlaces);
  return firstPlaces.concat(secondPlaces);
}

// ─── Simulação de grupos ──────────────────────────────────────────────────────

/**
 * Simula uma fase de grupos no formato liga (todos contra todos).
 * @returns {{ sortedTeams: Array, desc: string }}
 */
export function GetLeaguePosition(teams) {
  let newTeams = DeepClone(teams);

  const teamStats = {};
  newTeams.forEach((team) => {
    teamStats[team.name] = {
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0
    };
  });

  for (let home = 0; home < newTeams.length; home++) {
    for (let away = 0; away < newTeams.length; away++) {
      if (home === away) continue;

      const homeTeam = newTeams[home];
      const awayTeam = newTeams[away];
      const [homeGoals, awayGoals] = GetMatch(homeTeam, awayTeam);

      teamStats[homeTeam.name].goalsFor += homeGoals;
      teamStats[homeTeam.name].goalsAgainst += awayGoals;
      teamStats[awayTeam.name].goalsFor += awayGoals;
      teamStats[awayTeam.name].goalsAgainst += homeGoals;

      if (homeGoals > awayGoals) {
        teamStats[homeTeam.name].points += 3;
      } else if (awayGoals > homeGoals) {
        teamStats[awayTeam.name].points += 3;
      } else {
        teamStats[homeTeam.name].points += 1;
        teamStats[awayTeam.name].points += 1;
      }
    }
  }

  Object.keys(teamStats).forEach((teamName) => {
    teamStats[teamName].goalDifference =
      teamStats[teamName].goalsFor - teamStats[teamName].goalsAgainst;
  });

  const sortedTeams = [...newTeams].sort((a, b) => {
    const sA = teamStats[a.name];
    const sB = teamStats[b.name];
    if (sB.points !== sA.points) return sB.points - sA.points;
    if (sB.goalDifference !== sA.goalDifference) return sB.goalDifference - sA.goalDifference;
    if (sB.goalsFor !== sA.goalsFor) return sB.goalsFor - sA.goalsFor;
    return a.name.localeCompare(b.name);
  });

  let desc = "";
  for (let i = 0; i < sortedTeams.length; i++) {
    desc += `--> ${i + 1}º: ${sortedTeams[i].name} (${teamStats[sortedTeams[i].name].points} pts)`;
  }

  return { sortedTeams, desc };
}

/**
 * Simula o formato de grupos da Copa do Mundo (round-robin por rodadas).
 * @param {Array} teams
 * @param {Object|null} playerTeam
 * @param {number} groupID
 * @returns {{ table, playerMatches, desc, points }}
 */
export function GetWorldCupPosition(teams, playerTeam = null, groupID) {
  const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  let playerMatches = "";
  let newTeams = DeepClone([...teams]);

  const standings = {};
  for (let team of teams) {
    standings[team.name] = {
      team,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0
    };
  }

  for (let round = 1; round < newTeams.length; round++) {
    let rotatedTeams = [...newTeams];
    let last = rotatedTeams.pop();
    rotatedTeams.splice(1, 0, last);

    for (let matchID = 0; matchID < rotatedTeams.length / 2; matchID++) {
      let homeTeam = rotatedTeams[matchID];
      let awayTeam = rotatedTeams[rotatedTeams.length - (matchID + 1)];

      let [homeGoals, awayGoals] = GetMatch(homeTeam, awayTeam);

      standings[homeTeam.name].goalsFor += homeGoals;
      standings[homeTeam.name].goalsAgainst += awayGoals;
      standings[awayTeam.name].goalsFor += awayGoals;
      standings[awayTeam.name].goalsAgainst += homeGoals;
      standings[homeTeam.name].goalDifference =
        standings[homeTeam.name].goalsFor - standings[homeTeam.name].goalsAgainst;
      standings[awayTeam.name].goalDifference =
        standings[awayTeam.name].goalsFor - standings[awayTeam.name].goalsAgainst;

      if (homeGoals > awayGoals) {
        standings[homeTeam.name].points += 3;
      } else if (awayGoals > homeGoals) {
        standings[awayTeam.name].points += 3;
      } else {
        standings[homeTeam.name].points += 1;
        standings[awayTeam.name].points += 1;
      }

      if (playerTeam && (playerTeam.name === homeTeam.name || playerTeam.name === awayTeam.name)) {
        playerMatches += `-->${homeTeam.name} ${homeGoals} x ${awayGoals} ${awayTeam.name}`;
      }
    }

    newTeams = rotatedTeams;
  }

  let sortedStandings = Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return 0;
  });

  let table = sortedStandings.map((item) => item.team);
  let points = sortedStandings.map((item) => item.points);

  let desc = "--> Grupo " + groupNames[groupID];
  for (let i = 0; i < table.length; i++) {
    desc += `-> ${i + 1}º: ${table[i].name} (${sortedStandings[i].points} pts)`;
  }

  return { table, playerMatches, desc, points };
}

/**
 * Executa a fase de grupos de um torneio e retorna os classificados.
 * @param {Array} groups - Array de grupos (cada grupo é um array de times)
 * @param {number} topThirdCount - Quantos terceiros colocados avançam
 * @param {Function} drawFunction - Função de sorteio para o mata-mata
 * @param {Object} playerTeam - Seleção do jogador
 * @returns {{ classif, desc, playerPosition }}
 */
export function GetTournamentResults(groups, topThirdCount, drawFunction, playerTeam) {
  let desc = "";
  let firstPlaces = [];
  let secondPlaces = [];
  let thirdPlaces = [];
  let thirdPlacesPoints = [];
  let playerPosition = null;

  for (let groupID = 0; groupID < groups.length; groupID++) {
    let thisGroup = GetWorldCupPosition(
      groups[groupID],
      groups[groupID].some((t) => t.name === playerTeam.name) ? playerTeam : null,
      groupID
    );

    const possiblePlayerPosition = thisGroup.table.findIndex(
      (team) => team.name === playerTeam.name
    );

    if (possiblePlayerPosition >= 0) {
      desc = `: ${possiblePlayerPosition + 1}º lugar${thisGroup.playerMatches}${desc}`;
      playerPosition = possiblePlayerPosition;
    }

    desc += `${thisGroup.desc}`;
    firstPlaces.push(thisGroup.table[0]);
    secondPlaces.push(thisGroup.table[1]);
    thirdPlaces.push(thisGroup.table[2]);
    thirdPlacesPoints.push(thisGroup.points[2]);
  }

  let topThirdIndices = [...thirdPlacesPoints]
    .map((points, index) => ({ points, index }))
    .sort((a, b) => b.points - a.points)
    .slice(0, topThirdCount)
    .map((item) => item.index);

  let filteredThirdPlaces = thirdPlaces.map((place, index) =>
    topThirdIndices.includes(index) ? place : null
  );

  let classif = drawFunction(firstPlaces, secondPlaces, filteredThirdPlaces);
  return { classif, desc, playerPosition };
}

// ─── Sorteios de confrontos ───────────────────────────────────────────────────

/**
 * Sorteia confrontos no formato suíço (Liga dos Campeões).
 * @param {Array} teams
 * @returns {Array} lista de pares [teamName1, teamName2]
 */
export function DrawMatches(teams) {
  let errorCount = 0;

  teams.sort((a, b) => b.power - a.power);

  let pots = [shuffleArray(teams.splice(0, 9))];
  pots.push(shuffleArray(teams.splice(0, 9)));
  pots.push(shuffleArray(teams.splice(0, 9)));
  pots.push(shuffleArray(teams.splice(0, 9)));

  let matchesCount = Array.from({ length: pots.length }, () =>
    Array.from({ length: 9 }, () => Array(4).fill(0))
  );

  let matches = [];

  for (let potIndex = 0; potIndex < 4; potIndex++) {
    for (let teamIndex = 0; teamIndex < 9; teamIndex++) {
      let team = pots[potIndex][teamIndex];

      for (let oppPotIndex = 0; oppPotIndex <= potIndex; oppPotIndex++) {
        if (matchesCount[potIndex][teamIndex][oppPotIndex] >= 2) continue;

        let oppIndex1 = Math.floor(Math.random() * pots[oppPotIndex].length);
        while (
          pots[oppPotIndex][oppIndex1].name === team.name ||
          matchesCount[oppPotIndex][oppIndex1][potIndex] >= 2 ||
          (matchesCount[oppPotIndex][oppIndex1][potIndex] >= 1 &&
            matchesCount[potIndex][teamIndex][oppPotIndex] >= 1 &&
            matchesCount[oppPotIndex].find((a) => a[potIndex] === 0))
        ) {
          oppIndex1 = (oppIndex1 + 1) % pots[oppPotIndex].length;
          errorCount++;
          if (errorCount >= 1000) throw new Error("Não foi possível sortear");
        }

        matches.push([team.name, pots[oppPotIndex][oppIndex1].name]);
        matchesCount[potIndex][teamIndex][oppPotIndex] += 1;
        matchesCount[oppPotIndex][oppIndex1][potIndex] += 1;

        if (matchesCount[potIndex][teamIndex][oppPotIndex] >= 2) continue;

        let oppIndex2 = Math.floor(Math.random() * pots[oppPotIndex].length);
        while (
          oppIndex1 === oppIndex2 ||
          pots[oppPotIndex][oppIndex2].name === team.name ||
          matchesCount[oppPotIndex][oppIndex2][potIndex] >= 2 ||
          (matchesCount[oppPotIndex][oppIndex2][potIndex] >= 1 &&
            matchesCount[potIndex][teamIndex][oppPotIndex] >= 1 &&
            matchesCount[oppPotIndex].find((a) => a[potIndex] === 0))
        ) {
          oppIndex2 = (oppIndex2 + 1) % pots[oppPotIndex].length;
          errorCount++;
          if (errorCount >= 1000) throw new Error("Não foi possível sortear");
        }

        matches.push([pots[oppPotIndex][oppIndex2].name, team.name]);
        matchesCount[potIndex][teamIndex][oppPotIndex] += 1;
        matchesCount[oppPotIndex][oppIndex2][potIndex] += 1;
      }
    }
  }

  return matches;
}

/**
 * Simula a fase de grupos da Liga dos Campeões (formato suíço).
 * @param {Array} teams
 * @param {Object|null} playerTeam
 * @returns {{ table: Array, desc: string }}
 */
export function GetChampionsPosition(teams, playerTeam = null) {
  let desc = "";
  let newTeams = DeepClone(teams);
  let matches = DrawMatches(teams);

  let standings = {};
  for (let team of newTeams) {
    standings[team.name] = { team, points: 0, goalsFor: 0, goalsAgainst: 0 };
  }

  for (let match of matches) {
    let [homeName, awayName] = match;
    let home = standings[homeName];
    let away = standings[awayName];

    let result = GetMatch(home.team, away.team);
    let [homeGoals, awayGoals] = result;

    home.goalsFor += homeGoals;
    home.goalsAgainst += awayGoals;
    away.goalsFor += awayGoals;
    away.goalsAgainst += awayGoals;

    if (homeGoals > awayGoals) {
      home.points += 3;
    } else if (awayGoals > homeGoals) {
      away.points += 3;
    } else {
      home.points += 1;
      away.points += 1;
    }

    if (playerTeam && (playerTeam.name === homeName || playerTeam.name === awayName)) {
      desc += `-->${homeName} ${homeGoals} x ${awayGoals} ${awayName}`;
    }
  }

  let sortedStandings = Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffA = a.goalsFor - a.goalsAgainst;
    const diffB = b.goalsFor - b.goalsAgainst;
    if (diffB !== diffA) return diffB - diffA;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return 0;
  });

  let finalTable = sortedStandings.map((item) => item.team);

  desc += "--> Top 8";
  for (let i = 0; i < finalTable.length; i++) {
    desc += `-> ${i + 1}º: ${finalTable[i].name} (${sortedStandings[i].points} pts)`;
    if (i === 7) desc += "--> Playoffs";
    else if (i === 23) desc += "--> Eliminados";
  }

  return { table: finalTable, desc };
}

/**
 * Sorteia os grupos da Copa do Mundo (48 times, 12 grupos de 4).
 * @param {Array} teams - Times já ordenados (hosts na frente)
 * @param {number} hostsQtd - Quantidade de times-sede
 * @returns {Array} grupos
 */
export function DrawWorldGroups(teams, hostsQtd) {
  let pots = Array.from({ length: 4 }, (_, potID) => teams.slice(potID * 12, (potID + 1) * 12));
  let groups = Array.from({ length: 12 }, () => []);

  for (let GroupID = 0; GroupID < 12; GroupID++) {
    // Pot 0
    if (GroupID < hostsQtd) {
      groups[GroupID].push(pots[0][0]);
      pots[0] = pots[0].filter((n) => pots[0][0].name !== n.name);
    } else {
      let randomIndex = RandomNumber(0, pots[0].length - 1);
      groups[GroupID].push(pots[0][randomIndex]);
      pots[0] = pots[0].filter((n) => pots[0][randomIndex].name !== n.name);
    }

    // Pot 1
    let pot1validNations = pots[1].filter(
      (n) =>
        !groups[GroupID].some((opp) => opp.continent === n.continent && opp.continent !== "UEFA")
    );

    if (pot1validNations.length <= 0) {
      let found = false;
      for (let indexRetro = GroupID - 1; indexRetro >= 0; indexRetro--) {
        let retroValidNations = pots[1].filter(
          (n) => !groups[indexRetro].some((t) => t.continent === n.continent)
        );
        if (retroValidNations.length > 0) {
          let canFit = !groups[GroupID].some(
            (n) => groups[indexRetro][1].continent === n.continent
          );
          if (canFit) {
            const oldTeam = groups[indexRetro][1];
            const newTeam = retroValidNations[RandomNumber(0, retroValidNations.length - 1)];
            groups[indexRetro][1] = newTeam;
            pots[1] = pots[1].filter((n) => n.name !== newTeam.name);
            pot1validNations = [oldTeam];
            found = true;
            break;
          }
        }
      }
      if (!found) pot1validNations = pots[1];
    }

    let pot1randomIndex = RandomNumber(0, pot1validNations.length - 1);
    groups[GroupID].push(pot1validNations[pot1randomIndex]);
    pots[1] = pots[1].filter((n) => pot1validNations[pot1randomIndex].name !== n.name);

    // Pot 2
    let uefaCount = groups[GroupID].filter((t) => t.continent === "UEFA").length;
    let pot2validNations = pots[2].filter((n) => {
      if (n.continent === "UEFA") return uefaCount < 2;
      return !groups[GroupID].some((opp) => opp.continent === n.continent);
    });
    if (uefaCount <= 0 && pots[2].some((t) => t.continent === "UEFA")) {
      pot2validNations = pots[2].filter((n) => n.continent === "UEFA");
    }
    if (pot2validNations.length <= 0) {
      let found = false;
      for (let indexRetro = GroupID - 1; indexRetro >= 0; indexRetro--) {
        let retroValidNations = pots[2].filter(
          (n) => !groups[indexRetro].some((t) => t.continent === n.continent)
        );
        if (retroValidNations.length > 0) {
          let canFit = !groups[GroupID].some(
            (n) => groups[indexRetro][2].continent === n.continent
          );
          if (canFit) {
            const oldTeam = groups[indexRetro][2];
            const newTeam = retroValidNations[RandomNumber(0, retroValidNations.length - 1)];
            groups[indexRetro][2] = newTeam;
            pots[2] = pots[2].filter((n) => n.name !== newTeam.name);
            pot2validNations = [oldTeam];
            found = true;
            break;
          }
        }
      }
      if (!found) pot2validNations = pots[2];
    }
    let pot2randomIndex = RandomNumber(0, pot2validNations.length - 1);
    groups[GroupID].push(pot2validNations[pot2randomIndex]);
    pots[2] = pots[2].filter((n) => pot2validNations[pot2randomIndex].name !== n.name);

    // Pot 3
    uefaCount = groups[GroupID].filter((t) => t.continent === "UEFA").length;
    let pot3validNations = pots[3].filter((n) => {
      if (n.continent === "UEFA") return uefaCount < 2;
      return !groups[GroupID].some((opp) => opp.continent === n.continent);
    });
    if (uefaCount <= 1 && pots[3].some((t) => t.continent === "UEFA")) {
      pot3validNations = pots[3].filter((n) => n.continent === "UEFA");
    }
    if (pot3validNations.length <= 0) {
      let found = false;
      for (let indexRetro = GroupID - 1; indexRetro >= 0; indexRetro--) {
        let retroValidNations = pots[3].filter(
          (n) => !groups[indexRetro].some((t) => t.continent === n.continent)
        );
        if (retroValidNations.length > 0) {
          let canFit = !groups[GroupID].some(
            (n) => groups[indexRetro][3].continent === n.continent
          );
          if (canFit) {
            const oldTeam = groups[indexRetro][3];
            const newTeam = retroValidNations[RandomNumber(0, retroValidNations.length - 1)];
            groups[indexRetro][3] = newTeam;
            pots[3] = pots[3].filter((n) => n.name !== newTeam.name);
            pot3validNations = [oldTeam];
            found = true;
            break;
          }
        }
      }
      if (!found) pot3validNations = pots[3];
    }
    let pot3randomIndex = RandomNumber(0, pot3validNations.length - 1);
    groups[GroupID].push(pot3validNations[pot3randomIndex]);
    pots[3] = pots[3].filter((n) => pot3validNations[pot3randomIndex].name !== n.name);
  }

  return groups;
}

// ─── Mundial de Clubes ────────────────────────────────────────────────────────

/**
 * Monta os 8 grupos do Mundial de Clubes via backtracking,
 * garantindo que nenhum grupo tenha dois times do mesmo continente.
 *
 * @param {Array} pot1continents - Ordem dos continentes do pot1 (embaralhada)
 * @param {Array} pot3continents - Ordem dos continentes do pot3 (embaralhada)
 * @param {Array} pot4continents - Ordem dos continentes do pot4 (embaralhada)
 * @returns {Array|null} lista de 8 trios [cont1, cont3, cont4] ou null se impossível
 */
export function montarGrupos(pot1continents, pot3continents, pot4continents) {
  const usadosPot3 = Array(pot3continents.length).fill(false);
  const usadosPot4 = Array(pot4continents.length).fill(false);
  const grupos = [];

  function tentar(pos) {
    if (pos === pot1continents.length) return true;

    const continente1 = pot1continents[pos];

    for (let i = 0; i < pot3continents.length; i++) {
      if (usadosPot3[i]) continue;
      const continente3 = pot3continents[i];
      if (continente3 === continente1) continue;

      for (let j = 0; j < pot4continents.length; j++) {
        if (usadosPot4[j]) continue;
        const continente4 = pot4continents[j];
        if (continente4 === continente1 || continente4 === continente3) continue;

        usadosPot3[i] = true;
        usadosPot4[j] = true;
        grupos.push([continente1, continente3, continente4]);

        if (tentar(pos + 1)) return true;

        usadosPot3[i] = false;
        usadosPot4[j] = false;
        grupos.pop();
      }
    }

    return false;
  }

  return tentar(0) ? grupos : null;
}

/**
 * Seleciona os times e monta os 8 grupos do Mundial de Clubes.
 *
 * O `setUefaWinners([])` deve ser chamado no componente após esta função,
 * pois ela não tem acesso ao setState.
 *
 * @param {Object} params
 * @param {Array}  params.extrateams           - Estado atual dos times extras
 * @param {Array}  params.leagues              - Estado atual das ligas
 * @param {Array}  params.nations              - Estado atual das seleções
 * @param {Array}  params.worldCupHistoryHosts - Histórico de sedes da Copa
 * @param {Array}  params.uefaWinners          - Times vencedores da UEFA (últimas 4 edições)
 * @param {number} params.year                 - Ano atual da simulação
 * @param {Object} params.playerTeam           - Time do jogador
 * @returns {{ groups: Array, playedClubWC: boolean, extraContinent: string }}
 */
export function DrawClubWorldCupGroups({
  extrateams,
  leagues,
  nations,
  worldCupHistoryHosts,
  uefaWinners,
  year,
  playerTeam
}) {
  // ── Selecionar times por confederação ──────────────────────────────────────
  let afcConf = DeepClone(extrateams.filter((c) => c.name === "AFC")[0]);
  let afcClubs = afcConf.teams.sort((a, b) => a.power > b.power + Math.random());
  let clubWC_afc = afcClubs.splice(0, afcConf.clubWorldCupSpots);

  let cafConf = DeepClone(extrateams.filter((c) => c.name === "CAF")[0]);
  let cafClubs = cafConf.teams.sort((a, b) => a.power > b.power + Math.random());
  let clubWC_caf = cafClubs.splice(0, cafConf.clubWorldCupSpots);

  let concacafConf = DeepClone(extrateams.filter((c) => c.name === "CONCACAF")[0]);
  let concacafClubs = concacafConf.teams.sort((a, b) => a.power > b.power + Math.random());
  let clubWC_concacaf = concacafClubs.splice(0, concacafConf.clubWorldCupSpots);

  let clubWC_conmebol = [];
  let conmebolConf = DeepClone(extrateams.filter((c) => c.name === "CONMEBOL")[0]);
  let conmebolClubs = conmebolConf.teams.sort((a, b) => b.power - a.power - Math.random());
  let conmebolIndex = 0;
  while (clubWC_conmebol.length < conmebolConf.clubWorldCupSpots) {
    let club = conmebolClubs[conmebolIndex];
    if (clubWC_conmebol.filter((c) => c.country === club.country).length < 4)
      clubWC_conmebol.push(club);
    conmebolIndex++;
    if (conmebolIndex >= conmebolClubs.length) throw new Error("Não deu (CONMEBOL)");
  }

  let clubWC_ofc = DeepClone(extrateams.filter((c) => c.name === "OFC")[0].teams[0]);

  // ── UEFA: prioriza vencedores da Champions, completa por poder ─────────────
  let clubWC_uefa = [];
  for (let i = 0; i < 4; i++) {
    if (clubWC_uefa.filter((t) => t.name === uefaWinners[i].name).length > 0) continue;
    let league = leagues.filter((l) => l.country === uefaWinners[i].country)[0];
    let team = null;
    if (!league) {
      league = extrateams.filter((l) => l.name === "UEFA")[0].teams;
      team = league.filter((t) => t.name === uefaWinners[i].name)[0];
    } else {
      team = league.highestLeague.teams.filter((t) => t.name === uefaWinners[i].name)[0];
      if (!team) team = league.lowerLeague.teams.filter((t) => t.name === uefaWinners[i].name)[0];
    }
    if (!team) throw new Error(`Time não encontrado: ${uefaWinners[i].name}`);
    clubWC_uefa.push(team);
  }

  let uefaIndex = 0;
  let uefaConf = DeepClone(extrateams.filter((c) => c.name === "UEFA")[0]);
  let uefaClubs = [];
  for (let leagueID = 0; leagueID < leagues.length; leagueID++) {
    uefaClubs = uefaClubs.concat([...leagues[leagueID].highestLeague.teams]);
  }
  uefaClubs.sort((a, b) => b.power - a.power);
  while (clubWC_uefa.length < uefaConf.clubWorldCupSpots) {
    if (uefaIndex >= uefaClubs.length) throw new Error("Não deu (UEFA)");
    let club = uefaClubs[uefaIndex];
    if (
      clubWC_uefa.filter((c) => c.country === club.country).length < 2 &&
      !clubWC_uefa.some((c) => c.name === club.name)
    )
      clubWC_uefa.push(club);
    uefaIndex++;
  }

  // ── Time extra do país-sede ────────────────────────────────────────────────
  let extra = null;
  let hostCountry = worldCupHistoryHosts.find((h) => h.year === year + 1).hosts[0];
  let country = null;
  for (const conf of nations) {
    for (const team of conf.teams) {
      if (team.name === hostCountry) country = team;
    }
  }
  if (!country) throw new Error(`País-sede não encontrado: ${hostCountry}`);

  let extraContinent = country.continent;

  if (country.continent === "UEFA") {
    if (!clubWC_uefa.some((c) => c.country === hostCountry)) {
      let league = leagues.filter((l) => l.country === country.name);
      if (league.length > 0) {
        league = league[0].highestLeague.teams;
      } else {
        let extraLeague = DeepClone(extrateams.filter((l) => l.name === country.continent)[0]);
        league = extraLeague.teams.filter((t) => t.country === country.name);
      }
      league.sort((a, b) => b.power - a.power - Math.random());
      clubWC_uefa.pop();
      clubWC_uefa.push(league[0]);
    }
    let candidates = {
      AFC: afcClubs[0],
      CAF: cafClubs[0],
      CONCACAF: concacafClubs[0],
      CONMEBOL: conmebolClubs[0]
    };
    let pots = shuffleArray(["AFC", "CAF", "CONCACAF", "CONMEBOL"]);
    extraContinent = pots[0];
    extra = candidates[extraContinent];
  } else {
    let league = DeepClone(extrateams.filter((l) => l.name === country.continent)[0]);
    let validTeams = league.teams.filter((t) => t.country === country.name);
    extra = validTeams[0];
    switch (country.continent) {
      case "AFC": {
        let duplicated = clubWC_afc.filter((c) => c.name === extra.name);
        if (duplicated.length > 0) {
          clubWC_afc = clubWC_afc.filter((c) => c.name !== extra.name);
          clubWC_afc.push(afcClubs[0]);
        }
        break;
      }
      case "CAF": {
        let duplicated = clubWC_caf.filter((c) => c.name === extra.name);
        if (duplicated.length > 0) {
          clubWC_caf = clubWC_caf.filter((c) => c.name !== extra.name);
          clubWC_caf.push(cafClubs[0]);
        }
        break;
      }
      case "CONCACAF": {
        let duplicated = clubWC_concacaf.filter((c) => c.name === extra.name);
        if (duplicated.length > 0) {
          clubWC_concacaf = clubWC_concacaf.filter((c) => c.name !== extra.name);
          clubWC_concacaf.push(concacafClubs[0]);
        }
        break;
      }
      case "CONMEBOL": {
        let duplicated = clubWC_conmebol.filter((c) => c.name === extra.name);
        if (duplicated.length > 0) {
          clubWC_conmebol = clubWC_conmebol.filter((c) => c.name !== extra.name);
          clubWC_conmebol.push(conmebolClubs[0]);
        }
        break;
      }
      default:
        throw new Error("Continente do país-sede inválido");
    }
  }

  // ── Montar pots ───────────────────────────────────────────────────────────
  clubWC_uefa.sort((a, b) => b.power - a.power);
  clubWC_conmebol.sort((a, b) => b.power - a.power);

  let pot1 = {
    UEFA: shuffleArray(clubWC_uefa.splice(0, 4)),
    CONMEBOL: shuffleArray(clubWC_conmebol.splice(0, 4))
  };
  let pot2 = {
    UEFA: shuffleArray(clubWC_uefa)
  };
  let pot3 = {
    CONMEBOL: shuffleArray(clubWC_conmebol),
    AFC: shuffleArray(clubWC_afc.splice(0, 2)),
    CAF: shuffleArray(clubWC_caf.splice(0, 2)),
    CONCACAF: shuffleArray(clubWC_concacaf.splice(0, 2))
  };
  let pot4 = {
    AFC: shuffleArray(clubWC_afc),
    CAF: shuffleArray(clubWC_caf),
    CONCACAF: shuffleArray(clubWC_concacaf),
    OFC: [clubWC_ofc],
    CONMEBOL: [],
    UEFA: []
  };
  pot4[extraContinent].push(extra);

  const playedClubWC = [pot1, pot2, pot3, pot4].some((pot) =>
    Object.values(pot).some((conf) => conf.some((club) => club.name === playerTeam.name))
  );

  // ── Sorteio dos grupos ─────────────────────────────────────────────────────
  const resultado = montarGrupos(
    shuffleArray(["UEFA", "CONMEBOL", "UEFA", "CONMEBOL", "UEFA", "CONMEBOL", "UEFA", "CONMEBOL"]),
    shuffleArray(["CONMEBOL", "CONMEBOL", "AFC", "AFC", "CAF", "CAF", "CONCACAF", "CONCACAF"]),
    shuffleArray(["OFC", extraContinent, "AFC", "AFC", "CAF", "CAF", "CONCACAF", "CONCACAF"])
  );

  if (!resultado) throw new Error("Não foi possível montar os grupos do Mundial de Clubes");

  let groups = [[], [], [], [], [], [], [], []];
  for (let i = 0; i < 8; i++) {
    let pot1club = pot1[resultado[i][0]].shift();
    groups[i].push(pot1club);

    let index = 0;
    let pot2club = pot2.UEFA[index];
    while (pot1club.country === pot2club.country) {
      index++;
      if (index >= pot2.UEFA.length) break;
      pot2club = pot2.UEFA[index];
    }
    if (pot1club.country === pot2club.country) {
      // Tenta trocar com um grupo já sorteado
      let trocou = false;
      for (let k = i - 1; k >= 0; k--) {
        const candidato = groups[k][1];
        if (candidato.country !== pot1club.country && groups[k][0].country !== pot2club.country) {
          groups[k][1] = pot2club; // coloca o conflitante no grupo anterior
          pot2club = candidato; // pega o do grupo anterior
          const selectedName = pot2club.name;
          pot2.UEFA = pot2.UEFA.filter((c) => c.name !== selectedName);
          trocou = true;
          break;
        }
      }
      if (!trocou) {
        // fallback: usa o primeiro disponível mesmo com conflito de país
        pot2club = pot2.UEFA[0];
      }
    }

    pot2.UEFA = pot2.UEFA.filter((c) => c.name !== pot2club.name);
    groups[i].push(pot2club);

    groups[i].push(pot3[resultado[i][1]].shift());
    groups[i].push(pot4[resultado[i][2]].shift());
  }

  return { groups, playedClubWC, extraContinent };
}
