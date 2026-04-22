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
export function GetMatch(team1, team2) {
	let base = Math.pow(team1.power, 2) + Math.pow(team2.power, 2);
	let team1Power = Math.pow(team1.power, 2) / base;
	let team2Power = Math.pow(team2.power, 2) / base;

	let team1Luck = 3 * (Math.random() + Math.random()) * (Math.random() + Math.random());
	let team2Luck = 3 * (Math.random() + Math.random()) * (Math.random() + Math.random());

	let team1Score = Math.floor(team1Luck * team1Power);
	let team2Score = Math.floor(team2Luck * team2Power);

	if (team1Score < 0) team1Score = 0;
	if (team2Score < 0) team2Score = 0;

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

	let team1Luck = 3 * (Math.random() + Math.random());
	let team2Luck = 3 * (Math.random() + Math.random());

	let team1Score = Math.floor(team1Luck * team1Power);
	let team2Score = Math.floor(team2Luck * team2Power);

	if (team1Score < 0) team1Score = 0;
	if (team2Score < 0) team2Score = 0;

	return [team1Score, team2Score];
}

/**
 * Simula disputa de pênaltis entre dois times.
 * @param {Object} team1
 * @param {Object} team2
 * @returns {[number, number]} [golsTeam1, golsTeam2]
 */
export function GetPenalties(team1, team2) {
	let base = Math.pow(team1.power, 2) + Math.pow(team2.power, 2);
	let team1Power = Math.pow(team1.power, 2) / base;
	let team2Power = Math.pow(team2.power, 2) / base;

	let winner = false;
	let team1goals = 0;
	let team2goals = 0;
	let count = 0;

	while (!winner) {
		count++;
		let team1shooter = Math.random() * team1Power * 10;
		let team2keeper = Math.random() * team2Power * 6;

		if (team1shooter > team2keeper) team1goals++;

		if (count <= 5 && Math.abs(team1goals - team2goals) > 6 - count) {
			winner = true;
			break;
		}

		let team2shooter = Math.random() * team2Power * 100;
		let team1keeper = Math.random() * team1Power * 80;

		if (team2shooter > team1keeper) team2goals++;

		if (
			(count > 5 && team1goals !== team2goals) ||
			(count <= 5 && Math.abs(team1goals - team2goals) > 5 - count)
		) {
			winner = true;
		}
	}

	return [team1goals, team2goals];
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
