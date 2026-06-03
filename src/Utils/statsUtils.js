/**
 * statsUtils.js
 * Funções puras de cálculo de evolução de poder dos times e seleções.
 *
 * Estas funções NÃO chamam setState — elas recebem os dados atuais,
 * calculam os novos valores e os retornam. Cabe ao componente (App.js)
 * chamar setLeagues / setExtraTeams / setNations com os resultados.
 *
 * Exemplo de uso em App.js:
 *
 *   function UpdateTeamsStats(limit) {
 *     const result = computeTeamsStats(leagues, limit);
 *     setLeagues(result.newTeams);
 *     return result;
 *   }
 */

import { DeepClone, shuffleArray } from "../Utils";

/**
 * Recalcula o poder de todos os times das ligas principais e secundárias
 *
 * @param {Array}  leagues - Estado atual das ligas
 * @param {number} limit   - Amplitude máxima de variação (ex: 20.0 ou 40.0)
 * @returns {{ newTeams: Array, topGains: Array, topLosses: Array }}
 */
export function computeTeamsStats(leagues, limit) {
  let newTeams = DeepClone([...leagues]);
  let gains = [];
  let losses = [];

  for (let leagueID = 0; leagueID < newTeams.length; leagueID++) {
    let last = Math.random();

    // Liga principal
    let topTeams = newTeams[leagueID].highestLeague.teams;
    let topTeamIndices = shuffleArray(Array.from({ length: topTeams.length }, (_, i) => i));

    for (let i = 0; i < topTeams.length; i++) {
      let teamID = topTeamIndices[i];
      let team = topTeams[teamID];

      let current = Math.random();
      let change = Math.round(limit * (last - current)) / 100.0;
      last = current;

      let originalPower = team.power;
      team.power = Math.round(100.0 * (team.power + change)) / 100;
      if (team.power > 10) team.power = 10;
      else if (team.power < 2) team.power = 2;

      let powerChange = team.power - originalPower;
      if (powerChange > 0) gains.push({ team: team.name, change: powerChange });
      else if (powerChange < 0) losses.push({ team: team.name, change: powerChange });
    }

    topTeams.sort((a, b) => b.power - a.power);

    // Liga secundária
    let lowerTeams = newTeams[leagueID].lowerLeague.teams;
    let lowerTeamIndices = shuffleArray(Array.from({ length: lowerTeams.length }, (_, i) => i));

    for (let i = 0; i < lowerTeams.length; i++) {
      let teamID = lowerTeamIndices[i];
      let team = lowerTeams[teamID];

      let current = Math.random();
      let change = Math.round(limit * (last - current)) / 100.0;
      last = current;

      let originalPower = team.power;
      team.power = Math.round(100.0 * (team.power + change)) / 100;
      if (team.power > 10) team.power = 10;
      else if (team.power < 2) team.power = 2;

      let powerChange = team.power - originalPower;
      if (powerChange > 0) gains.push({ team: team.name, change: powerChange });
      else if (powerChange < 0) losses.push({ team: team.name, change: powerChange });
    }

    lowerTeams.sort((a, b) => b.power - a.power);
  }

  gains.sort((a, b) => b.change - a.change);
  losses.sort((a, b) => a.change - b.change);

  return {
    newTeams,
    topGains: gains.slice(0, 10),
    topLosses: losses.slice(0, 10)
  };
}

/**
 * Recalcula o poder dos times extras (fora das ligas principais).
 *
 * @param {Array} extrateams - Estado atual dos times extras
 * @returns {Array} nova lista de times extras atualizada
 */
export function computeExtraTeamsStats(extrateams) {
  let newTeams = DeepClone([...extrateams]);

  for (let confID = 0; confID < newTeams.length; confID++) {
    let last = Math.random();
    let teamIndices = shuffleArray(
      Array.from({ length: newTeams[confID].teams.length }, (_, index) => index)
    );

    for (let i = 0; i < newTeams[confID].teams.length; i++) {
      let teamID = teamIndices[i];

      let current = Math.random();
      let change = Math.round(20.0 * (last - current)) / 100.0;
      last = current;

      let newPower = newTeams[confID].teams[teamID].power + change;
      newTeams[confID].teams[teamID].power = Math.round(100.0 * newPower) / 100.0;

      if (newTeams[confID].teams[teamID].power > 10) newTeams[confID].teams[teamID].power = 10;
      else if (newTeams[confID].teams[teamID].power < 2) newTeams[confID].teams[teamID].power = 2;
    }

    newTeams[confID].teams.sort((a, b) => b.power - a.power);
  }

  return newTeams;
}

/**
 * Recalcula o poder de todas as seleções nacionais.
 *
 * @param {Array} nations - Estado atual das seleções
 * @returns {{ allNations: Array, topGains: Array, topLosses: Array }}
 */
export function computeNationsStats(nations) {
  let allNations = DeepClone([...nations]);
  let gains = [];
  let losses = [];

  for (let regionID = 0; regionID < allNations.length; regionID++) {
    let last = Math.random();
    let nationIndices = shuffleArray(
      Array.from({ length: allNations[regionID].teams.length }, (_, index) => index)
    );

    for (let i = 0; i < allNations[regionID].teams.length; i++) {
      let nationID = nationIndices[i];
      let nation = allNations[regionID].teams[nationID];

      let current = Math.random();
      let change = Math.round(40.0 * (last - current)) / 100.0;
      last = current;

      let originalPower = nation.power;
      nation.power = Math.round(100.0 * (nation.power + change)) / 100.0;
      if (nation.power > 10) nation.power = 10;
      else if (nation.power < 2) nation.power = 2;

      let powerChange = nation.power - originalPower;
      if (powerChange > 0) gains.push({ nation: nation.name, change: powerChange });
      else if (powerChange < 0) losses.push({ nation: nation.name, change: powerChange });
    }

    allNations[regionID].teams.sort((a, b) => b.power - a.power);
  }

  gains.sort((a, b) => b.change - a.change);
  losses.sort((a, b) => a.change - b.change);

  return {
    allNations,
    topGains: gains.slice(0, 10),
    topLosses: losses.slice(0, 10)
  };
}
