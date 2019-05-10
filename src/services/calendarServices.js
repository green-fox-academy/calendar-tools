const runEventOrganizer = window.runCohortSorting;

const getCohortList = () => {
	return new Promise((resolve, reject) => {
		if (window.cohortsList !== undefined){
			resolve(window.cohortsList);
			return;
		}
		let counter = 0;
		const intervalId = setInterval(() => {
			if (counter >= 10){
				clearInterval(intervalId);
				reject('Could not find calendar resource!');
				return;
			}
			if (window.cohortsList !== undefined){
				clearInterval(intervalId);
				resolve(window.cohortsList);
				return;
			}
			counter++;
		},1000);
	});
};

const getCohortCalendarInfos = window.calendarFunctions.getCohortCalendarInfos;

const insertEventList = window.calendarFunctions.insertEventList;

const getCalendarInfo = window.getCalendarInfo;

const getCalendarList = window.getCalendarList;

export {
	runEventOrganizer,
	getCohortList,
	getCohortCalendarInfos,
	insertEventList,
	getCalendarInfo,
	getCalendarList
};