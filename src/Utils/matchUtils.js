/**
 * matchUtils.js
 * Funções puras de simulação de partidas.
 * Não dependem de estado externo — recebem tudo via parâmetros.
 */

/**
 * Simula um jogo normal entre dois times.
 * @param {Object} team1
 * @param {Object} team2
 * @returns {[number, number]} [golsTeam1, golsTeam2]
 */
function poisson(lambda) {
	let L = Math.exp(-lambda), k = 0, p = 1;
	do {
		k++;
		p *= Math.random();
	} while (p > L);
	return k - 1;
}

export function GetMatch(team1, team2) {
	let base = Math.pow(team1.power, 2) + Math.pow(team2.power, 2);

	let team1Power = Math.pow(team1.power, 2) / base;
	let team2Power = Math.pow(team2.power, 2) / base;

	// média total de gols da partida
	let totalGoals = 2.5;

	// média esperada de gols de cada time
	let team1Lambda = totalGoals * team1Power;
	let team2Lambda = totalGoals * team2Power;

	// evita lambda muito baixo demais
	if (team1Lambda < 0.1) team1Lambda = 0.1;
	if (team2Lambda < 0.1) team2Lambda = 0.1;

	let team1Score = poisson(team1Lambda);
	let team2Score = poisson(team2Lambda);

	return [team1Score, team2Score];
}

/**
 * Simula prorrogação entre dois times.
 * @param {Object} team1
 * @param {Object} team2
 * @returns {[number, number]} [golsTeam1, golsTeam2]
 */
export function GetExtraTime(team1, team2) {
	let base = Math.pow(team1.power, 2) + Math.pow(team2.power, 2);

	let team1Power = Math.pow(team1.power, 2) / base;
	let team2Power = Math.pow(team2.power, 2) / base;

	// prorrogação tem menos gols
	let totalGoals = 0.8;

	// média esperada de gols
	let team1Lambda = totalGoals * team1Power;
	let team2Lambda = totalGoals * team2Power;

	// evita lambda muito baixo
	if (team1Lambda < 0.05) team1Lambda = 0.05;
	if (team2Lambda < 0.05) team2Lambda = 0.05;

	let team1Score = poisson(team1Lambda);
	let team2Score = poisson(team2Lambda);

	return [team1Score, team2Score];
}

/**
 * Simula disputa de pênaltis entre dois times.
 * @param {Object} team1
 * @param {Object} team2
 * @returns {[number, number]} [golsTeam1, golsTeam2]
 */
function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

function penaltyChance(teamPower, opponentPower) {
	const total = teamPower + opponentPower;
	const strength = total > 0 ? teamPower / total : 0.5;

	// taxa base de conversão em pênaltis
	const baseChance = 0.75;

	// ajuste pela força relativa do time
	const chance = baseChance + (strength - 0.5) * 0.18;

	return clamp(chance, 0.55, 0.9);
}

function isDecided(team1Goals, team2Goals, team1ShotsLeft, team2ShotsLeft) {
	return (
		team1Goals > team2Goals + team2ShotsLeft ||
		team2Goals > team1Goals + team1ShotsLeft
	);
}

export function GetPenalties(team1, team2) {
	const base = Math.pow(team1.power, 2) + Math.pow(team2.power, 2);

	const team1Power = Math.pow(team1.power, 2) / base;
	const team2Power = Math.pow(team2.power, 2) / base;

	const team1Chance = penaltyChance(team1Power, team2Power);
	const team2Chance = penaltyChance(team2Power, team1Power);

	let team1Goals = 0;
	let team2Goals = 0;

	for (let round = 1; round <= 5; round++) {
		if (Math.random() < team1Chance) team1Goals++;

		// depois da cobrança do time1, o time2 ainda tem a cobrança da rodada + as futuras
		if (isDecided(team1Goals, team2Goals, 5 - round, 6 - round)) break;

		if (Math.random() < team2Chance) team2Goals++;

		// depois da cobrança do time2, ambos têm o mesmo número de cobranças restantes
		if (isDecided(team1Goals, team2Goals, 5 - round, 5 - round)) break;
	}

	while (team1Goals === team2Goals) {
		if (Math.random() < team1Chance) team1Goals++;
		if (Math.random() < team2Chance) team2Goals++;
	}

	return [team1Goals, team2Goals];
}
/**
 * Simula um confronto eliminatório completo (ida e volta ou jogo único),
 * com prorrogação e pênaltis se necessário.
 * @param {Object} team1
 * @param {Object} team2
 * @param {boolean} ida_e_volta
 * @returns {{ result: boolean, game: string }}
 */
export function GetKnockoutResult(team1, team2, ida_e_volta) {
	let gameDesc = "";

	let game = GetMatch(team1, team2);
	let teamGoals1 = game[0];
	let teamGoals2 = game[1];

	if (ida_e_volta) {
		gameDesc = `->${team1.name} ${teamGoals1} x ${teamGoals2} ${team2.name}`;

		let game2 = GetMatch(team2, team1);
		teamGoals1 += game2[1];
		teamGoals2 += game2[0];

		if (teamGoals1 === teamGoals2) {
			let extra = GetExtraTime(team2, team1);
			teamGoals1 += extra[1];
			teamGoals2 += extra[0];

			if (teamGoals1 === teamGoals2) {
				let penalties = GetPenalties(team2, team1);
				gameDesc += `->${team2.name} ${game2[0] + extra[0]} (${penalties[0]}) x (${
					penalties[1]
				}) ${game2[1] + extra[1]} ${team1.name}`;
				gameDesc = `${team1.name} ${teamGoals1} (${penalties[1]}) x (${penalties[0]}) ${teamGoals2} ${team2.name}${gameDesc}`;
				teamGoals1 += penalties[1];
				teamGoals2 += penalties[0];
			} else {
				gameDesc += `->${team2.name} ${game2[0] + extra[0]} x ${game2[1] + extra[1]} ${
					team1.name
				} (Pr)`;
				gameDesc = `${team1.name} ${game[0] + game2[1] + extra[1]} x ${
					game[1] + game2[0] + extra[0]
				} ${team2.name} (Pr)${gameDesc}`;
			}
		} else {
			gameDesc += `->${team2.name} ${game2[0]} x ${game2[1]} ${team1.name}`;
			gameDesc = `${team1.name} ${game[0] + game2[1]} x ${game[1] + game2[0]} ${
				team2.name
			}${gameDesc}`;
		}
	} else if (teamGoals1 === teamGoals2) {
		let extra = GetExtraTime(team1, team2);
		teamGoals1 += extra[0];
		teamGoals2 += extra[1];

		if (teamGoals1 === teamGoals2) {
			let penalties = GetPenalties(team1, team2);
			gameDesc = `${team1.name} ${teamGoals1} (${penalties[0]}) x (${penalties[1]}) ${teamGoals2} ${team2.name}`;
			teamGoals1 += penalties[0];
			teamGoals2 += penalties[1];
		} else {
			gameDesc = `${team1.name} ${teamGoals1} x ${teamGoals2} ${team2.name} (Pr)`;
		}
	} else {
		gameDesc = `${team1.name} ${teamGoals1} x ${teamGoals2} ${team2.name}`;
	}

	return { result: teamGoals1 > teamGoals2, game: gameDesc };
}
