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
import { GetKnockoutResult } from "./Utils/matchUtils";
import {
  GetLeaguePosition,
  GetChampionsPosition,
  GetTournamentResults,
  DrawWorldGroups,
  euroCupDraw,
  americanCupDraw,
  africanAsianCupDraw,
  worldCupDraw,
  clubWorldCupDraw,
  DrawClubWorldCupGroups,
} from "./Utils/tournamentUtils";
import { GetInitTeams, GetNewTeams, GetTransferValue } from "./Utils/transferUtils";
import { computeTeamsStats, computeExtraTeamsStats, computeNationsStats } from "./Utils/statsUtils";

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

	const [year, setYear] = useState(new Date().getFullYear() - 1 );

	const [contract, setContract] = useState(0);

	const [generalPerformance, setGeneralPerformance] = useState([]);

	const [transfers, setTransfers] = useState([]);

	const [uefaWinners, setUefaWinners] = useState([]); //incluir aqui os ganhadores passados

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

		console.log("Resultados das ligas atualizados:", leagueResults);

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
				player.fame,
				player.baseValue
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
			player.fame,
			player.baseValue
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
		let triplice = 0;
		let competitionPerformance = 0;

		// Set champions qualification based on last season
		let lastPlayerLeagueResult = lastLeagueResults.find((league) => league.country === player.team.country);
		if (lastPlayerLeagueResult) {
			let lp = lastPlayerLeagueResult.table.findIndex((team) => team.name === player.team.name) + 1;
			player.championsQualification = lp > 0 && lp <= lastPlayerLeagueResult.championsSpots;
		} else {
			player.championsQualification = false;
		}

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

			const { groups, playedClubWC } = DrawClubWorldCupGroups({
				extrateams,
				leagues,
				nations,
				worldCupHistoryHosts,
				uefaWinners,
				year,
				playerTeam: player.team,
			});

			setUefaWinners([]);

			let clubWorldCupDescription = [];
			let clubWorldCupResults = GetTournamentResults(groups, 8, clubWorldCupDraw, player.team);

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

			if(eurocopaResults.playerPosition != null) competitionPerformance += (4 - eurocopaResults.playerPosition) / 20 //max 0.2

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

			if(americanResults.playerPosition != null) competitionPerformance += (4 - americanResults.playerPosition) / 20 //max 0.2

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

			if(africanResults.playerPosition != null) competitionPerformance += (4 - africanResults.playerPosition) / 20 //max 0.2

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

			if(asianResults.playerPosition != null) competitionPerformance += (4 - asianResults.playerPosition) / 20 //max 0.2

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

			//was called by the manager
			let playedWorldCup =
				player.team.power +
					currentSeason.starting / 100 +
					currentSeason.performance +
					player.fame / 1000 >=
				player.nation.power;

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

				// Adicionar duas das equipes restantes à lista de equipes para os playoffs
				if (region.name !== "UEFA") {
					let regionPlayoffs = region.teams.splice(0, 2);
					playoffClassif = playoffClassif.concat(regionPlayoffs);
				}
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

			let groups = DrawWorldGroups(allClassifNations, hostsAreFirst.length);

			// Verificar se a nação do novo jogador está entre as nações qualificadas para a Copa do Mundo
			let classifToWorldCup = allClassifNations.some((t) => t.name === player.nation.name);

			let results = GetTournamentResults(groups, 8, worldCupDraw, player.nation);

			if(results.playerPosition != null) competitionPerformance += (4 - results.playerPosition) / 20 //max 0.2

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
		let { contracts: newTransfers, newBaseValue } = GetNewTeams(
			player,
			leagues,
			history,
			currentSeason.performance
		);
		player.baseValue = newBaseValue;
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

	function Retire() {
		document.getElementById("team-choice").style.display = "none";
		document.getElementById("continue").style.display = "none";
		document.getElementById("chart").style.display = "flex";
	}

	function UpdateTeamsStats(limit) {
		const result = computeTeamsStats(leagues, limit);
		setLeagues(result.newTeams);
		return result;
	}

	function UpdateExtraTeamsStats() {
		const newTeams = computeExtraTeamsStats(extrateams);
		setExtraTeams(newTeams);
		return newTeams;
	}

	function UpdateNationsStats() {
		const result = computeNationsStats(nations);
		setNations(result.allNations);
		return result;
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
						<option value="AFC">Ásia (AFC)</option>
						<option value="CAF">África (CAF)</option>
						<option value="CONCACAF">América do Norte (CONCACAF)</option>
						<option value="CONMEBOL">América do Sul (CONMEBOL)</option>
						<option value="OFC">Oceania (OFC)</option>
						<option value="UEFA">Europa (UEFA)</option>
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
