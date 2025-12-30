import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import WorldCupHistoryHosts from "./Database/worldCupLastHosts.json";
import Leagues from "./Database/leagues.json";
import ExtraTeams from "./Database/extrateams.json";
import Nations from "./Database/nations.json";
import Positions from "./Database/positions.json";
import ChartComponent from "./Components/chartComponent";
import Season from "./Components/season";
import { RandomNumber, DeepClone, shuffleArray, weightedAverage } from "./Utils";

const StarPath = [
	"Esquecido", //0
	"Ruim", //100
	"Não Foi", //200
	"Ok", //300
	"Bom", //400
	"Ótimo", //500
	"Deixou sua marca", //600
	"Estrela", //700
	"Ídolo", //800
	"Lenda", //900
	"GOAT", //1000
];

const TournamentPath = [
	"Grupos",
	"Playoffs",
	"Oitavas",
	"Quartas",
	"Semi-finais",
	"Final",
	"Vencedor",
];

function App() {
	const [worldCupHistoryHosts, setWorldCupHistoryHosts] = useState([...WorldCupHistoryHosts]);
	const [leagues, setLeagues] = useState([...Leagues]);
	const [extrateams, setExtraTeams] = useState([...ExtraTeams]);
	const [nations, setNations] = useState([...Nations]);

	const [seasons, setSeasons] = useState([]);

	const parentRef = useRef(null);
	useEffect(() => {
		const parent = parentRef.current;
		if (!parent) return;

		const target = parent.lastElementChild;
		if (target)
			target.scrollIntoView({
				alignToTop: true,
				behavior: "smooth",
				block: "start",
				inline: "center",
			});
	}, [seasons]);

	const [currentSeason, setCurrentSeason] = useState({
		year: null,
		top10: null,
		topNations: null,
		topGains: null,
		topLoss: null,
		topNationsGains: null,
		topNationsLoss: null,
		age: null,
		positionInClub: null,
		team: null,
		starting: null,
		subbed: null,
		titles: null,
		goals: null,
		assists: null,
		performance: null,
		awardPoints: null,
		leagueTable: null,
		fame: null,
		marketValue: null,
	});

	const [player] = useState({
		age: 17,
		nation: null,
		team: null,
		contractTeam: null,
		position: null,
		positionInClub: null,
		performance: 0,
		totalGoals: 0,
		totalAssists: 0,
		leagueTitles: [],
		nationalCup: [],
		champions: [],
		clubWorldCup: [],
		continentalChampionship: [],
		worldCup: [],
		awards: [],
		playerOfTheSeason: [],
		championsQualification: false,
		lastLeaguePosition: 0,
		fame: 0,
		marketValue: 1,
		baseValue: 1000000,
	});

	const [lastLeagueResults, setLastLeagueResults] = useState([]);

	const [history, setHistory] = useState([]);

	const [year, setYear] = useState(new Date().getFullYear());

	const [contract, setContract] = useState(0);

	const [generalPerformance, setGeneralPerformance] = useState([]);

	const [transfers, setTransfers] = useState([]);

	const [uefaWinners, setUefaWinners] = useState([]);

	const [renew, setRenew] = useState({ duration: 0, addition: null, position: null });

	function ChooseNation() {
		const continentDropdown = document.getElementById("continent-dropdown");
		const nationDropdown = document.getElementById("nation-dropdown");

		// Find the selected continent
		const selectedContinent = nations.find(
			(continent) => continent.name === continentDropdown.value
		);

		// Find the selected nation within the chosen continent
		const selectedNation = selectedContinent
			? selectedContinent.teams.find((nation) => nation.name === nationDropdown.value)
			: null;

		// Check if both the continent and nation are selected
		if (selectedContinent && selectedNation) {
			// Change display
			document.getElementById("init-pos").style.display = "flex";
			document.getElementById("init-nation").style.display = "none";

			// Create a new player object with the selected nation
			player.nation = selectedNation;
		} else {
			alert("Selecione um País.");
		}
	}

	function updateNationDropdown() {
		const continentDropdown = document.getElementById("continent-dropdown");
		const nationDropdown = document.getElementById("nation-dropdown");
		const selectedContinent = continentDropdown.value;

		// Clear previous nations
		nationDropdown.innerHTML = '<option value="">Selecione uma Nação</option>';

		// Find nations for the selected continent
		const continentData = nations.find((cont) => cont.name === selectedContinent);
		if (continentData) {
			continentData.teams.forEach((team) => {
				const option = document.createElement("option");
				option.value = team.name;
				option.textContent = team.name;
				nationDropdown.appendChild(option);
			});
		}
	}

	function ChoosePos() {
		// Get the selected position
		const positionDropdown = document.getElementById("position-select");
		const selectedPosition = Positions.find(
			(position) => position.title === positionDropdown.value
		);

		// Change display
		document.getElementById("team-choice").style.display = "flex";
		document.getElementById("init-pos").style.display = "none";

		player.position = selectedPosition; // Assign the selected position

		let newTeams = UpdateTeamsStats(20.0).newTeams;

		let leagueResults = newTeams.map((league) => {
			const result = GetLeaguePosition(shuffleArray(league.highestLeague.teams));

			const table = result.sortedTeams;

			const rebaixados = table.slice(-league.demotions);
			const promovidos = league.lowerLeague.teams
				.sort((a, b) => {
					return b.power - a.power - Math.random();
				})
				.slice(0, league.demotions);

			const rebaixadosNomes = rebaixados.map((t) => t.name);
			const promovidosNomes = promovidos.map((t) => t.name);

			// Realiza o rebaixamento
			league.highestLeague.teams = league.highestLeague.teams
				.filter((team) => !rebaixadosNomes.includes(team.name))
				.concat(promovidos);

			// Realiza a promoção inversa
			league.lowerLeague.teams = league.lowerLeague.teams
				.filter((team) => !promovidosNomes.includes(team.name))
				.concat(rebaixados);

			let leagueResult = {
				country: league.country,
				championsSpots: league.championsSpots,
				table: table,
			};

			return leagueResult;
		});

		setLastLeagueResults(leagueResults);
		// Update league results
		setTransfers(GetInitTeams(newTeams, player)); // Use selectedPosition
	}

	function ChooseTeam(newTeam = null) {
		//change display
		document.getElementById("team-choice").style.display = "none";
		document.getElementById("continue").style.display = "flex";

		//load
		player.age++;
		let newGeneralPerformance = generalPerformance;
		let newHistory = history;
		let newContract = contract - 1;

		newHistory = newHistory.filter((item) => year - item.year <= 8);

		if (newTeam !== null) {
			// Se houver mudança de time
			newHistory.push({ team: newTeam.team.name, year: year + newTeam.duration });

			// Verifica se o jogador foi emprestado para o novo time
			if (newTeam.loan) {
				// Atualiza os detalhes do contrato do jogador se ele estiver emprestado
				player.contractTeam = {
					team: player.team,
					duration: newContract - newTeam.duration,
					transferValue: newTeam.transferValue,
					position: player.positionInClub.abbreviation,
					loan: false,
				};
			}

			newGeneralPerformance = [];
			player.team = newTeam.team;
			newContract = newTeam.duration;
			player.marketValue = GetTransferValue(
				player.performance,
				player.position.value,
				player.age,
				player.position.peak,
				newTeam.power,
				player.fame
			);
			player.positionInClub = Positions.find(
				(position) => position.abbreviation === newTeam.position
			);

			let lp = 99; // Inicializa o valor padrão de "lp"

			let newLeagueResults =
				lastLeagueResults.find((league) => league.country === player.team.country) || [];
			lp = newLeagueResults.table.findIndex((team) => team.name === player.team.name) + 1;

			// Verifica se o jogador se classificou no ano passado
			if (lp <= 0 || lp > newLeagueResults.championsSpots) {
				// Não foi classificado
				player.championsQualification = false;
			} else {
				// Para os campeões
				player.championsQualification = true;
				player.lastLeaguePosition = lp;
			}

			setRenew({ value: 0, duration: 0, addition: null, position: null });
		} else if (newContract <= 0 || renew.addition != null) {
			// Renovação do contrato
			newContract = renew.duration + renew.addition; // Nova duração do contrato
			player.positionInClub = Positions.find(
				(position) => position.abbreviation === renew.position
			);

			setRenew({ value: 0, duration: 0, addition: null, position: null });
		}

		//change teams power on each season
		let updatedTeams = UpdateTeamsStats(40.0);
		let newTeams = updatedTeams.newTeams;
		UpdateExtraTeamsStats();

		let allTeams = [];
		for (let leagueID = 0; leagueID < newTeams.length; leagueID++) {
			allTeams = allTeams
				.concat([...newTeams[leagueID].highestLeague.teams])
				.concat([...newTeams[leagueID].lowerLeague.teams]);
		}
		allTeams.sort((a, b) => {
			return b.power - a.power;
		});
		//creates a list of top 10 teams
		let top10 = allTeams.slice(0, 10).map((team, index) => ({
			...team,
			rank: index + 1, // Rank starts from 1
		}));
		if (!top10.some((t) => t.name === player.team.name)) {
			const playerTeam = allTeams.find((t) => t.name === player.team.name);
			const playerRanking = allTeams.findIndex((t) => t.name === player.team.name) + 1;
			if (playerTeam) {
				top10.push({
					...playerTeam,
					rank: playerRanking,
				});
			}
		}

		//change nations power on each season
		let updatedNations = UpdateNationsStats();
		let newNat = updatedNations.allNations;
		let allNations = [];
		for (let regionID = 0; regionID < newNat.length; regionID++) {
			allNations = allNations.concat([...newNat[regionID].teams]);
		}
		allNations.sort((a, b) => {
			return b.power - a.power;
		});
		//creates a list of top 10 nations
		let topNations = allNations.slice(0, 10).map((team, index) => ({
			...team,
			rank: index + 1, // Rank starts from 1
		}));
		if (!topNations.some((t) => t.name === player.nation.name)) {
			const playerTeam = allNations.find((t) => t.name === player.nation.name);
			const playerRanking = allNations.findIndex((t) => t.name === player.nation.name) + 1;
			if (playerTeam) {
				topNations.push({
					...playerTeam,
					rank: playerRanking,
				});
			}
		}

		player.team = allTeams.find((t) => t.name === player.team.name); //find player's team by name and update
		player.nation = allNations.find((n) => n.name === player.nation.name); //find player's nation by name and update

		player.marketValue = GetTransferValue(
			player.performance,
			player.position.value,
			player.age,
			player.position.peak,
			player.team.power,
			player.fame
		);

		//calcule the player's performance
		player.performance = Math.round(100.0 * (Math.random() - Math.random())) / 100.0;

		//set performance over team
		newGeneralPerformance.push(player.performance);
		if (newGeneralPerformance.length > 4) newGeneralPerformance.shift();

		//giving the performance, set how many games did they were the starter player
		let r = Math.random() * 10;
		let starting = Math.floor(
			100 / (1 + (player.team.power * Math.pow(player.positionInClub.peak - player.age, 2)) / 400) +
				player.performance * 10 +
				r
		);
		if (starting > 100) starting = 100;
		else if (starting < 0) starting = 0;

		let remaining = 100 - starting;

		let subbed =
			Math.floor(
				(player.positionInClub.subRate *
					Math.exp(player.performance * 0.2) *
					(1 + player.fame / 1000) *
					remaining) /
					2
			) * 2;
		if (subbed > remaining) subbed = remaining;
		else if (subbed < 0) subbed = 0;

		//set season start
		let newSeason = {
			year: year + 1,
			top10: top10,
			topNations: topNations,
			topGains: updatedTeams.topGains,
			topLoss: updatedTeams.topLosses,
			topNationsGains: updatedNations.topGains,
			topNationsLoss: updatedNations.topLosses,
			age: player.age,
			positionInClub: player.positionInClub,
			team: DeepClone(player.team),
			nation: DeepClone(player.nation),
			starting: starting,
			subbed: subbed,
			titles: [],
			goals: 0,
			assists: 0,
			performance: player.performance,
			awardPoints: 0,
			leagueTable: [],
			fame: player.fame,
			marketValue: player.marketValue,
		};

		//save
		setCurrentSeason(newSeason);
		setYear(year + 1);
		setContract(newContract);
		setGeneralPerformance(newGeneralPerformance);
		setHistory(newHistory);
	}

	function Continue() {
		//change display
		document.getElementById("team-choice").style.display = "flex";
		document.getElementById("continue").style.display = "none";

		let opportunities = 0;
		let awardRecord = [
			{ name: "Performance", stat: (currentSeason.performance + 1.5) / 2.5, multiplier: 1.0 },
			{ name: "Starting", stat: currentSeason.starting / 100, multiplier: 1.0 },
		];
		let trophies = 0;
		let triplice = 0;
		let competitionPerformance = 0;

		//national tournaments
		let leagueResults = leagues.map((league) => {
			const result = GetLeaguePosition(shuffleArray(league.highestLeague.teams));
			const table = result.sortedTeams;

			const rebaixados = table.slice(-league.demotions);
			const promovidos = league.lowerLeague.teams
				.sort((a, b) => {
					return b.power - a.power - Math.random(); // pequeno fator de aleatoriedade
				})
				.slice(0, league.demotions);

			const rebaixadosNomes = rebaixados.map((t) => t.name);
			const promovidosNomes = promovidos.map((t) => t.name);

			let leagueResult = {
				leagueName: league.highestLeague.name,
				country: league.country,
				championsSpots: league.championsSpots,
				table: table,
				desc: result.desc,
				// Guardamos aqui para rebaixar/promover depois
				_pendingRebaixamento: {
					rebaixados,
					promovidos,
					rebaixadosNomes,
					promovidosNomes,
				},
				_reference: league, // guardamos a referência pra mexer depois
			};

			console.log(
				league.highestLeague.name +
					": " +
					leagueResult.table[0].name +
					" (" +
					leagueResult.table[0].power +
					")"
			);

			return leagueResult;
		});

		let playerLeagueResult = leagueResults.find((league) => league.country === player.team.country);

		let leaguesTable = [];
		for (let l = 0; l < leagueResults.length; l++) {
			leaguesTable.push(`${leagueResults[l].leagueName}${leagueResults[l].desc}`);
		}

		const playerPosition = playerLeagueResult.table.findIndex(
			(team) => team.name === player.team.name
		);
		competitionPerformance = Math.max(0, (10 - playerPosition) / 10); //max = 1, 0.5 at 6th
		awardRecord.push({
			name: "Liga",
			stat: competitionPerformance,
			multiplier: 0.5,
		});
		currentSeason.titles.push(
			[`Liga${playerPosition >= 0 ? `: ${playerPosition + 1}º lugar` : ""}`].concat(leaguesTable)
		);
		player.fame += Math.floor((playerLeagueResult.championsSpots * (5 - playerPosition)) / 2.0); //max = 10

		opportunities +=
			playerPosition >= 0
				? playerLeagueResult.table.length / (1 + playerPosition / 5)
				: RandomNumber(1, 5); //max = 20 at 1, 10 at 5

		//if fist place, then won trophy
		if (playerPosition === 0) {
			player.leagueTitles.push(`${year} (${player.team.name})`);
			triplice++;
			trophies++;
		}

		let nationalCupDescription = [];
		let end = false;
		let phase = 1;
		let playerPhase = 1;
		competitionPerformance = 0;

		let league = leagues.find((league) => league.country === player.team.country);

		//get opponents for national cup
		let pot2 = DeepClone([...league.highestLeague.teams].concat([...league.lowerLeague.teams]));
		pot2 = pot2.sort((a, b) => b.power - a.power - Math.random());
		let pot1 = pot2.splice(0, pot2.length / 2);

		//embaralhar
		pot1 = shuffleArray(pot1);
		pot2 = shuffleArray(pot2);

		let classifToNationalCup = pot1.concat(pot2);

		while (!end) {
			let newOpponentsLeft = [];
			let games = "";
			let playerOpp = "";
			// Loop pelos jogos do torneio
			for (let matchID = 0; matchID < classifToNationalCup.length / 2; matchID++) {
				// Selecionando os dois times para o jogo atual
				let team1 = classifToNationalCup[matchID];
				let team2 = classifToNationalCup[classifToNationalCup.length - (matchID + 1)];

				let isFinal = phase >= TournamentPath.length - 2 ? false : true;

				// Obtendo o resultado do jogo
				let game = GetKnockoutResult(team1, team2, isFinal);

				// Verificando se o jogador está envolvido no jogo atual
				if (team1.name === player.team.name || team2.name === player.team.name) {
					playerOpp = `: ${team1.name === player.team.name ? team2.name : team1.name}`;

					opportunities++; //Max 1 x 4
					player.fame += 1; // Copa Nacional Máximo 1 x 4 = 4

					// Verificando se o jogador ganhou o jogo
					if (
						(game.result && team1.name === player.team.name) ||
						(!game.result && team2.name === player.team.name)
					) {
						competitionPerformance += 0.2; // Máximo 0.2 x 5 = 1.0
						// Incrementando a fase do jogador e concedendo pontos e prêmios adicionais
						playerPhase++;
						if (playerPhase >= TournamentPath.length - 1) {
							// Se o jogador venceu o torneio, conceder prêmios adicionais
							player.nationalCup.push(`${year} (${player.team.name})`);
							player.fame += 6; // Copa Nacional Máximo 1 x 4 + 6 = 10
							triplice++;
						}
					}
				}

				// Adicionando o resultado do jogo ao histórico geral
				games += `--> ${game.game}`;

				// Adicionando o próximo oponente para a próxima rodada com base no resultado do jogo atual
				if (game.result) {
					newOpponentsLeft.push(team1);
				} else {
					newOpponentsLeft.push(team2);
				}
			}

			nationalCupDescription.push(`${TournamentPath[phase]}${playerOpp}${games}`);

			phase++;
			classifToNationalCup = newOpponentsLeft;

			if (phase >= TournamentPath.length - 1) {
				end = true;
			}
		}

		awardRecord.push({
			name: "Copa Nacional",
			stat: competitionPerformance,
			multiplier: 0.5,
		});

		currentSeason.titles.push(
			[`Copa Nacional: ${TournamentPath[playerPhase]}`].concat(nationalCupDescription)
		);

		//Champions League
		phase = 0;
		playerPhase = 0;
		competitionPerformance = 0;

		let championsDescription = [];
		let qualifiedToChampions = [];

		// Obter os principais times de cada liga
		for (let leagueID = 0; leagueID < leagues.length; leagueID++) {
			let league = DeepClone([...leagues[leagueID].highestLeague.teams]);

			let leagueTableNames = lastLeagueResults[leagueID].table.map((team) => team.name);
			let leagueQualifiedNames = leagueTableNames.splice(
				0,
				lastLeagueResults[leagueID].championsSpots
			);

			let leagueQualified = league.filter((team) => leagueQualifiedNames.includes(team.name));

			for (let teamID = 0; teamID < lastLeagueResults[leagueID].championsSpots; teamID++) {
				qualifiedToChampions.push(leagueQualified[teamID]);
			}
		}

		// Adicionar as equipes extras aos times qualificados
		qualifiedToChampions = qualifiedToChampions.concat(
			extrateams.find((conf) => conf.name === "UEFA").teams.slice(0, 8)
		);

		// Obter a posição dos campeões em um grupo específico
		let championsGroup = GetChampionsPosition(
			qualifiedToChampions,
			player.championsQualification ? player.team : null
		);

		const playerChampionsPos = championsGroup.table.findIndex(
			(team) => team.name === player.team.name
		);

		if (playerChampionsPos >= 0) {
			opportunities += Math.max(0, 4 / (1 + playerChampionsPos / 4)); //max 4 at 1, 2 at 4
			competitionPerformance += Math.max(0, 24 - playerChampionsPos) / 80; //max 0.3 at 0, 0.1 at 16
		}

		// Construir a descrição da fase do torneio
		championsDescription.push(
			`${TournamentPath[playerPhase]}${
				playerChampionsPos >= 0 ? `: ${playerChampionsPos + 1}º lugar` : ""
			}${championsGroup.desc}`
		);

		// Obter as equipes classificadas para os playoffs e limitar para 24 equipes
		let playoffsClassif = DeepClone([...championsGroup.table]).splice(0, 24);

		//Sortear confrontos
		for (let index = 0; index < playoffsClassif.length; index += 2) {
			if (Math.random() < 0.5) {
				let temp = playoffsClassif[index];
				playoffsClassif[index] = playoffsClassif[index + 1];
				playoffsClassif[index + 1] = temp;
			}
		}

		// Avançar para a próxima fase
		phase++;

		// Verificar se o novo jogador está entre os classificados para os playoffs
		if (playoffsClassif.some((t) => t.name === player.team.name)) {
			playerPhase++;
		}

		// Selecionar as primeiras 8 equipes classificadas para os playoffs
		let classifToKnockout = playoffsClassif.splice(0, 8);

		let games = "";
		let playerOpp = "";

		for (let matchID = 0; matchID < playoffsClassif.length / 2; matchID++) {
			let team1 = playoffsClassif[matchID];
			let team2 = playoffsClassif[playoffsClassif.length - (matchID + 1)];
			let game = GetKnockoutResult(team1, team2, true);

			if (team1.name === player.team.name || team2.name === player.team.name) {
				playerOpp = `: ${team1.name === player.team.name ? team2.name : team1.name}`;
			}

			games += `--> ${game.game}`;

			if (game.result) {
				classifToKnockout.push(team1);
			} else {
				classifToKnockout.push(team2);
			}
		}

		championsDescription.push(`${TournamentPath[phase]}${playerOpp}${games}`);

		if (classifToKnockout.some((t) => t.name === player.team.name)) {
			playerPhase++;
		}

		phase++;
		end = false;
		// Loop principal para simular os jogos do torneio até o final
		while (!end) {
			// Limpar variáveis ​​para armazenar informações dos jogos
			let games = "";
			let playerOpp = "";
			let newClassif = [];

			// Loop pelos jogos do torneio atual
			for (let matchID = 0; matchID < classifToKnockout.length / 2; matchID++) {
				// Selecionar os dois times para o jogo atual
				let team1 = classifToKnockout[matchID];
				let team2 = classifToKnockout[classifToKnockout.length - (matchID + 1)];

				// Obter o resultado do jogo
				let game = GetKnockoutResult(
					team1,
					team2,
					phase >= TournamentPath.length - 2 ? false : true
				);

				// Verificar se o jogador está envolvido no jogo atual
				if (team1.name === player.team.name || team2.name === player.team.name) {
					playerOpp = `: ${team1.name === player.team.name ? team2.name : team1.name}`;

					opportunities++; //max 1 x 4
					competitionPerformance += 0.14; // Máximo 0.3 + 0.14 x 4 = 0.86
					player.fame += 3; // Champions Máximo 3 x 4 = 12

					// Verificar se o jogador ganhou o jogo
					if (
						(game.result && team1.name === player.team.name) ||
						(!game.result && team2.name === player.team.name)
					) {
						// Incrementar a fase do jogador e conceder pontos e prêmios adicionais
						playerPhase++;
						if (playerPhase >= TournamentPath.length - 1) {
							// Se o jogador vencer o torneio, conceder prêmios adicionais
							player.champions.push(`${year} (${player.team.name})`);
							player.fame += 8; // Máximo 3 x 4 + 8 = 20
							competitionPerformance += 0.14; // Máximo 0.3 + 0.14 x 4 + 0.14 = 1.0
							triplice++;
						}
					}
				}

				// Adicionar o resultado do jogo ao histórico geral
				games += `--> ${game.game}`;

				// Adicionar os vencedores do jogo à nova classificação
				if (game.result) {
					newClassif.push(team1);
				} else {
					newClassif.push(team2);
				}
			}

			// Construir a descrição da fase do torneio
			championsDescription.push(`${TournamentPath[phase]}${playerOpp}${games}`);

			// Avançar para a próxima fase e atualizar a classificação
			phase++;
			classifToKnockout = newClassif;

			// Verificar se o torneio chegou ao fim
			if (phase >= TournamentPath.length - 1) {
				console.log("Champions League: " + newClassif[0].name + " (" + newClassif[0].power + ")");
				uefaWinners.push(newClassif[0]);
				end = true;
			}
		}

		awardRecord.push({
			name: "Champions League",
			stat: competitionPerformance,
			multiplier: 1.0,
		});
		let playerChampionsResult = player.championsQualification
			? `: ${TournamentPath[playerPhase]}`
			: "";
		currentSeason.titles.push(
			[`Champions League${playerChampionsResult}`].concat(championsDescription)
		);

		if (year % 4 === 1) {
			let phase = 0;
			let playerPhase = 0;
			competitionPerformance = 0;

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
				if (conmebolIndex >= conmebolClubs.length) throw new Error("Não deu");
			}

			let clubWC_ofc = DeepClone(extrateams.filter((c) => c.name === "OFC")[0].teams[0]);

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
					if (!team)
						team = league.lowerLeague.teams.filter((t) => t.name === uefaWinners[i].name)[0];
				}
				if (!team) throw new Error(uefaWinners[i], league);

				clubWC_uefa.push(team);
			}
			setUefaWinners([]);
			let uefaIndex = 0;
			let uefaConf = DeepClone(extrateams.filter((c) => c.name === "UEFA")[0]);
			let uefaClubs = [];
			for (let leagueID = 0; leagueID < leagues.length; leagueID++) {
				uefaClubs = uefaClubs.concat([...leagues[leagueID].highestLeague.teams]);
			}
			uefaClubs.sort((a, b) => {
				return b.power - a.power;
			});
			while (clubWC_uefa.length < uefaConf.clubWorldCupSpots) {
				if (uefaIndex >= uefaClubs.length) throw new Error("Não deu");
				let club = uefaClubs[uefaIndex];
				if (
					clubWC_uefa.filter((c) => c.country === club.country).length < 2 &&
					!clubWC_uefa.some((c) => c.name === club.name)
				)
					clubWC_uefa.push(club);
				uefaIndex++;
			}

			let extra = null;
			let hostCountry = worldCupHistoryHosts.find((h) => h.year === year + 1).hosts[0];
			let country = null;
			for (const conf of nations) {
				for (const team of conf.teams) {
					if (team.name === hostCountry) {
						country = team;
					}
				}
			}
			if (!country) throw new Error(hostCountry);

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
					CONMEBOL: conmebolClubs[0],
				};
				let pots = ["AFC", "CAF", "CONCACAF", "CONMEBOL"];
				pots = shuffleArray(pots);
				extraContinent = pots[0];
				extra = candidates[extraContinent];
			} else {
				let league = DeepClone(extrateams.filter((l) => l.name === country.continent)[0]);
				let validTeams = league.teams.filter((t) => t.country === country.name);
				extra = validTeams[0];
				switch (country.continent) {
					case "AFC":
						let duplicated_afc = clubWC_afc.filter((c) => c.name === extra.name);
						if (duplicated_afc.length > 0) {
							//remove duplicated from
							clubWC_afc = clubWC_afc.filter((c) => c.name !== extra.name);
							//push next into
							clubWC_afc.push(afcClubs[0]);
						}
						break;
					case "CAF":
						let duplicated_caf = clubWC_caf.filter((c) => c.name === extra.name);
						if (duplicated_caf.length > 0) {
							//remove duplicated from
							clubWC_caf = clubWC_caf.filter((c) => c.name !== extra.name);
							//push next into
							clubWC_caf.push(cafClubs[0]);
						}
						break;
					case "CONCACAF":
						let duplicated_concacaf = clubWC_concacaf.filter((c) => c.name === extra.name);
						if (duplicated_concacaf.length > 0) {
							//remove duplicated from
							clubWC_concacaf = clubWC_concacaf.filter((c) => c.name !== extra.name);
							//push next into
							clubWC_concacaf.push(concacafClubs[0]);
						}
						break;
					case "CONMEBOL":
						let duplicated_conmebol = clubWC_conmebol.filter((c) => c.name === extra.name);
						if (duplicated_conmebol.length > 0) {
							//remove duplicated from
							clubWC_conmebol = clubWC_conmebol.filter((c) => c.name !== extra.name);
							//push them into
							clubWC_conmebol.push(conmebolClubs[0]);
						}
						break;
					default:
						throw new Error("Deu Ruim");
				}
			}
			clubWC_uefa.sort((a, b) => b.power - a.power);
			clubWC_conmebol.sort((a, b) => b.power - a.power);

			let pot1 = {
				UEFA: shuffleArray(clubWC_uefa.splice(0, 4)),
				CONMEBOL: shuffleArray(clubWC_conmebol.splice(0, 4)),
			};
			let pot2 = {
				UEFA: shuffleArray(clubWC_uefa),
			};
			let pot3 = {
				CONMEBOL: shuffleArray(clubWC_conmebol),
				AFC: shuffleArray(clubWC_afc.splice(0, 2)),
				CAF: shuffleArray(clubWC_caf.splice(0, 2)),
				CONCACAF: shuffleArray(clubWC_concacaf.splice(0, 2)),
			};
			let pot4 = {
				AFC: shuffleArray(clubWC_afc),
				CAF: shuffleArray(clubWC_caf),
				CONCACAF: shuffleArray(clubWC_concacaf),
				OFC: [clubWC_ofc],
				CONMEBOL: [],
				UEFA: [],
			};
			pot4[extraContinent].push(extra);

			const playedClubWC = [pot1, pot2, pot3, pot4].some((pot) =>
				Object.values(pot).some((conf) => conf.some((club) => club.name === player.team.name))
			);

			let resultado = montarGrupos(
				shuffleArray([
					"UEFA",
					"CONMEBOL",
					"UEFA",
					"CONMEBOL",
					"UEFA",
					"CONMEBOL",
					"UEFA",
					"CONMEBOL",
				]),
				shuffleArray(["CONMEBOL", "CONMEBOL", "AFC", "AFC", "CAF", "CAF", "CONCACAF", "CONCACAF"]),
				shuffleArray(["OFC", extraContinent, "AFC", "AFC", "CAF", "CAF", "CONCACAF", "CONCACAF"])
			);

			function montarGrupos(pot1, pot3, pot4) {
				const usadosPot3 = Array(pot3.length).fill(false);
				const usadosPot4 = Array(pot4.length).fill(false);
				const grupos = [];

				function tentar(pos) {
					if (pos === pot1.length) return true; // Terminou tudo com sucesso

					const continente1 = pot1[pos];

					for (let i = 0; i < pot3.length; i++) {
						if (usadosPot3[i]) continue;
						const continente3 = pot3[i];
						if (continente3 === continente1) continue;

						for (let j = 0; j < pot4.length; j++) {
							if (usadosPot4[j]) continue;
							const continente4 = pot4[j];
							if (continente4 === continente1 || continente4 === continente3) continue;

							// Esse trio é válido
							usadosPot3[i] = true;
							usadosPot4[j] = true;
							grupos.push([continente1, continente3, continente4]);

							if (tentar(pos + 1)) return true;

							// Backtrack
							usadosPot3[i] = false;
							usadosPot4[j] = false;
							grupos.pop();
						}
					}

					// Nenhuma combinação válida encontrada nessa posição
					return false;
				}

				if (tentar(0)) {
					return grupos;
				} else {
					return null; // Não deu certo
				}
			}

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
				while (pot1club.country === pot2club.country) {
					index--;
					if (
						groups[index][0].country !== pot2.UEFA[0].country &&
						groups[index][1].country !== pot2.UEFA[0].country
					) {
						pot2.UEFA.push(groups[index][1]);
						pot2club = groups[index][1];
						groups[index][1] = pot2.UEFA.shift();
					}
				}

				pot2.UEFA = pot2.UEFA.filter((c) => c.name !== pot2club.name);
				groups[i].push(pot2club);

				groups[i].push(pot3[resultado[i][1]].shift());
				groups[i].push(pot4[resultado[i][2]].shift());
			}

			let clubWorldCupDescription = [];

			let clubWorldCupResults = GetTournamentResults(groups, 8, clubWorlcCupDraw, player.team);

			clubWorldCupDescription.push(`Grupos${clubWorldCupResults.desc}`);

			if(clubWorldCupResults.playerPosition != null) competitionPerformance += (4 - clubWorldCupResults.playerPosition) / 20 //max 0.2

			// Combinar os primeiros, segundos e terceiros colocados de todos os grupos e os oito primeiros terceiros colocados
			let classif = clubWorldCupResults.classif;

			phase += 2;

			// Verificar se o jogador avançou para a próxima fase
			if (classif.some((t) => t.name === player.team.name)) {
				playerPhase += 2;
			}

			// Variável para indicar o fim do loop
			let end = false;

			// Loop principal para simular os jogos do torneio até o final
			while (!end) {
				// Limpar variáveis para armazenar informações dos jogos
				let games = "";
				let newClassif = [];
				let playerOpp = "";

				// Loop pelos jogos do torneio atual
				for (let matchID = 0; matchID < classif.length / 2; matchID++) {
					// Selecionar os dois times para o jogo atual
					let team1 = classif[matchID];
					let team2 = classif[classif.length - (matchID + 1)];

					// Obter o resultado do jogo
					let game = GetKnockoutResult(team1, team2, false);

					if (team1.name === player.team.name || team2.name === player.team.name) {
						playerOpp = `: ${team1.name === player.team.name ? team2.name : team1.name}`;
					}

					// Verificar se o jogador está envolvido no jogo atual
					if (team1.name === player.team.name || team2.name === player.team.name) {
						opportunities++; //max 1 x 4
						competitionPerformance += 0.16; // Máximo 0.2 + 0.16 x 4 = 0.84
						player.fame += 3; // Máximo 3 x 4 = 12

						// Verificar se o jogador ganhou o jogo
						if (
							(game.result && team1.name === player.team.name) ||
							(!game.result && team2.name === player.team.name)
						) {
							playerPhase++;
							if (playerPhase >= TournamentPath.length - 1) {
								player.clubWorldCup.push(`${year} (${player.team.name})`);
								competitionPerformance += 0.16; // Máximo 0.2 + 0.16 x 4 + 0.16 = 1.0
								player.fame += 8; // Máximo 3 x 4 + 8 = 20
							}
						}
					}

					// Adicionar o resultado do jogo ao histórico geral
					games += `--> ${game.game}`;

					// Adicionar os vencedores do jogo à nova classificação
					if (game.result) {
						newClassif.push(team1);
					} else {
						newClassif.push(team2);
					}
				}

				// Construir a descrição da fase do torneio
				clubWorldCupDescription.push(`${TournamentPath[phase]}${playerOpp}${games}`);

				// Avançar para a próxima fase e atualizar a classificação
				phase++;
				classif = newClassif;

				// Verificar se o torneio chegou ao fim
				if (phase >= TournamentPath.length - 1) {
					end = true;
					console.log(
						"Mundial de Clubes: " + newClassif[0].name + " (" + newClassif[0].power + ")"
					);
				}
			}

			let playerWorldCupDesc = "";
			if (playedClubWC) playerWorldCupDesc += `: ${TournamentPath[playerPhase]}`;

			awardRecord.push({
				name: "Mundial de Clubes",
				stat: competitionPerformance,
				multiplier: 1.0,
			});

			currentSeason.titles.push(
				[`Mundial de Clubes${playerWorldCupDesc}`].concat(clubWorldCupDescription)
			);
		}

		if (year % 4 === 0) {
			let playedContinental =
				player.team.power +
					currentSeason.starting / 100 +
					currentSeason.performance +
					player.fame / 1000 >=
				player.nation.power;

			// EUROCOPA
			phase = 0;
			playerPhase = 0;
			let europeanDescription = [];
			competitionPerformance = 0;

			let europeanTeams = DeepClone([...nations.find((n) => n.name === "UEFA").teams]);
			europeanTeams = europeanTeams.sort((a, b) => b.power - a.power - Math.random());
			europeanTeams.splice(24);

			let nationEuroClassif = europeanTeams.some((t) => t.name === player.nation.name);

			let europeanPots = [];
			for (let i = 0; i < 4; i++) {
				europeanPots.push(shuffleArray(europeanTeams.splice(0, 6)));
			}

			let europeanGroups = [];
			for (let i = 0; i < 6; i++) {
				europeanGroups.push([]);
				for (let j = 0; j < 4; j++) {
					europeanGroups[i].push(europeanPots[j][i]);
				}
			}

			let eurocopaResults = GetTournamentResults(europeanGroups, 4, euroCupDraw, player.nation);

			if(eurocopaResults.playerPosition != null) competitionPerformance += Math.floor((4 - eurocopaResults.playerPosition) / 20) //max 0.2

			let classif = eurocopaResults.classif;

			europeanDescription.push(`Grupos${eurocopaResults.desc}`);

			phase += 2;

			if (classif.some((t) => t.name === player.nation.name)) {
				playerPhase += 2;
			}

			// Variável para indicar o fim do loop
			let end = false;

			// Loop principal para simular os jogos do torneio até o final
			while (!end) {
				// Limpar variáveis para armazenar informações dos jogos
				let games = "";
				let newClassif = [];
				let playerOpp = "";

				// Loop pelos jogos do torneio atual
				for (let matchID = 0; matchID < classif.length / 2; matchID++) {
					// Selecionar os dois times para o jogo atual
					let team1 = classif[matchID];
					let team2 = classif[classif.length - (matchID + 1)];

					// Obter o resultado do jogo
					let game = GetKnockoutResult(team1, team2, false);

					if (team1.name === player.nation.name || team2.name === player.nation.name) {
						playerOpp = `: ${team1.name === player.nation.name ? team2.name : team1.name}`;
					}

					// Verificar se o jogador está envolvido no jogo atual
					if (team1.name === player.nation.name || team2.name === player.nation.name) {
						if (playedContinental) {
							opportunities++; //max 1 x 4
							competitionPerformance += 0.16; // Máximo 0.2 + 0.16 x 4 = 0.84
							player.fame += 3; // Copa Máximo 3 x 4 = 12
						}

						// Verificar se o jogador ganhou o jogo
						if (
							(game.result && team1.name === player.nation.name) ||
							(!game.result && team2.name === player.nation.name)
						) {
							playerPhase++;
							// Verificar se o jogador ganhou a Copa do Mundo e conceder prêmios adicionais
							if (playedContinental) {
								if (playerPhase >= TournamentPath.length - 1) {
									player.continentalChampionship.push(`${year}`);
									competitionPerformance += 0.16; // Máximo 0.2 + 0.16 x 4 + 0.16 = 1.0
									player.fame += 8; // Máximo 3 x 4 + 9 = 20
								}
							}
						}
					}

					// Adicionar o resultado do jogo ao histórico geral
					games += `--> ${game.game}`;

					// Adicionar os vencedores do jogo à nova classificação
					if (game.result) {
						newClassif.push(team1);
					} else {
						newClassif.push(team2);
					}
				}

				// Construir a descrição da fase do torneio
				europeanDescription.push(`${TournamentPath[phase]}${playerOpp}${games}`);

				// Avançar para a próxima fase e atualizar a classificação
				phase++;
				classif = newClassif;

				// Verificar se o torneio chegou ao fim
				if (phase >= TournamentPath.length - 1) {
					end = true;
					console.log("Eurocopa: " + newClassif[0].name + " (" + newClassif[0].power + ")");
				}
			}

			let playerEuropeanDesc = "";

			if (player.nation.continent === "UEFA" && nationEuroClassif) {
				playerEuropeanDesc = `: ${TournamentPath[playerPhase]} ${
					playedContinental ? "" : " (Não Convocado)"
				}`;
			}

			currentSeason.titles.push([`Eurocopa${playerEuropeanDesc}`].concat(europeanDescription));

			// COPA AMERICA
			phase = 0;
			playerPhase = 0;
			let americanDescription = [];

			let americanTeams = DeepClone([
				...nations.find((n) => n.name === "CONMEBOL").teams,
				...nations.find((n) => n.name === "CONCACAF").teams,
			]);

			americanTeams.sort((a, b) => b.power - a.power - Math.random());

			let americanPots = [];
			for (let i = 0; i < 4; i++) {
				americanPots.push(shuffleArray(americanTeams.splice(0, 4)));
			}

			let americanGroups = [];
			for (let i = 0; i < 4; i++) {
				americanGroups.push([]);
				for (let j = 0; j < 4; j++) {
					americanGroups[i].push(americanPots[j][i]);
				}
			}

			let americanResults = GetTournamentResults(americanGroups, 0, americanCupDraw, player.nation);

			if(americanResults.playerPosition != null) competitionPerformance += Math.floor((4 - americanResults.playerPosition) / 20) //max 0.2

			classif = americanResults.classif;

			americanDescription.push(`Grupos${americanResults.desc}`);

			phase += 3;
			if (classif.some((t) => t.name === player.nation.name)) {
				playerPhase += 3;
			}

			// Variável para indicar o fim do loop
			end = false;

			// Loop principal para simular os jogos do torneio até o final
			while (!end) {
				// Limpar variáveis para armazenar informações dos jogos
				let games = "";
				let newClassif = [];
				let playerOpp = "";

				// Loop pelos jogos do torneio atual
				for (let matchID = 0; matchID < classif.length / 2; matchID++) {
					// Selecionar os dois times para o jogo atual
					let team1 = classif[matchID];
					let team2 = classif[classif.length - (matchID + 1)];

					// Obter o resultado do jogo
					let game = GetKnockoutResult(team1, team2, false);

					if (team1.name === player.nation.name || team2.name === player.nation.name) {
						playerOpp = `: ${team1.name === player.nation.name ? team2.name : team1.name}`;
					}

					// Verificar se o jogador está envolvido no jogo atual
					if (team1.name === player.nation.name || team2.name === player.nation.name) {
						if (playedContinental) {
							opportunities++; //max 1 x 3
							competitionPerformance += 0.2; // Máximo 0.2 + 0.2 x 3 = 0.8
							player.fame += 4; // Copa América Máximo 4 x 3 = 12
						}

						// Verificar se o jogador ganhou o jogo
						if (
							(game.result && team1.name === player.nation.name) ||
							(!game.result && team2.name === player.nation.name)
						) {
							playerPhase++;
							// Verificar se o jogador ganhou a Copa do Mundo e conceder prêmios adicionais
							if (playedContinental) {
								if (playerPhase >= TournamentPath.length - 1) {
									player.continentalChampionship.push(`${year}`);
									competitionPerformance += 0.2; // Máximo 0.2 + 0.2 x 3 + 0.2 = 1.0
									player.fame += 8; // Máximo 4 x 3 + 8 = 20
								}
							}
						}
					}

					// Adicionar o resultado do jogo ao histórico geral
					games += `--> ${game.game}`;

					// Adicionar os vencedores do jogo à nova classificação
					if (game.result) {
						newClassif.push(team1);
					} else {
						newClassif.push(team2);
					}
				}

				// Construir a descrição da fase do torneio
				americanDescription.push(`${TournamentPath[phase]}${playerOpp}${games}`);

				// Avançar para a próxima fase e atualizar a classificação
				phase++;
				classif = newClassif;

				// Verificar se o torneio chegou ao fim
				if (phase >= TournamentPath.length - 1) {
					end = true;
					console.log("Copa América: " + newClassif[0].name + " (" + newClassif[0].power + ")");
				}
			}

			let playerAmericanDesc = "";

			if (player.nation.continent === "CONCACAF" || player.nation.continent === "CONMEBOL") {
				playerAmericanDesc = `: ${TournamentPath[playerPhase]} ${
					playedContinental ? "" : " (Não Convocado)"
				}`;
			}

			currentSeason.titles.push([`Copa América${playerAmericanDesc}`].concat(americanDescription));

			// COPA DA ÁFRICA
			phase = 0;
			playerPhase = 0;
			let africanDescription = [];

			let africanTeams = DeepClone([...nations.find((n) => n.name === "CAF").teams]);
			africanTeams = africanTeams.sort((a, b) => b.power - a.power - Math.random());

			let africanPots = [];
			for (let i = 0; i < 4; i++) {
				africanPots.push(shuffleArray(africanTeams.splice(0, 3)));
			}

			let africanGroups = [];
			for (let i = 0; i < 3; i++) {
				africanGroups.push([]);
				for (let j = 0; j < 4; j++) {
					africanGroups[i].push(africanPots[j][i]);
				}
			}

			let africanResults = GetTournamentResults(africanGroups, 2, africanAsianCupDraw, player.nation);

			if(africanResults.playerPosition != null) competitionPerformance += Math.floor((4 - africanResults.playerPosition) / 20) //max 0.2

			// Combinar os primeiros, segundos e terceiros colocados de todos os grupos e os oito primeiros terceiros colocados
			classif = africanResults.classif;

			africanDescription.push(`Grupos${africanResults.desc}`);

			phase += 3;
			if (classif.some((t) => t.name === player.nation.name)) {
				playerPhase += 3;
			}

			// Variável para indicar o fim do loop
			end = false;

			// Loop principal para simular os jogos do torneio até o final
			while (!end) {
				// Limpar variáveis para armazenar informações dos jogos
				let games = "";
				let newClassif = [];
				let playerOpp = "";

				// Loop pelos jogos do torneio atual
				for (let matchID = 0; matchID < classif.length / 2; matchID++) {
					// Selecionar os dois times para o jogo atual
					let team1 = classif[matchID];
					let team2 = classif[classif.length - (matchID + 1)];

					// Obter o resultado do jogo
					let game = GetKnockoutResult(team1, team2, false);

					if (team1.name === player.nation.name || team2.name === player.nation.name) {
						playerOpp = `: ${team1.name === player.nation.name ? team2.name : team1.name}`;
					}

					// Verificar se o jogador está envolvido no jogo atual
					if (team1.name === player.nation.name || team2.name === player.nation.name) {
						if (playedContinental) {
							opportunities++; //max 1 x 3
							competitionPerformance += 0.2; // Máximo 0.2 + 0.2 x 3 = 0.80
							player.fame += 4; // Copa África Máximo 4 x 3 = 12
						}
						// Verificar se o jogador ganhou o jogo
						if (
							(game.result && team1.name === player.nation.name) ||
							(!game.result && team2.name === player.nation.name)
						) {
							playerPhase++;
							// Verificar se o jogador ganhou a Copa do Mundo e conceder prêmios adicionais
							if (playedContinental) {
								if (playerPhase >= TournamentPath.length - 1) {
									player.continentalChampionship.push(`${year}`);
									competitionPerformance += 0.2; // Máximo 0.2 + 0.2 x 3 + 0.2 = 1.0
									player.fame += 8; // Máximo 4 x 3 + 8 = 20
								}
							}
						}
					}

					// Adicionar o resultado do jogo ao histórico geral
					games += `--> ${game.game}`;

					// Adicionar os vencedores do jogo à nova classificação
					if (game.result) {
						newClassif.push(team1);
					} else {
						newClassif.push(team2);
					}
				}

				// Construir a descrição da fase do torneio
				africanDescription.push(`${TournamentPath[phase]}${playerOpp}${games}`);

				// Avançar para a próxima fase e atualizar a classificação
				phase++;
				classif = newClassif;

				// Verificar se o torneio chegou ao fim
				if (phase >= TournamentPath.length - 1) {
					end = true;
					console.log("Copa da África: " + newClassif[0].name + " (" + newClassif[0].power + ")");
				}
			}

			let playerAfricanDesc = "";

			if (player.nation.continent === "CAF") {
				playerAfricanDesc = `: ${TournamentPath[playerPhase]} ${
					playedContinental ? "" : " (Não Convocado)"
				}`;
			}

			currentSeason.titles.push([`Copa da África${playerAfricanDesc}`].concat(africanDescription));

			// COPA DA ÁSIA
			phase = 0;
			playerPhase = 0;
			let asianDescription = [];
			// 1. get all 12 teams
			let asianTeams = DeepClone([...nations.find((n) => n.name === "AFC").teams]);
			asianTeams = asianTeams.sort((a, b) => b.power - a.power - Math.random());

			let asianPots = [];
			for (let i = 0; i < 4; i++) {
				asianPots.push(shuffleArray(asianTeams.splice(0, 3)));
			}

			let asianGroups = [];
			for (let i = 0; i < 3; i++) {
				asianGroups.push([]);
				for (let j = 0; j < 4; j++) {
					asianGroups[i].push(asianPots[j][i]);
				}
			}

			let asianResults = GetTournamentResults(asianGroups, 2, africanAsianCupDraw, player.nation);

			if(asianResults.playerPosition != null) competitionPerformance += Math.floor((4 - asianResults.playerPosition) / 20) //max 0.2

			classif = asianResults.classif;

			asianDescription.push(`Grupos${asianResults.desc}`);

			phase += 3;
			if (classif.some((t) => t.name === player.nation.name)) {
				playerPhase += 3;
			}

			// Variável para indicar o fim do loop
			end = false;

			// Loop principal para simular os jogos do torneio até o final
			while (!end) {
				// Limpar variáveis para armazenar informações dos jogos
				let games = "";
				let newClassif = [];
				let playerOpp = "";

				// Loop pelos jogos do torneio atual
				for (let matchID = 0; matchID < classif.length / 2; matchID++) {
					// Selecionar os dois times para o jogo atual
					let team1 = classif[matchID];
					let team2 = classif[classif.length - (matchID + 1)];

					// Obter o resultado do jogo
					let game = GetKnockoutResult(team1, team2, false);

					if (team1.name === player.nation.name || team2.name === player.nation.name) {
						playerOpp = `: ${team1.name === player.nation.name ? team2.name : team1.name}`;
					}

					// Verificar se o jogador está envolvido no jogo atual
					if (team1.name === player.nation.name || team2.name === player.nation.name) {
						if (playedContinental) {
							opportunities++; //max 1 x 3
							competitionPerformance += 0.2; // Máximo 0.2 + 0.2 x 3 = 0.8
							player.fame += 4; // Copa Ásia Máximo 4 x 3 = 12
						}

						// Verificar se o jogador ganhou o jogo
						if (
							(game.result && team1.name === player.nation.name) ||
							(!game.result && team2.name === player.nation.name)
						) {
							playerPhase++;
							// Verificar se o jogador ganhou a Copa do Mundo e conceder prêmios adicionais
							if (playedContinental) {
								if (playerPhase >= TournamentPath.length - 1) {
									player.continentalChampionship.push(`${year}`);
									competitionPerformance += 0.2; // Máximo 0.2 + 0.2 x 3 + 0.2 = 1.0
									player.fame += 8; // Máximo 4 x 3 + 8 = 20
								}
							}
						}
					}

					// Adicionar o resultado do jogo ao histórico geral
					games += `--> ${game.game}`;

					// Adicionar os vencedores do jogo à nova classificação
					if (game.result) {
						newClassif.push(team1);
					} else {
						newClassif.push(team2);
					}
				}

				// Construir a descrição da fase do torneio
				asianDescription.push(`${TournamentPath[phase]}${playerOpp}${games}`);

				// Avançar para a próxima fase e atualizar a classificação
				phase++;
				classif = newClassif;

				// Verificar se o torneio chegou ao fim
				if (phase >= TournamentPath.length - 1) {
					end = true;
					console.log("Copa da Ásia: " + newClassif[0].name + " (" + newClassif[0].power + ")");
				}
			}

			let playerAsianDesc = "";

			if (player.nation.continent === "AFC") {
				playerAsianDesc = `: ${TournamentPath[playerPhase]} ${
					playedContinental ? "" : " (Não Convocado)"
				}`;
			}

			currentSeason.titles.push([`Copa da Ásia${playerAsianDesc}`].concat(asianDescription));

			// PONTUAÇÃO
			awardRecord.push({
				name: "Copa Continental",
				stat: competitionPerformance,
				multiplier: 1.0,
			});
		}

		//World Cup
		if (year % 4 === 2) {
			phase = 0;
			playerPhase = 0;
			let worldCupDescription = [];
			let newWorldCupHistoryHosts = worldCupHistoryHosts;
			let currentHosts = newWorldCupHistoryHosts.find((h) => h.year === year).hosts;
			competitionPerformance = 0;

			let worldCupHostDescription = "Hosts";
			for (let hostID = 0; hostID < currentHosts.length; hostID++) {
				worldCupHostDescription += `-->${currentHosts[hostID]}`;
			}
			worldCupDescription.push(worldCupHostDescription);

			// Lista para armazenar todas as nações qualificadas para a Copa do Mundo
			let allClassifNations = [];

			// Lista para armazenar as nações para os playoffs
			let playoffClassif = [];

			// Loop através de todas as regiões/nacionalidades
			for (let regionID = 0; regionID < nations.length; regionID++) {
				// Clonar profundamente a região/nacionalidade atual
				let region = DeepClone(nations[regionID]);

				let autoClassifHost = [];
				autoClassifHost = region.teams.filter((n) => currentHosts.includes(n.name));
				region.teams = region.teams.filter((n) => !currentHosts.includes(n.name));

				// Ordenar as equipes da região/nacionalidade atual por poder, com uma pequena variação aleatória
				region.teams.sort((a, b) => {
					return b.power - a.power - Math.random();
				});

				region.teams = autoClassifHost.concat(region.teams);

				// Selecionar as equipes qualificadas diretamente para a Copa do Mundo
				let classif = region.teams.splice(0, region.worldCupSpots);

				// Adicionar as equipes qualificadas para a Copa do Mundo à lista de todas as nações
				allClassifNations = allClassifNations.concat(classif);

				// Adicionar as equipes restantes à lista de equipes para os playoffs
				playoffClassif = playoffClassif.concat(region.teams);
			}

			// Embaralhar as equipes para os playoffs
			playoffClassif = shuffleArray(playoffClassif);

			// Selecionar as equipes adicionais para a Copa do Mundo dos playoffs
			allClassifNations = allClassifNations.concat(playoffClassif.splice(0, 4));

			const hostsAreFirst = [];
			allClassifNations = allClassifNations.filter((obj) => {
				if (currentHosts.includes(obj.name)) {
					hostsAreFirst.push(obj);
					return false;
				}
				return true;
			});

			// Ordenar todas as nações qualificadas para a Copa do Mundo por poder
			allClassifNations.sort((a, b) => {
				return b.power - a.power;
			});

			allClassifNations = hostsAreFirst.concat(allClassifNations);

			// Verificar se a nação do novo jogador está entre as nações qualificadas para a Copa do Mundo
			let classifToWorldCup = allClassifNations.some((t) => t.name === player.nation.name);

			//was called by the manager
			let playedWorldCup =
				player.team.power +
					currentSeason.starting / 100 +
					currentSeason.performance +
					player.fame / 1000 >=
				player.nation.power;

			let groups = DrawWorldGroups(allClassifNations, hostsAreFirst.length);

			let results = GetTournamentResults(groups, 8, worldCupDraw, player.nation);

			if(results.playerPosition != null) competitionPerformance += Math.floor((4 - results.playerPosition) / 20) //max 0.2

			worldCupDescription.push(`Grupos${results.desc}`);

			// Combinar os primeiros, segundos e terceiros colocados de todos os grupos e os oito primeiros terceiros colocados
			let classif = results.classif;

			phase++;

			// Verificar se o jogador avançou para a próxima fase
			if (classif.some((t) => t.name === player.nation.name)) {
				playerPhase++;
			}

			// Variável para indicar o fim do loop
			let end = false;

			// Loop principal para simular os jogos do torneio até o final
			while (!end) {
				// Limpar variáveis para armazenar informações dos jogos
				let games = "";
				let newClassif = [];
				let playerOpp = "";

				// Loop pelos jogos do torneio atual
				for (let matchID = 0; matchID < classif.length / 2; matchID++) {
					// Selecionar os dois times para o jogo atual
					let team1 = classif[matchID];
					let team2 = classif[classif.length - (matchID + 1)];

					// Obter o resultado do jogo
					let game = GetKnockoutResult(team1, team2, false);

					if (team1.name === player.nation.name || team2.name === player.nation.name) {
						playerOpp = `: ${team1.name === player.nation.name ? team2.name : team1.name}`;
					}

					// Verificar se o jogador está envolvido no jogo atual
					if (team1.name === player.nation.name || team2.name === player.nation.name) {
						if (playedWorldCup) {
							opportunities++; //max 1 x 5
							competitionPerformance += 0.14; // Máximo 0.2 + 0.14 x 5 = 0.9
							player.fame += 3; // Máximo 3 x 5 = 15
						}

						// Verificar se o jogador ganhou o jogo
						if (
							(game.result && team1.name === player.nation.name) ||
							(!game.result && team2.name === player.nation.name)
						) {
							playerPhase++;
							// Verificar se o jogador ganhou a Copa do Mundo e conceder prêmios adicionais
							if (playedWorldCup) {
								if (playerPhase >= TournamentPath.length - 1) {
									player.worldCup.push(`${year}`);
									competitionPerformance += 0.1; // Máximo 0.2 + 0.14 x 5 + 0.1 = 1.0
									player.fame += 5; // Máximo 3 x 5 + 5 = 20
								}
							}
						}
					}

					// Adicionar o resultado do jogo ao histórico geral
					games += `--> ${game.game}`;

					// Adicionar os vencedores do jogo à nova classificação
					if (game.result) {
						newClassif.push(team1);
					} else {
						newClassif.push(team2);
					}
				}

				// Construir a descrição da fase do torneio
				worldCupDescription.push(`${TournamentPath[phase]}${playerOpp}${games}`);

				// Avançar para a próxima fase e atualizar a classificação
				phase++;
				classif = newClassif;

				// Verificar se o torneio chegou ao fim
				if (phase >= TournamentPath.length - 1) {
					end = true;
					console.log("Copa do Mundo: " + newClassif[0].name + " (" + newClassif[0].power + ")");
				}
			}

			let playerWorldCupDesc = "";

			awardRecord.push({
				name: "Copa do Mundo",
				stat: competitionPerformance,
				multiplier: 1.0,
			});

			if (classifToWorldCup) {
				playerWorldCupDesc = `: ${TournamentPath[playerPhase]} ${
					playedWorldCup ? "" : " (Não Convocado)"
				}`;
			}

			currentSeason.titles.push([`Copa do Mundo${playerWorldCupDesc}`].concat(worldCupDescription));

			//select the next host
			let allNations = [];
			for (let regionID = 0; regionID < nations.length; regionID++) {
				allNations = allNations.concat([...nations[regionID].teams]);
			}

			let countriesHosts = newWorldCupHistoryHosts.flatMap((wc) => wc.hosts);
			let furthestYear = Math.max(...newWorldCupHistoryHosts.map((wc) => wc.year));

			let validTeams = allNations.filter(
				(team) => !countriesHosts.includes(team.name) && team.can_host
			);

			let chosenHosts = [];

			let chosenID = RandomNumber(0, validTeams.length - 1);
			let mainHost = validTeams[chosenID];
			chosenHosts.push(mainHost);

			// Verifica quais estão próximos
			validTeams = allNations.filter((team) => {
				return (
					mainHost.borders.includes(team.name) &&
					!countriesHosts.includes(team.name) &&
					team.name !== mainHost.name
				);
			});

			let numberOfAdditionalHosts = RandomNumber(
				!!validTeams.length,
				Math.min(validTeams.length - 1, 3)
			);
			for (let count = 0; count < numberOfAdditionalHosts; count++) {
				//seleciona
				let chosenHost = validTeams[count];
				chosenHosts.push(chosenHost);
			}

			newWorldCupHistoryHosts.push({
				year: furthestYear + 4,
				hosts: chosenHosts.map((t) => t.name),
			});
			newWorldCupHistoryHosts.shift();

			setWorldCupHistoryHosts(newWorldCupHistoryHosts);
		}

		let performanceMultiplier = (currentSeason.starting + currentSeason.subbed / 2) / 100.0;
		performanceMultiplier *= Math.exp(currentSeason.performance * 0.5);

		currentSeason.goals = Math.floor(
			player.positionInClub.goalsMultiplier *
				performanceMultiplier *
				opportunities *
				Math.exp((Math.random() - Math.random()) * 0.2)
		);

		currentSeason.assists = Math.floor(
			player.positionInClub.assistsMultiplier *
				performanceMultiplier *
				opportunities *
				Math.exp((Math.random() - Math.random()) * 0.2)
		);

		if (currentSeason.goals < 0) currentSeason.goals = 0;
		if (currentSeason.assists < 0) currentSeason.assists = 0;

		//add goals to the carrer summary
		player.totalGoals += currentSeason.goals;
		player.totalAssists += currentSeason.assists;

		//post season results
		if (RandomNumber(1, 1000) <= currentSeason.goals / 2 - 1) {
			//Puskás
			player.awards.push(`Puskás ${year} (${player.team.name})`);
			currentSeason.titles.push(["Puskás"]);
		}

		if (triplice >= 3) {
			player.awards.push(`Tríplice Coroa ${year} (${player.team.name})`);
			currentSeason.titles.push(["Tríplice Coroa"]);
		}

		console.log(awardRecord)
		currentSeason.awardPoints = weightedAverage(awardRecord);

		console.log("Award Points: " + (currentSeason.awardPoints * 100).toPrecision(4) + "%");

		let goldenBootsGoals = 35 + RandomNumber(0, 5);

		if (goldenBootsGoals <= currentSeason.goals) {
			//Golden Shoes
			player.awards.push(`Artilheiro ${year} (${player.team.name})`);
			player.fame += 20;
			currentSeason.titles.push(["Artilheiro"]);
		}

		let position = -1;
		if (currentSeason.awardPoints >= 0.8) {
			//POTS
			player.playerOfTheSeason.push(`${year} (${player.team.name})`);
			player.fame += 50;
			position = 1;
			let desc = `${
				player.position.title === "Goleiro" ? "Goleiro" : "Jogador"
			} da Temporada: 1º lugar`;
			currentSeason.titles.push([desc]);
		} else if (currentSeason.awardPoints >= 0.71) {
			let pts = Math.floor(currentSeason.awardPoints * 100 - 71);
			player.fame += (pts + 1) * 2;
			position = 10 - pts;
			let desc = `${
				player.position.title === "Goleiro" ? "Goleiro" : "Jogador"
			} da Temporada: ${position}º lugar`;
			currentSeason.titles.push([desc]);
		}

		player.fame += currentSeason.performance * 20;

		leagueResults.forEach((leagueResult) => {
			const league = leagueResult._reference;
			const { rebaixados, promovidos, rebaixadosNomes, promovidosNomes } =
				leagueResult._pendingRebaixamento;

			// Realiza o rebaixamento
			league.highestLeague.teams = league.highestLeague.teams
				.filter((team) => !rebaixadosNomes.includes(team.name))
				.concat(promovidos);

			// Realiza a promoção inversa
			league.lowerLeague.teams = league.lowerLeague.teams
				.filter((team) => !promovidosNomes.includes(team.name))
				.concat(rebaixados);
		});

		//setup next season
		if (playerPosition <= league.championsSpots) {
			player.championsQualification = true;
			player.lastLeaguePosition = playerPosition;
		} else {
			player.championsQualification = false;
		}

		if (player.fame < 0) player.fame = 0;

		currentSeason.fame = player.fame;

		let med = 0;
		for (let i = 0; i < generalPerformance.length; i++) {
			med += generalPerformance[i];
		}
		med /= generalPerformance.length;

		//trasnfer window
		let newTransfers = GetNewTeams(player);
		let newRenew = { value: 0, duration: 0, addition: null, position: null };

		if (
			//if ended loan
			player.contractTeam !== null &&
			contract <= 1
		) {
			newTransfers = [player.contractTeam];

			if (med > 0) {
				let newPosition;
				if (player.position.abbreviation !== "GO" && Math.random() < 0.2) {
					let relatedPositions = player.position.related;
					newPosition = relatedPositions[RandomNumber(0, relatedPositions.length - 1)];
				} else {
					newPosition = player.position.abbreviation;
				}

				newRenew = {
					duration: player.contractTeam.duration,
					addition: null,
					position: newPosition,
				};
				document.getElementById("decision-stay").style.display = "flex";
			} else {
				document.getElementById("decision-stay").style.display = "none";
			}

			player.contractTeam = null;

			document.getElementById("decision-transfer1").style.display = "flex";
			document.getElementById("decision-transfer2").style.display = "none";
			document.getElementById("decision-transfer3").style.display = "none";
			document.getElementById("retire").style.display = "none";
		} else if (
			//if played good middle contract
			player.performance > 0.5 &&
			med > 0 &&
			generalPerformance.length >= 2 &&
			contract > 1 &&
			player.age < 35
		) {
			document.getElementById("decision-transfer1").style.display = "flex";

			let contractAddition = 0;
			if (contract <= 3) contractAddition = RandomNumber(1, 3);

			newRenew = {
				duration: contract - 1,
				addition: contractAddition,
				position: player.positionInClub.abbreviation,
			};

			document.getElementById("decision-stay").style.display = "flex";
			//cant retire because of the contract
			document.getElementById("retire").style.display = "none";
		} else if (
			//loan
			player.performance < -0.5 &&
			med < 0 &&
			(generalPerformance.length >= 2 || player.age < 24) &&
			newTransfers.some((t) => t !== null && t.team.power < player.team.power) &&
			contract > 3 &&
			player.age < 35
		) {
			if (newTransfers[0].team.power > player.team.power) {
				document.getElementById("decision-transfer1").style.display = "none";
			} else {
				//proposal 1
				document.getElementById("decision-transfer1").style.display = "flex";
				newTransfers[0].loan = true;
				newTransfers[0].duration = RandomNumber(1, 2);
			}

			if (newTransfers[1].team.power > player.team.power) {
				document.getElementById("decision-transfer2").style.display = "none";
			} else {
				//proposal 2
				document.getElementById("decision-transfer2").style.display = "flex";
				newTransfers[1].loan = true;
				newTransfers[1].duration = RandomNumber(1, 2);
			}

			if (newTransfers[2].team.power > player.team.power) {
				document.getElementById("decision-transfer3").style.display = "none";
			} else {
				//proposal 3
				document.getElementById("decision-transfer3").style.display = "flex";
				newTransfers[2].loan = true;
				newTransfers[2].duration = RandomNumber(1, 2);
			}

			//cant stay
			document.getElementById("decision-stay").style.display = "none";

			//cant retire because of the contract
			document.getElementById("retire").style.display = "none";
		} else if (
			//if contract expired
			contract <= 1
		) {
			if (player.age >= player.positionInClub.peak + 8) {
				//must retire
				document.getElementById("retire").style.display = "flex";
				document.getElementById("decision-stay").style.display = "none";
				document.getElementById("decision-transfer1").style.display = "none";
				document.getElementById("decision-transfer2").style.display = "none";
				document.getElementById("decision-transfer3").style.display = "none";
			} else {
				if (med < 0) {
					//cant stay
					document.getElementById("decision-stay").style.display = "none";
				} else {
					//can stay
					document.getElementById("decision-stay").style.display = "flex";
					let duration = RandomNumber(1, 2);

					// 20% chance to switch position
					let newPosition;
					if (player.position.abbreviation !== "GO" && Math.random() < 0.2) {
						let relatedPositions = player.position.related;
						newPosition = relatedPositions[RandomNumber(0, relatedPositions.length - 1)];
					} else {
						newPosition = player.position.abbreviation;
					}

					newRenew = {
						duration: duration,
						addition: null,
						position: newPosition,
					};
				}

				document.getElementById("decision-transfer1").style.display = "flex";
				document.getElementById("decision-transfer2").style.display = "flex";
				document.getElementById("decision-transfer3").style.display = "flex";

				if (player.age >= player.positionInClub.peak + 6) {
					//can retire
					document.getElementById("retire").style.display = "flex";
				}
			}
		} else {
			ChooseTeam();
		}

		setLastLeagueResults(leagueResults);
		setTransfers(newTransfers);
		setRenew(newRenew);

		//set Seasons
		const newSeasons = [...seasons, currentSeason];
		setSeasons(newSeasons);
	}

	function DrawMatches(teams) {
		let errorCount = 0;

		teams.sort((a, b) => {
			return b.power - a.power;
		});

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
						if (errorCount >= 1000) {
							throw new Error("Não foi possível sortear");
						}
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
						if (errorCount >= 1000) {
							throw new Error("Não foi possível sortear");
						}
					}

					matches.push([pots[oppPotIndex][oppIndex2].name, team.name]);
					matchesCount[potIndex][teamIndex][oppPotIndex] += 1;
					matchesCount[oppPotIndex][oppIndex2][potIndex] += 1;
				}
			}
		}

		return matches;
	}

	function DrawWorldGroups(teams, hostsQtd) {
		//create four pots to the group draw
		let pots = Array.from({ length: 4 }, (_, potID) => teams.slice(potID * 12, (potID + 1) * 12));

		let groups = [[], [], [], [], [], [], [], [], [], [], [], []];

		for (let GroupID = 0; GroupID < 12; GroupID++) {
			//pot 0
			if (GroupID < hostsQtd) {
				groups[GroupID].push(pots[0][0]);
				pots[0] = pots[0].filter((n) => pots[0][0].name !== n.name);
			} else {
				let randomIndex = RandomNumber(0, pots[0].length - 1);
				groups[GroupID].push(pots[0][randomIndex]);
				pots[0] = pots[0].filter((n) => pots[0][randomIndex].name !== n.name);
			}

			//pot 1
			let pot1validNations = pots[1].filter(
				(n) =>
					!groups[GroupID].some((opp) => opp.continent === n.continent && opp.continent !== "UEFA")
			);
			if (pot1validNations.length <= 0) {
				let found = false;
				for (let indexRetro = GroupID - 1; indexRetro >= 0; indexRetro--) {
					//verifica se algum país restante do pots[1] possui um valor de .continent que não está no groups[indexRetro]
					let retroValidNations = pots[1].filter(
						(n) => !groups[indexRetro].some((t) => t.continent === n.continent)
					);

					if (retroValidNations.length > 0) {
						//verifica se o país da posição 1 do groups[indexRetro] possui um valor de .continent que não está no groups[GroupID]
						let canFit = !groups[GroupID].some(
							(n) => groups[indexRetro][1].continent === n.continent
						);

						//se der certo, fazer a troca. se não continue para o grupo anterior.
						if (canFit) {
							let r = RandomNumber(0, retroValidNations.length - 1);
							pot1validNations = [groups[indexRetro][1]];
							groups[indexRetro][1] = retroValidNations[r];
							found = true;
							break;
						}
					}
				}

				if (!found) {
					pot1validNations = pots[1];
				}
			}
			let pot1randomIndex = RandomNumber(0, pot1validNations.length - 1);
			groups[GroupID].push(pot1validNations[pot1randomIndex]);
			pots[1] = pots[1].filter((n) => pot1validNations[pot1randomIndex].name !== n.name);

			//pot 2
			let uefaCount = groups[GroupID].filter((t) => t.continent === "UEFA").length;
			let pot2validNations = pots[2].filter((n) => {
				if (n.continent === "UEFA") {
					// Permite no máximo 2 times da UEFA
					return uefaCount < 2;
				} else {
					// Para outros continentes: não permite duplicatas
					return !groups[GroupID].some((opp) => opp.continent === n.continent);
				}
			});
			if (uefaCount <= 0 && pots[2].some((t) => t.continent === "UEFA")) {
				pot2validNations = pots[2].filter((n) => n.continent === "UEFA");
			}
			if (pot2validNations.length <= 0) {
				let found = false;
				for (let indexRetro = GroupID - 1; indexRetro >= 0; indexRetro--) {
					//verifica se algum país restante do pots[2] possui um valor de .continent que não está no groups[indexRetro]
					let retroValidNations = pots[2].filter(
						(n) => !groups[indexRetro].some((t) => t.continent === n.continent)
					);

					if (retroValidNations.length > 0) {
						//verifica se o país da posição 2 do groups[indexRetro] possui um valor de .continent que não está no groups[GroupID]
						let canFit = !groups[GroupID].some(
							(n) => groups[indexRetro][2].continent === n.continent
						);

						//se der certo, fazer a troca. se não continue para o grupo anterior.
						if (canFit) {
							let r = RandomNumber(0, retroValidNations.length - 1);
							pot2validNations = [groups[indexRetro][2]];
							groups[indexRetro][2] = retroValidNations[r];
							found = true;
							break;
						}
					}
				}

				if (!found) {
					pot2validNations = pots[2];
				}
			}
			let pot2randomIndex = RandomNumber(0, pot2validNations.length - 1);
			groups[GroupID].push(pot2validNations[pot2randomIndex]);
			pots[2] = pots[2].filter((n) => pot2validNations[pot2randomIndex].name !== n.name);

			//pot 3
			uefaCount = groups[GroupID].filter((t) => t.continent === "UEFA").length;
			let pot3validNations = pots[3].filter((n) => {
				if (n.continent === "UEFA") {
					// Permite no máximo 2 times da UEFA
					return uefaCount < 2;
				} else {
					// Para outros continentes: não permite duplicatas
					return !groups[GroupID].some((opp) => opp.continent === n.continent);
				}
			});
			if (uefaCount <= 1 && pots[3].some((t) => t.continent === "UEFA")) {
				pot3validNations = pots[3].filter((n) => n.continent === "UEFA");
			}
			if (pot3validNations.length <= 0) {
				let found = false;
				for (let indexRetro = GroupID - 1; indexRetro >= 0; indexRetro--) {
					//verifica se algum país restante do pots[3] possui um valor de .continent que não está no groups[indexRetro]
					let retroValidNations = pots[3].filter(
						(n) => !groups[indexRetro].some((t) => t.continent === n.continent)
					);

					if (retroValidNations.length > 0) {
						//verifica se o país da posição 3 do groups[indexRetro] possui um valor de .continent que não está no groups[GroupID]
						let canFit = !groups[GroupID].some(
							(n) => groups[indexRetro][3].continent === n.continent
						);

						//se der certo, fazer a troca. se não continue para o grupo anterior.
						if (canFit) {
							let r = RandomNumber(0, retroValidNations.length - 1);
							pot3validNations = [groups[indexRetro][3]];
							groups[indexRetro][3] = retroValidNations[r];
							found = true;
							break;
						}
					}
				}

				if (!found) {
					pot3validNations = pots[3];
				}
			}
			let pot3randomIndex = RandomNumber(0, pot3validNations.length - 1);
			groups[GroupID].push(pot3validNations[pot3randomIndex]);
			pots[3] = pots[3].filter((n) => pot3validNations[pot3randomIndex].name !== n.name);
		}

		return groups;
	}

	function GetChampionsPosition(teams, playerTeam = null) {
		let desc = "";
		let newTeams = DeepClone(teams);
		let matches = DrawMatches(teams);

		// Inicializa o objeto de classificação
		let standings = {};
		for (let team of newTeams) {
			standings[team.name] = {
				team: team,
				points: 0,
				goalsFor: 0,
				goalsAgainst: 0,
			};
		}

		// Processa cada partida
		for (let match of matches) {
			let [homeName, awayName] = match;
			let home = standings[homeName];
			let away = standings[awayName];

			// Simula o resultado da partida
			let result = GetMatch(home.team, away.team);
			let homeGoals = result[0];
			let awayGoals = result[1];

			// Atualiza estatísticas
			home.goalsFor += homeGoals;
			home.goalsAgainst += awayGoals;
			away.goalsFor += awayGoals;
			away.goalsAgainst += awayGoals;

			// Atribui pontos
			if (homeGoals > awayGoals) {
				home.points += 3;
			} else if (awayGoals > homeGoals) {
				away.points += 3;
			} else {
				home.points += 1;
				away.points += 1;
			}

			// Registra partidas do time do jogador
			if (playerTeam && (playerTeam.name === homeName || playerTeam.name === awayName)) {
				desc += `-->${homeName} ${homeGoals} x ${awayGoals} ${awayName}`;
			}
		}

		// Converte para array e ordena
		let sortedStandings = Object.values(standings).sort((a, b) => {
			// Critério 1: Pontos
			if (b.points !== a.points) return b.points - a.points;

			// Critério 2: Saldo de gols
			let goalDiffA = a.goalsFor - a.goalsAgainst;
			let goalDiffB = b.goalsFor - b.goalsAgainst;
			if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;

			// Critério 3: Gols marcados
			if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

			// Critério 4: Confronto direto (não implementado)
			return 0;
		});

		// Gera tabela final
		let finalTable = sortedStandings.map((item) => item.team);

		// Constrói descrição
		desc += "--> Top 8";
		for (let i = 0; i < finalTable.length; i++) {
			desc += `-> ${i + 1}º: ${finalTable[i].name} (${sortedStandings[i].points} pts)`;
			if (i === 7) desc += "--> Playoffs";
			else if (i === 23) desc += "--> Eliminados";
		}

		return {
			table: finalTable,
			desc: desc,
		};
	}

	function GetLeaguePosition(teams) {
		let newTeams = DeepClone(teams);

		// Objeto para armazenar estatísticas de cada time
		const teamStats = {};
		newTeams.forEach((team) => {
			teamStats[team.name] = {
				points: 0,
				goalsFor: 0,
				goalsAgainst: 0,
				goalDifference: 0,
			};
		});

		// Processar todos os jogos
		for (let home = 0; home < newTeams.length; home++) {
			for (let away = 0; away < newTeams.length; away++) {
				if (home === away) continue; // Ignorar jogos do mesmo time

				const homeTeam = newTeams[home];
				const awayTeam = newTeams[away];
				const match = GetMatch(homeTeam, awayTeam);
				const [homeGoals, awayGoals] = match;

				// Atualizar estatísticas
				teamStats[homeTeam.name].goalsFor += homeGoals;
				teamStats[homeTeam.name].goalsAgainst += awayGoals;
				teamStats[awayTeam.name].goalsFor += awayGoals;
				teamStats[awayTeam.name].goalsAgainst += homeGoals;

				// Atribuir pontos
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

		// Calcular saldo de gols
		Object.keys(teamStats).forEach((teamName) => {
			teamStats[teamName].goalDifference =
				teamStats[teamName].goalsFor - teamStats[teamName].goalsAgainst;
		});

		// Ordenar times usando critérios múltiplos
		const sortedTeams = [...newTeams].sort((a, b) => {
			const statsA = teamStats[a.name];
			const statsB = teamStats[b.name];

			// 1. Pontos
			if (statsB.points !== statsA.points) {
				return statsB.points - statsA.points;
			}

			// 2. Saldo de Gols
			if (statsB.goalDifference !== statsA.goalDifference) {
				return statsB.goalDifference - statsA.goalDifference;
			}

			// 3. Gols Marcados
			if (statsB.goalsFor !== statsA.goalsFor) {
				return statsB.goalsFor - statsA.goalsFor;
			}

			// 4. Ordem Alfabética (desempate final)
			return a.name.localeCompare(b.name);
		});

		// Constrói descrição
		let desc = "";
		for (let i = 0; i < sortedTeams.length; i++) {
			desc += `--> ${i + 1}º: ${sortedTeams[i].name} (${
				teamStats[sortedTeams[i].name].points
			} pts)`;
		}

		return { sortedTeams, desc };
	}

	function GetTournamentResults(groups, topThirdCount, drawFunction, playerTeam) {
		let desc = "";
		let firstPlaces = [];
		let secondPlaces = [];
		let thirdPlaces = [];
		let thirdPlacesPoints = [];
		let playerPosition = null

		for (let groupID = 0; groupID < groups.length; groupID++) {
			let thisGroup = GetWorldCupPosition(
				groups[groupID],
				groups[groupID].some((t) => t.name === playerTeam.name) ? playerTeam : null,
				groupID
			);

			const possiblePlayerPosition = thisGroup.table.findIndex((team) => team.name === playerTeam.name);

			if (possiblePlayerPosition >= 0) {
				desc = `: ${possiblePlayerPosition + 1}º lugar${thisGroup.playerMatches}${desc}`;
				playerPosition = possiblePlayerPosition
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

		return {
			classif,
			desc,
			playerPosition
		};
	}

	function euroCupDraw(firstPlaces, secondPlaces, thirdPlaces) {
		const validPositionsByGroup = {
			A: [1, 0],
			B: [0, 1],
			C: [0, 2],
			D: [1, 3],
			E: [2, 3],
			F: [3, 2],
		};

		// Índices dos grupos para cada terceiro colocado no array original de 6 grupos
		const groupLabels = ["A", "B", "C", "D", "E", "F"];

		// Inicializa o array de terceiros colocados no chaveamento com null
		let thirdDraw = new Array(4).fill(null);

		// Associa cada terceiro sobrevivente com seu grupo original e posições permitidas
		let survivingThirds = thirdPlaces
			.map((team, index) => {
				if (team === null) return null;
				const group = groupLabels[index];
				return {
					team,
					positions: validPositionsByGroup[group],
				};
			})
			.filter(Boolean);

		while (survivingThirds.length > 0) {
			// Conta frequência das posições disponíveis
			const positionFrequency = [0, 0, 0, 0];

			for (const third of survivingThirds) {
				for (const pos of third.positions) {
					positionFrequency[pos]++;
				}
			}

			// Encontra a posição menos frequente (entre as possíveis)
			let minFrequency = Infinity;
			let chosenPosition = null;

			for (let i = 0; i < 4; i++) {
				if (thirdDraw[i] !== null) continue; // já ocupada
				if (positionFrequency[i] < minFrequency && positionFrequency[i] > 0) {
					minFrequency = positionFrequency[i];
					chosenPosition = i;
				}
			}

			if (chosenPosition === null) break; // segurança contra loop infinito

			// Escolhe um time que possa ir para essa posição
			const index = survivingThirds.findIndex((third) => third.positions.includes(chosenPosition));

			if (index !== -1) {
				const [third] = survivingThirds.splice(index, 1);
				thirdDraw[chosenPosition] = third.team;
			}
		}

		return firstPlaces.concat(secondPlaces, thirdDraw);
	}

	function americanCupDraw(firstPlaces, secondPlaces, thirdPlaces) {
		secondPlaces = customReverse(secondPlaces);
		return firstPlaces.concat(secondPlaces);
	}

	function africanAsianCupDraw(firstPlaces, secondPlaces, thirdPlaces) {
		let thirdDraw = [];

		//a
		if (thirdPlaces[0]) {
			thirdDraw.push(thirdPlaces[0]);
		}
		//b
		if (thirdPlaces[1]) {
			thirdDraw.push(thirdPlaces[1]);
		}
		//c
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

	function worldCupDraw(firstPlaces, secondPlaces, thirdPlaces) {
		const setMapping = ["T1", "T1", "T2", "T2", "T2", "T2", "T1", "T1", "T1", "T1", "T2", "T2"];
		const subsetsMapping = ["S1", "S2", "S2", "S1", "S1", "S2"];
		const allocationPriority = {
			"T1-S1": { main: [2, 5, 3, 4], exchange: [1, 6] },
			"T1-S2": { main: [3, 4, 2, 5], exchange: [0, 7] },
			"T2-S1": { main: [0, 7, 1, 6], exchange: [3, 4] },
			"T2-S2": { main: [1, 6, 0, 7], exchange: [2, 5] },
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
			11: 8,
		};
		let sets = { T1: [], T2: [] };
		let thirdDraw = new Array(8).fill(null);

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

		function subsetHandler(subset, subsetKey, isSecond = false) {
			const priorities = allocationPriority[subsetKey];
			const exchangePriorities = priorities["exchange"];
			const mainPriorities = priorities["main"];
			for (let teamIndex = 0; teamIndex < subset.length; teamIndex++) {
				let alocated = false;
				if (isSecond) {
					if (thirdDraw[exchangePriorities[0]] == null) {
						thirdDraw[exchangePriorities[0]] = subset[teamIndex];
						alocated = true;
					} else if (thirdDraw[exchangePriorities[1]] == null) {
						thirdDraw[exchangePriorities[1]] = subset[teamIndex];
						alocated = true;
					}
				}
				if (alocated) continue;
				for (let i = 0; i < mainPriorities.length; i++) {
					if (!thirdDraw[mainPriorities[i]]) {
						thirdDraw[mainPriorities[i]] = subset[teamIndex];
						alocated = true;
						break;
					}
				}
				if (alocated) continue;
				for (let i = 0; i < 2; i++) {
					const drawIndex = exchangePriorities[i];
					if (!thirdDraw[drawIndex]) {
						thirdDraw[drawIndex] = subset[teamIndex];
						alocated = true;

						// Índice do time original no array de 12 terceiros colocados
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

	function clubWorlcCupDraw(firstPlaces, secondPlaces, thirdPlaces) {
		secondPlaces = customReverse(secondPlaces);
		return firstPlaces.concat(secondPlaces);
	}

	function customReverse(arr) {
		const chunkSize = 2;
		let chunks = [];

		// Step 1: Divide into chunks
		for (let i = 0; i < arr.length; i += chunkSize) {
			chunks.push(arr.slice(i, i + chunkSize));
		}

		// Step 2: Reverse the chunks
		chunks.reverse();

		// Step 3: Flatten the array
		return chunks.flat();
	}

	function GetWorldCupPosition(teams, playerTeam = null, groupID) {
		let groupNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
		let playerMatches = "";
		let newTeams = DeepClone([...teams]);

		// Inicializa o objeto de classificação
		let standings = {};
		for (let team of teams) {
			standings[team.name] = {
				team: team,
				points: 0,
				goalsFor: 0,
				goalsAgainst: 0,
				goalDifference: 0,
			};
		}

		// Simula todas as rodadas do torneio
		for (let round = 1; round < newTeams.length; round++) {
			let rotatedTeams = [...newTeams];

			// Rotaciona os times para nova rodada (método round-robin)
			let last = rotatedTeams.pop();
			rotatedTeams.splice(1, 0, last);

			// Joga os jogos da rodada
			for (let matchID = 0; matchID < rotatedTeams.length / 2; matchID++) {
				let homeIdx = matchID;
				let awayIdx = rotatedTeams.length - (matchID + 1);

				let homeTeam = rotatedTeams[homeIdx];
				let awayTeam = rotatedTeams[awayIdx];

				// Obtém resultado da partida
				let result = GetMatch(homeTeam, awayTeam);
				let homeGoals = result[0];
				let awayGoals = result[1];

				// Atualiza estatísticas
				standings[homeTeam.name].goalsFor += homeGoals;
				standings[homeTeam.name].goalsAgainst += awayGoals;
				standings[awayTeam.name].goalsFor += awayGoals;
				standings[awayTeam.name].goalsAgainst += homeGoals;

				// Calcula saldo de gols
				standings[homeTeam.name].goalDifference =
					standings[homeTeam.name].goalsFor - standings[homeTeam.name].goalsAgainst;
				standings[awayTeam.name].goalDifference =
					standings[awayTeam.name].goalsFor - standings[awayTeam.name].goalsAgainst;

				// Atribui pontos (3-vitória, 1-empate)
				if (homeGoals > awayGoals) {
					standings[homeTeam.name].points += 3;
				} else if (awayGoals > homeGoals) {
					standings[awayTeam.name].points += 3;
				} else {
					standings[homeTeam.name].points += 1;
					standings[awayTeam.name].points += 1;
				}

				// Registra partidas do time do jogador
				if (
					playerTeam &&
					(playerTeam.name === homeTeam.name || playerTeam.name === awayTeam.name)
				) {
					playerMatches += `-->${homeTeam.name} ${homeGoals} x ${awayGoals} ${awayTeam.name}`;
				}
			}

			newTeams = rotatedTeams;
		}

		// Converte para array e ordena
		let sortedStandings = Object.values(standings).sort((a, b) => {
			// 1º Critério: Pontos
			if (b.points !== a.points) return b.points - a.points;

			// 2º Critério: Saldo de Gols
			if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;

			// 3º Critério: Gols Marcados
			if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

			// 4º Critério: Confronto Direto (não implementado)
			return 0;
		});

		// Gera tabela final
		let table = sortedStandings.map((item) => item.team);
		let points = sortedStandings.map((item) => item.points);

		// Constrói descrição
		let desc = "--> Grupo " + groupNames[groupID];
		for (let i = 0; i < table.length; i++) {
			desc += `-> ${i + 1}º: ${table[i].name} (${sortedStandings[i].points} pts)`;
		}

		return {
			table: table,
			playerMatches: playerMatches,
			desc: desc,
			points: points,
		};
	}

	function GetMatch(team1, team2) {
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

	function GetExtraTime(team1, team2) {
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

	function GetPenalties(team1, team2) {
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

			let team2shooter = RandomNumber(0, team2Power * 100);
			let team1keeper = RandomNumber(0, team1Power * 80);

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

	function GetKnockoutResult(team1, team2, ida_e_volta) {
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

		let result = teamGoals1 > teamGoals2;

		return { result: result, game: gameDesc };
	}

	function GetNewTeams(currentPlayer) {
		let allTeams = leagues.reduce((acumulador, liga) => {
			return acumulador.concat(liga.highestLeague.teams);
		}, []);

		allTeams.sort((a, b) => {
			return b.power - a.power - Math.random();
		});

		allTeams = allTeams.slice(0, allTeams.length / (4 + currentPlayer.performance));

		let interestedTeams = [];

		for (let i = 0; i < 3; i++) {
			let teamID = RandomNumber(0, allTeams.length - 1);

			const isDuplicate = (teamName) => history.some((t) => t.team === teamName);

			while (isDuplicate(allTeams[teamID].name)) {
				teamID = RandomNumber(0, allTeams.length - 1);
			}

			let team = allTeams[teamID];

			interestedTeams.push(team);
			allTeams = allTeams.filter((t) => t.name !== team.name);
		}

		player.baseValue = Math.floor(player.baseValue * Math.exp(currentSeason.performance * 0.1));

		let contracts = [];

		for (let index = 0; index < 3; index++) {
			let team = interestedTeams[index];
			if (team) {
				// 20% chance to switch position
				let newPosition;
				if (currentPlayer.position.abbreviation !== "GO" && Math.random() < 0.2) {
					let relatedPositions = currentPlayer.position.related;
					newPosition = relatedPositions[RandomNumber(0, relatedPositions.length - 1)];
				} else {
					newPosition = currentPlayer.position.abbreviation;
				}

				let duration = RandomNumber(1, 4);
				duration += currentPlayer.age <= 28 ? RandomNumber(1, 2) : 0;

				contracts.push({
					team: team,
					duration: duration,
					loan: false,
					position: newPosition,
				});
			} else {
				contracts.push(null);
			}
		}

		return contracts;
	}

	function GetInitTeams(newTeams, currentPlayer) {
		// Step 1: Aggregate all teams
		let allTeams = newTeams.reduce((acumulador, liga) => {
			return acumulador.concat(liga.highestLeague.teams);
		}, []);

		// Step 2: Sort teams
		allTeams.sort((a, b) => b.power - a.power - Math.random());

		// Step 3: Slice top half of teams
		allTeams = allTeams.slice(0, allTeams.length / 2);

		// Step 4: Select 3 unique random teams
		const selectedTeams = [];

		const usedIndices = new Set();
		while (selectedTeams.length < 3) {
			const randomIndex = Math.floor(Math.random() * allTeams.length);
			if (!usedIndices.has(randomIndex)) {
				usedIndices.add(randomIndex);
				selectedTeams.push(allTeams[randomIndex]);
			}
		}

		// Step 5: Generate contracts and related values
		const updatedContracts = selectedTeams.map((team) => {
			// Determine position (20% chance of switch)
			let newPosition;
			if (currentPlayer.position.abbreviation !== "GO" && Math.random() < 0.2) {
				const relatedPositions = currentPlayer.position.related;
				newPosition = relatedPositions[RandomNumber(0, relatedPositions.length - 1)];
			} else {
				newPosition = currentPlayer.position.abbreviation;
			}

			// Contract duration
			const duration = RandomNumber(2, 6);

			// Return structured contract
			return {
				team: team,
				duration: duration,
				loan: false,
				position: newPosition,
			};
		});

		return updatedContracts;
	}

	function GetTransferValue(performance, positionMultiplier, age, peak, clubPower, fame) {
		const performanceMultiplier = 1.5 + performance / 2; //1.0 at -1 to 2.0 at +1

		const ageFactor = Math.max(1, 8.0 - Math.abs(peak - 4 - age) * 0.5); //5 at 18, 8 at 24, 5 at 30, 2 at 36

		const clubMultiplier = clubPower / 5; //0.4 at 2 to 2.0 at 10

		const fameMultiplier = Math.max(fame, 100) / ((age - 10) * 10); //1 at 100 and 20y, 2.5 at 500 and 30y, 3.2 at 800 and 35y, 4.0 at 1000 and 35y

		const transferValue =
			positionMultiplier *
			player.baseValue *
			performanceMultiplier *
			ageFactor *
			clubMultiplier *
			fameMultiplier;

		return Math.round(transferValue);
	}

	function Retire() {
		document.getElementById("team-choice").style.display = "none";
		document.getElementById("continue").style.display = "none";
		document.getElementById("chart").style.display = "flex";
	}

	function UpdateTeamsStats(limit) {
		let newTeams = DeepClone([...leagues]);
		let gains = [];
		let losses = [];

		for (let leagueID = 0; leagueID < newTeams.length; leagueID++) {
			let last = Math.random();

			// Liga principal
			let topTeams = newTeams[leagueID].highestLeague.teams;
			let topTeamIndices = Array.from({ length: topTeams.length }, (_, i) => i);
			topTeamIndices = shuffleArray(topTeamIndices);

			for (let i = 0; i < topTeams.length; i++) {
				let teamID = topTeamIndices[i];
				let team = topTeams[teamID];

				let current = Math.random();
				let change = Math.round(limit * (last - current)) / 100.0;
				last = current;

				let newPower = team.power + change;
				let originalPower = team.power;
				team.power = Math.round(100.0 * newPower) / 100;

				if (team.power > 10) team.power = 10;
				else if (team.power < 2) team.power = 2;

				let powerChange = team.power - originalPower;
				if (powerChange > 0) {
					gains.push({ team: team.name, change: powerChange });
				} else if (powerChange < 0) {
					losses.push({ team: team.name, change: powerChange });
				}
			}

			topTeams.sort((a, b) => b.power - a.power);

			// Liga secundária
			let lowerTeams = newTeams[leagueID].lowerLeague.teams;
			let lowerTeamIndices = Array.from({ length: lowerTeams.length }, (_, i) => i);
			lowerTeamIndices = shuffleArray(lowerTeamIndices);

			for (let i = 0; i < lowerTeams.length; i++) {
				let teamID = lowerTeamIndices[i];
				let team = lowerTeams[teamID];

				let current = Math.random();
				let change = Math.round(limit * (last - current)) / 100.0;
				last = current;

				let newPower = team.power + change;
				let originalPower = team.power;
				team.power = Math.round(100.0 * newPower) / 100;

				if (team.power > 10) team.power = 10;
				else if (team.power < 2) team.power = 2;

				let powerChange = team.power - originalPower;
				if (powerChange > 0) {
					gains.push({ team: team.name, change: powerChange });
				} else if (powerChange < 0) {
					losses.push({ team: team.name, change: powerChange });
				}
			}

			lowerTeams.sort((a, b) => b.power - a.power);
		}

		gains.sort((a, b) => b.change - a.change);
		losses.sort((a, b) => a.change - b.change);

		let topGains = gains.slice(0, 10);
		let topLosses = losses.slice(0, 10);

		setLeagues(newTeams);
		return { newTeams, topGains, topLosses };
	}

	function UpdateExtraTeamsStats() {
		let newTeams = DeepClone([...extrateams]);
		for (let confID = 0; confID < extrateams.length; confID++) {
			let last = Math.random();
			let teamIndices = Array.from({ length: newTeams[confID].teams.length }, (_, index) => index);
			teamIndices = shuffleArray(teamIndices);

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

			newTeams[confID].teams.sort((a, b) => {
				return b.power - a.power;
			});
		}
		setExtraTeams(newTeams);
		return newTeams;
	}

	function UpdateNationsStats() {
		let allNations = DeepClone([...nations]);
		let gains = [];
		let losses = [];

		for (let leagueID = 0; leagueID < allNations.length; leagueID++) {
			let last = Math.random();
			let nationIndices = Array.from(
				{ length: allNations[leagueID].teams.length },
				(_, index) => index
			);
			nationIndices = shuffleArray(nationIndices);

			for (let i = 0; i < allNations[leagueID].teams.length; i++) {
				let nationID = nationIndices[i];
				let nation = allNations[leagueID].teams[nationID];

				let current = Math.random();
				let change = Math.round(40.0 * (last - current)) / 100.0;
				last = current;

				let newPower = nation.power + change;

				nation.power = Math.round(100.0 * newPower) / 100.0;

				if (nation.power > 10) nation.power = 10;
				else if (nation.power < 2) nation.power = 2;

				let powerChange = nation.power - (newPower - change);
				if (powerChange > 0) {
					gains.push({ nation: nation.name, change: powerChange });
				} else if (powerChange < 0) {
					losses.push({ nation: nation.name, change: powerChange });
				}
			}

			allNations[leagueID].teams.sort((a, b) => {
				return b.power - a.power;
			});
		}

		gains.sort((a, b) => b.change - a.change);
		losses.sort((a, b) => a.change - b.change);

		let topGains = gains.slice(0, 10);
		let topLosses = losses.slice(0, 10);

		setNations(allNations);
		return { allNations, topGains, topLosses };
	}

	return (
		<>
			<header>
				<h1>Football Career Simulator</h1>
				<h3 style={{ marginTop: "1rem" }}>Como Jogar</h3>
				<ol style={{ marginLeft: "2rem" }}>
					<li>Escolha seus dados iniciais.</li>
					<li>Escolha qual proposta você aceitará.</li>
					<li>O jogo simulará a partir do que você escolheu</li>
					<li>Boa sorte e divirta-se</li>
				</ol>
			</header>
			<main>
				<section
					className="career"
					ref={parentRef}>
					{seasons.map((s, index) => (
						<div
							key={index}
							className="season-container">
							<Season
								season={s}
								open={index >= seasons.length - 1}
							/>
						</div>
					))}
				</section>
				<section
					className="choices"
					id="init-nation">
					<select
						id="continent-dropdown"
						onChange={() => updateNationDropdown()}>
						<option value="">Selecione uma Confederação</option>
						<option value="AFC">Ásia e Oceania</option>
						<option value="CAF">África</option>
						<option value="CONCACAF">América do Norte</option>
						<option value="CONMEBOL">América do Sul</option>
						<option value="UEFA">Europa</option>
					</select>
					<select id="nation-dropdown">
						<option value="">Selecione uma Nação</option>
					</select>
					<button
						className="confirm-button"
						onClick={() => ChooseNation()}>
						Confirmar
					</button>
				</section>
				<section
					className="choices"
					id="init-pos"
					style={{ display: "none" }}>
					<h3 style={{ marginBottom: "1rem" }}>Escolha a posição do jogador:</h3>
					<select id="position-select">
						{Positions.map((position, index) => (
							<option
								key={index}
								value={position.title}>
								{position.title}
							</option>
						))}
					</select>
					<button
						className="confirm-button"
						onClick={() => ChoosePos()}>
						Confirmar
					</button>
				</section>
				<section
					className="choices"
					id="team-choice"
					style={{ display: "none" }}>
					<button
						className="d-stay contract"
						id="decision-stay"
						style={{ display: "none" }}
						onClick={() => ChooseTeam()}>
						<p>{player.team === null ? "null" : player.team.name}</p>
						<div className="contract-info">
							<div>{player.team === null ? "null" : (player.team.power / 2).toFixed(2)} ⭐</div>
							<div>
								{renew.duration}
								{renew.addition != null && renew.addition > 0 ? ` + ${renew.addition}` : ""} 🕗
							</div>
							<div>{renew.position} 👕</div>
						</div>
					</button>
					<button
						className="d-alert contract"
						id="decision-transfer1"
						onClick={() => ChooseTeam(transfers[0])}>
						{transfers[0] ? (
							<>
								{transfers[0].loan ? <div>Empréstimo</div> : ""}
								<p>{transfers[0].team.name}</p>
								<div className="contract-info">
									<div>{(transfers[0].team.power / 2).toFixed(2)} ⭐</div>
									<div>{transfers[0].duration} 🕗</div>
									<div>{transfers[0].position} 👕</div>
								</div>
							</>
						) : (
							<p>null</p>
						)}
					</button>
					<button
						className="d-alert contract"
						id="decision-transfer2"
						onClick={() => ChooseTeam(transfers[1])}>
						{transfers[1] ? (
							<>
								{transfers[1].loan ? <div>Empréstimo</div> : ""}
								<p>{transfers[1].team.name}</p>
								<div className="contract-info">
									<div>{(transfers[1].team.power / 2).toFixed(2)} ⭐</div>
									<div>{transfers[1].duration} 🕗</div>
									<div>{transfers[1].position} 👕</div>
								</div>
							</>
						) : (
							<p>null</p>
						)}
					</button>
					<button
						className="d-alert contract"
						id="decision-transfer3"
						onClick={() => ChooseTeam(transfers[2])}>
						{transfers[2] ? (
							<>
								{transfers[2].loan ? <div>Empréstimo</div> : ""}
								<p>{transfers[2].team.name}</p>
								<div className="contract-info">
									<div>{(transfers[2].team.power / 2).toFixed(2)} ⭐</div>
									<div>{transfers[2].duration} 🕗</div>
									<div>{transfers[2].position} 👕</div>
								</div>
							</>
						) : (
							<p>null</p>
						)}
					</button>
					<button
						className="d-alert"
						id="retire"
						style={{ display: "none" }}
						onClick={() => Retire()}>
						Aposentar-se
					</button>
				</section>
				<section
					className="choices"
					id="continue"
					style={{ display: "none" }}>
					<button
						className="d-stay"
						onClick={() => Continue()}>
						Simular ({contract} {contract > 1 ? "anos restantes" : "ano restante"})
					</button>
				</section>
				<section
					className="chart"
					id="chart"
					style={{ display: "none" }}>
					<ChartComponent data={seasons} />
				</section>
				<section className="stats">
					<h1>Carreira</h1>
					<div className="stats-div">
						Fama: {StarPath[Math.min(Math.floor(player.fame / 100), StarPath.length - 1)]}
						<div
							style={{
								position: "relative", // This ensures absolute positioning works inside it
								width: "100%",
								height: "1rem",
								backgroundColor: "var(--color-medium)",
							}}>
							<div
								style={{
									width: `${player.fame < 1000 ? Math.floor(player.fame) % 100 : 100}%`,
									minHeight: "1rem",
									backgroundColor: `${player.fame < 1000 ? "var(--color-contrast)" : "gold"}`,
									margin: "0",
								}}
							/>

							<span
								style={{
									position: "absolute", // Use absolute for easier centering
									top: "50%", // Center vertically
									left: "50%", // Center horizontally
									transform: "translate(-50%, -50%)", // This will center perfectly
									color: "var(--color-dark)",
								}}>
								{Math.floor(player.fame)}
							</span>
						</div>
						<p>Posição: {player.position === null ? "A definir" : player.position.title}</p>
						<p>Seleção: {player.nation === null ? "A definir" : player.nation.name}</p>
					</div>
					<div className="stats-div">
						<div className="stats-div-div">
							<details>
								<summary>Continental: {player.continentalChampionship.length}</summary>
								<div>
									{player.continentalChampionship.map((wc) => (
										<p key={wc}>{wc}</p>
									))}
								</div>
							</details>
							<details>
								<summary>Copa do Mundo: {player.worldCup.length}</summary>
								<div>
									{player.worldCup.map((wc) => (
										<p key={wc}>{wc}</p>
									))}
								</div>
							</details>
						</div>
					</div>
					<div className="stats-div">
						<p>Gols: {player.totalGoals}</p>
						<p>Assistências: {player.totalAssists}</p>
					</div>
					<div className="stats-div">
						<div className="stats-div-div">
							<details>
								<summary className="titles-title">Ligas: {player.leagueTitles.length}</summary>
								<div>
									{player.leagueTitles.map((l) => (
										<p key={l}>{l}</p>
									))}
								</div>
							</details>
							<details>
								<summary>Copas Nacionais: {player.nationalCup.length}</summary>
								<div>
									{player.nationalCup.map((nc) => (
										<p key={nc}>{nc}</p>
									))}
								</div>
							</details>
							<details>
								<summary>Champions League: {player.champions.length}</summary>
								<div>
									{player.champions.map((ch) => (
										<p key={ch}>{ch}</p>
									))}
								</div>
							</details>
							<details>
								<summary>Mundial de Clubes: {player.clubWorldCup.length}</summary>
								<div>
									{player.clubWorldCup.map((cwc) => (
										<p key={cwc}>{cwc}</p>
									))}
								</div>
							</details>
							<details>
								<summary>Premiações: {player.awards.length}</summary>
								<div>
									{player.awards.map((a) => (
										<p key={a}>{a}</p>
									))}
								</div>
							</details>
							<details>
								<summary>Jogador da Temporada: {player.playerOfTheSeason.length}</summary>
								<div>
									{player.playerOfTheSeason.map((b) => (
										<p key={b}>{b}</p>
									))}
								</div>
							</details>
						</div>
					</div>
				</section>
			</main>
			<footer>
				<p>Por Gustavo Amamia Kumagai</p>
			</footer>
		</>
	);
}

export default App;
