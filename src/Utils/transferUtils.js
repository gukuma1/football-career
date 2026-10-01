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

  const ageFactor = Math.max(0.5, 8.0 - Math.abs(peak - 4 - age) * 0.6); // pico entre 22–26

  const clubMultiplier = clubPower / 4; // 0.5 em poder 2, 2.5 em poder 10

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
export function GetInitTeams(newTeams, currentPlayer, extrateams = []) {
  let allTeams = newTeams.reduce((acc, liga) => acc.concat(liga.highestLeague.teams), []);
  allTeams = allTeams.concat(extrateams.flatMap((conf) => conf.teams));

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
      duration: RandomNumber(2, 5),
      loan: false,
      position: newPosition
    };
  });
}

function getAllTeams(leagues, extrateams) {
  const leagueTeams = leagues.reduce((acc, liga) => acc.concat(liga.highestLeague.teams), []);
  return leagueTeams.concat(extrateams.flatMap((conf) => conf.teams));
}

function getExtraTeamNames(extrateams) {
  return new Set(
    extrateams
      .filter((conf) => conf.name !== "UEFA")
      .flatMap((conf) => conf.teams.map((team) => team.name))
  );
}

function getExtraTeamOfferChance(currentPlayer) {
  const age = currentPlayer.age;
  const peak = currentPlayer.position.peak;
  const PRIME_CHANCE = 0.0;
  const PRIME_WINDOW = 2;
  const YOUNG_MAX = 0.2;
  const YOUNG_SLOPE = 0.05;
  const VET_MAX = 0.6;
  const VET_SLOPE = 0.15;
  const primeStart = peak - PRIME_WINDOW * 2;
  const primeEnd = peak + PRIME_WINDOW;

  if (age < primeStart) {
    return Math.min(YOUNG_MAX, PRIME_CHANCE + (primeStart - age) * YOUNG_SLOPE);
  }
  if (age <= primeEnd) return PRIME_CHANCE;
  return Math.min(VET_MAX, PRIME_CHANCE + (age - primeEnd) * VET_SLOPE);
}

function selectTeams(teams, extraTeamNames, extraTeamOfferChance) {
  const availableExtraTeams = teams.filter((team) => extraTeamNames.has(team.name));
  const availableLeagueTeams = teams.filter((team) => !extraTeamNames.has(team.name));
  const selectedTeams = [];

  while (selectedTeams.length < 3 && (availableExtraTeams.length || availableLeagueTeams.length)) {
    const prefersExtraTeam = Math.random() < extraTeamOfferChance;
    const preferredTeams = prefersExtraTeam ? availableExtraTeams : availableLeagueTeams;
    const fallbackTeams = prefersExtraTeam ? availableLeagueTeams : availableExtraTeams;
    const availableTeams = preferredTeams.length > 0 ? preferredTeams : fallbackTeams;
    const teamIndex = Math.floor(Math.random() * availableTeams.length);
    selectedTeams.push(availableTeams.splice(teamIndex, 1)[0]);
  }

  return selectedTeams;
}

function createContracts(currentPlayer, teams, loan = false) {
  return teams.map((team) => {
    let newPosition;
    if (currentPlayer.position.abbreviation !== "GO" && Math.random() < 0.2) {
      const relatedPositions = currentPlayer.position.related;
      newPosition = relatedPositions[RandomNumber(0, relatedPositions.length - 1)];
    } else {
      newPosition = currentPlayer.position.abbreviation;
    }

    let duration = loan ? RandomNumber(1, 2) : RandomNumber(1, 4);
    if (!loan && currentPlayer.age <= currentPlayer.position.peak + 2) {
      duration += RandomNumber(1, 2);
    }

    return { team, duration, loan, position: newPosition };
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
export function GetNewTeams(
  currentPlayer,
  leagues,
  history,
  currentSeasonPerformance,
  extrateams = []
) {
  const allTeams = getAllTeams(leagues, extrateams);
  const previousTeamNames = new Set(history.map((team) => team.team));
  const eligibleTeams = allTeams.filter((team) => !previousTeamNames.has(team.name));
  const extraTeamNames = getExtraTeamNames(extrateams);
  const age = currentPlayer.age;
  const currentPower = currentPlayer.team.power;
  const boundary = currentPower + (age <= currentPlayer.position.peak ? -2 : 1);
  const isWithinPowerLimit =
    age <= currentPlayer.position.peak
      ? (team) => team.power > boundary
      : (team) => team.power < boundary;

  const shortlist = [...allTeams]
    .sort((a, b) => b.power - a.power - Math.random())
    .slice(0, allTeams.length / (4 + currentPlayer.performance));
  const preferredTeams = shortlist.filter(
    (team) => !previousTeamNames.has(team.name) && isWithinPowerLimit(team)
  );
  const selectedTeams = selectTeams(
    preferredTeams,
    extraTeamNames,
    getExtraTeamOfferChance(currentPlayer)
  );
  const selectedNames = new Set(selectedTeams.map((team) => team.name));
  const remainingPreferredTeams = eligibleTeams.filter(
    (team) => isWithinPowerLimit(team) && !selectedNames.has(team.name)
  );
  selectedTeams.push(
    ...selectTeams(
      remainingPreferredTeams,
      extraTeamNames,
      getExtraTeamOfferChance(currentPlayer)
    ).slice(0, 3 - selectedTeams.length)
  );

  if (selectedTeams.length < 3) {
    const selectedNames = new Set(selectedTeams.map((team) => team.name));
    const fallbackTeams = eligibleTeams
      .filter((team) => !selectedNames.has(team.name))
      .sort((a, b) => Math.abs(a.power - boundary) - Math.abs(b.power - boundary));
    selectedTeams.push(...fallbackTeams.slice(0, 3 - selectedTeams.length));
  }

  // Evolução do valor base — retornado para que o componente atualize player.baseValue
  const newBaseValue = Math.floor(
    currentPlayer.baseValue * Math.exp(currentSeasonPerformance * 0.1)
  );

  return { contracts: createContracts(currentPlayer, selectedTeams), newBaseValue };
}

export function GetLoanTeams(currentPlayer, leagues, history, extrateams = []) {
  const allTeams = getAllTeams(leagues, extrateams);
  const previousTeamNames = new Set(history.map((team) => team.team));
  const currentPower = currentPlayer.team.power;
  const eligibleTeams = allTeams.filter(
    (team) => !previousTeamNames.has(team.name) && team.name !== currentPlayer.team.name
  );
  const weakerTeams = eligibleTeams.filter((team) => team.power < currentPower);

  if (weakerTeams.length === 0) return [];

  const extraTeamNames = getExtraTeamNames(extrateams);
  const selectedTeams = selectTeams(
    weakerTeams,
    extraTeamNames,
    getExtraTeamOfferChance(currentPlayer)
  );

  if (selectedTeams.length < 3) {
    const selectedNames = new Set(selectedTeams.map((team) => team.name));
    const fallbackTeams = eligibleTeams
      .filter((team) => !selectedNames.has(team.name))
      .sort((a, b) => Math.abs(a.power - currentPower) - Math.abs(b.power - currentPower));
    selectedTeams.push(...fallbackTeams.slice(0, 3 - selectedTeams.length));
  }

  return createContracts(currentPlayer, selectedTeams, true);
}
