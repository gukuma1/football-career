/**
 * transferUtils.js
 * Funções relacionadas a transferências, contratos e valor de mercado.
 * Todas recebem os dados que precisam via parâmetros — sem acesso direto ao estado.
 */

import { RandomNumber } from "../Utils";

/**
 * Calcula o valor de mercado de um jogador.
 *
 * ATENÇÃO: o parâmetro `baseValue` substitui o antigo acesso direto a `player.baseValue`.
 * Passe `player.baseValue` explicitamente ao chamar esta função.
 *
 * @param {number} performance       - Performance atual (-1 a +1)
 * @param {number} positionMultiplier - Multiplicador da posição
 * @param {number} age               - Idade do jogador
 * @param {number} peak              - Idade de pico da posição
 * @param {number} clubPower         - Poder do clube (2–10)
 * @param {number} fame              - Fama acumulada
 * @param {number} baseValue         - Valor base do jogador (player.baseValue)
 * @returns {number}
 */
export function GetTransferValue(
  performance,
  positionMultiplier,
  age,
  peak,
  clubPower,
  fame,
  baseValue
) {
  const performanceMultiplier = 1.5 + performance / 2; // 1.0 em -1, 2.0 em +1

  const ageFactor = Math.max(1, 8.0 - Math.abs(peak - 4 - age) * 0.5); // pico entre 22–26

  const clubMultiplier = clubPower / 5; // 0.4 em poder 2, 2.0 em poder 10

  const fameMultiplier = Math.max(fame, 100) / ((age - 10) * 10);

  const transferValue =
    positionMultiplier *
    baseValue *
    performanceMultiplier *
    ageFactor *
    clubMultiplier *
    fameMultiplier;

  return Math.round(transferValue);
}

/**
 * Gera as 3 propostas iniciais de contrato (início de carreira).
 *
 * @param {Array}  newTeams       - Ligas com times atualizados
 * @param {Object} currentPlayer  - Objeto do jogador
 * @returns {Array} lista de até 3 contratos
 */
export function GetInitTeams(newTeams, currentPlayer) {
  let allTeams = newTeams.reduce((acc, liga) => acc.concat(liga.highestLeague.teams), []);

  allTeams.sort((a, b) => b.power - a.power - Math.random());
  allTeams = allTeams.slice(0, allTeams.length / 2);

  const selectedTeams = [];
  const usedIndices = new Set();

  while (selectedTeams.length < 3) {
    const randomIndex = Math.floor(Math.random() * allTeams.length);
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex);
      selectedTeams.push(allTeams[randomIndex]);
    }
  }

  return selectedTeams.map((team) => {
    let newPosition;
    if (currentPlayer.position.abbreviation !== "GO" && Math.random() < 0.2) {
      const relatedPositions = currentPlayer.position.related;
      newPosition = relatedPositions[RandomNumber(0, relatedPositions.length - 1)];
    } else {
      newPosition = currentPlayer.position.abbreviation;
    }

    return {
      team,
      duration: RandomNumber(1, 4),
      loan: false,
      position: newPosition
    };
  });
}

/**
 * Gera as 3 propostas de transferência para a temporada atual.
 *
 * ATENÇÃO: os parâmetros `leagues`, `history` e `currentSeasonPerformance` substituem
 * os acessos diretos a estado dentro do componente.
 * Passe `leagues`, `history` e `currentSeason.performance` ao chamar.
 *
 * Lembre-se de atualizar `player.baseValue` no componente após a chamada,
 * usando o valor retornado em `newBaseValue`.
 *
 * @param {Object} currentPlayer           - Objeto do jogador
 * @param {Array}  leagues                 - Estado atual das ligas
 * @param {Array}  history                 - Histórico de times do jogador
 * @param {number} currentSeasonPerformance - Performance da temporada atual
 * @returns {{ contracts: Array, newBaseValue: number }}
 */
export function GetNewTeams(currentPlayer, leagues, history, currentSeasonPerformance) {
  let allTeams = leagues.reduce((acc, liga) => acc.concat(liga.highestLeague.teams), []);

  allTeams.sort((a, b) => b.power - a.power - Math.random());
  allTeams = allTeams.slice(0, allTeams.length / (4 + currentPlayer.performance));

  const interestedTeams = [];
  const isDuplicate = (teamName) => history.some((t) => t.team === teamName);

  for (let i = 0; i < 3; i++) {
    let teamID = RandomNumber(0, allTeams.length - 1);

    while (isDuplicate(allTeams[teamID].name)) {
      teamID = RandomNumber(0, allTeams.length - 1);
    }

    while (isDuplicate(allTeams[teamID].name)) {
      teamID = RandomNumber(0, allTeams.length - 1);
    }

    const chosenTeam = allTeams[teamID];
    interestedTeams.push(chosenTeam);
    allTeams = allTeams.filter((t) => t.name !== chosenTeam.name);
  }

  // Evolução do valor base — retornado para que o componente atualize player.baseValue
  const newBaseValue = Math.floor(
    currentPlayer.baseValue * Math.exp(currentSeasonPerformance * 0.1)
  );

  const contracts = [];

  for (let index = 0; index < 3; index++) {
    const team = interestedTeams[index];
    if (team) {
      let newPosition;
      if (currentPlayer.position.abbreviation !== "GO" && Math.random() < 0.2) {
        const relatedPositions = currentPlayer.position.related;
        newPosition = relatedPositions[RandomNumber(0, relatedPositions.length - 1)];
      } else {
        newPosition = currentPlayer.position.abbreviation;
      }

      let duration = RandomNumber(1, 4);
      duration += currentPlayer.age <= 28 ? RandomNumber(1, 2) : 0;

      contracts.push({ team, duration, loan: false, position: newPosition });
    } else {
      contracts.push(null);
    }
  }

  return { contracts, newBaseValue };
}
