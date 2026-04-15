import React, { useRef, useEffect } from "react";
import Chart from "chart.js/auto";

const ChartComponent = ({ data }) => {
	const chartRef1 = useRef(null);
	const chartRef2 = useRef(null);
	const chartRef3 = useRef(null);

	useEffect(() => {
		const rootStyles = getComputedStyle(document.documentElement);
		const colorDark = rootStyles.getPropertyValue("--color-dark").trim();
		const colorMedium = rootStyles.getPropertyValue("--color-medium").trim();
		const colorLight = rootStyles.getPropertyValue("--color-light").trim();
		const colorContrast = rootStyles.getPropertyValue("--color-contrast").trim();

		const chartOptions = {
			scales: {
				x: {
					grid: {
						color: colorDark,
					},
					ticks: {
						color: colorContrast,
					},
				},
				y: {
					grid: {
						color: colorDark,
					},
					ticks: {
						color: colorContrast,
					},
				},
			},
			plugins: {
				title: {
					display: true,
					color: colorContrast,
				},
				legend: {
					labels: {
						color: colorContrast,
					},
				},
				tooltip: {
					titleColor: colorContrast,
					bodyColor: colorContrast,
					backgroundColor: colorDark,

					titleFont: {
						family: "Nunito",
						size: 16,
						weight: "bold",
					},

					bodyFont: {
						family: "Nunito",
						size: 14,
						weight: "normal",
					},
				},
			},
		};

		const chart1 = new Chart(chartRef1.current, {
			type: "line", // specify chart type, e.g. line, bar, pie, etc.
			data: {
				labels: data.map((item) => item.age), // x-axis labels
				datasets: [
					{
						label: "Fama",
						data: data.map((item) => item.fame), // y-axis data
						backgroundColor: colorLight,
						borderColor: colorLight,
					},
				],
			},
			options: chartOptions,
		});

		const chart2 = new Chart(chartRef2.current, {
			type: "line", // specify chart type, e.g. line, bar, pie, etc.
			data: {
				labels: data.map((item) => item.year), // x-axis labels
				datasets: [
					{
						label: "Gols",
						data: data.map((item) => item.goals), // y-axis data
						backgroundColor: colorLight,
						borderColor: colorLight,
					},
					{
						label: "Assistências",
						data: data.map((item) => item.assists), // y-axis data
						backgroundColor: colorMedium,
						borderColor: colorMedium,
					},
				],
			},
			options: chartOptions,
		});

		const chart3 = new Chart(chartRef3.current, {
			type: "line", // specify chart type, e.g. line, bar, pie, etc.
			data: {
				labels: data.map((item) => item.age), // x-axis labels
				datasets: [
					{
						label: "Valor (M)",
						data: data.map((item) => Math.floor(item.marketValue / 100000) / 10), // y-axis data
						backgroundColor: colorContrast,
						borderColor: colorContrast,
					},
				],
			},
			options: chartOptions,
		});

		// Clean up the chart when component unmounts
		return () => {
			chart1.destroy();
			chart2.destroy();
			chart3.destroy();
		};
	}, [data]);

	return (
		<div>
			<canvas ref={chartRef1} />
			<canvas ref={chartRef2} />
			<canvas ref={chartRef3} />
		</div>
	);
};

export default ChartComponent;
