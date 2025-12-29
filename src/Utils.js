export function RandomNumber(min, max) {
	// min and max included
	return Math.floor(Math.random() * (max + 1 - min) + min);
}

export function DeepClone(obj) {
	if (obj === null || typeof obj !== "object") {
		return obj;
	}

	if (Array.isArray(obj)) {
		const newArray = [];
		for (let i = 0; i < obj.length; i++) {
			newArray[i] = DeepClone(obj[i]);
		}
		return newArray;
	}

	const newObj = {};
	for (let key in obj) {
		if (obj.hasOwnProperty(key)) {
			newObj[key] = DeepClone(obj[key]);
		}
	}

	return newObj;
}

export function FormatarNumero(num) {
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1) + "M";
	} else if (num >= 1000) {
		return (num / 1000).toFixed(1) + "k";
	} else {
		return num.toString();
	}
}

export function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

export function weightedAverage(arr) {
	let weightedSum = 0;
	let totalWeight = 0;

	for (const obj of arr) {
		if (typeof obj.stat === "number" && typeof obj.multiplier === "number") {
			weightedSum += obj.stat * obj.multiplier;
			totalWeight += obj.multiplier;
		}
	}

	if (totalWeight === 0) return 0;

	return weightedSum / totalWeight;
}

