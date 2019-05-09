// time pointer:
// {day, segmentCounter}
const isSessionPossibleOnTimePointer = ({mappedTeamCalendar, timePointer, segmentPerSession}) => {
	for (let ind = timePointer.segmentCounter; ind < timePointer.segmentCounter+segmentPerSession; ind++){
		if (mappedTeamCalendar[timePointer.day][ind] === false){return false;}
	}
	return true;
}

// time pointer:
// {day, segmentCounter}

// cohortAttendanceCount
// {<cohort id>: remaining session}
// this is one of the standdown conditions
const createCohortEventMapping = ({cohortMappedAvailability, teamPerSession, segmentPerSession, segmentPerBreak, segmentBeforeBreakNeeded, breaklessSegmentCounterParam=0, cohortAttendanceCountParam, timePointerParam=null, targetCalendarParam=null}) => {
	//(0.1) if there are no cohorts, return generated target calendar
	//(0.2) if target calendar is null, create one
	//(0.3) if the timepointer is unset, initialize it
	//(0.4) if the timepointer ran out of days, return generated target calendar
	//(1) get fitting cohort team on timepointer
	//(1.1) if no cohort is fitting, increment timepointer, and call recursively
		//(3.3) if new day is started, reset breaklessSegmentCounter
	// otherwise:
	//(2) get minimum of required cohort attendace and available sales team
	//(3) record amount in target calendar
	//(3.1) if a new session slot was started, increment breaklessSegmentCounter
	//(3.2) if no free attendance slots remain for the timepointer, iterate timepointer
		//(3.3) if new day is started, reset breaklessSegmentCounter
	//(3.4) if break needed, iterate timepointer and reset breaklessSegmentCounter
	//(4) change required cohort attendance in used cohort, if attendance gets to zero, remove id from list and call recursively
	let targetCalendar = Object.assign({},targetCalendarParam);
	let timePointer = Object.assign({},timePointerParam);
	let cohortAttendanceCount = Object.assign({},cohortAttendanceCountParam);
	let breaklessSegmentCounter = breaklessSegmentCounterParam;

	function getIteratedTimePointerWith(segments){
		const newPointer = Object.assign({},timePointer);
		newPointer.segmentCounter+=segments;
		if (targetCalendar[newPointer.day].length < newPointer.segmentCounter+segmentPerSession){
			newPointer.segmentCounter = 0;
			const days = Object.keys(targetCalendar);
			newPointer.day = days[days.indexOf(timePointer.day)+1];
			//(3.3)
			breaklessSegmentCounter = 0;
		}
		return newPointer;
	}

	//(0.1)
	if (Object.keys(cohortAttendanceCount).length === 0){return targetCalendar;}

	//(0.2)
	if (targetCalendar === null || Object.keys(targetCalendar).length === 0){
		const timeSlotBlueprint = cohortMappedAvailability[Object.keys(cohortMappedAvailability)[0]].mappedTimeslots;
		targetCalendar = Object.keys(timeSlotBlueprint).reduce((emptyCalendar,day) => {
			emptyCalendar[day] = timeSlotBlueprint[day].map(elem => []); // each time segment can have multiple cohort attendees, so each segment will contain an array
			return emptyCalendar;
		},{});
	}
	//(0.3)
	if (timePointer === null || Object.keys(timePointer).length === 0){
		timePointer = {
			day: Object.keys(targetCalendar)[0],
			segmentCounter: 0
		};
	}
	//(0.4)
	if (timePointer.day === undefined){return targetCalendar;}

	//(1)
	const cohortId = Object.keys(cohortAttendanceCount).reduce((foundCohort, actId) => {
		if (foundCohort){return foundCohort;}
		if (isSessionPossibleOnTimePointer({mappedTeamCalendar:cohortMappedAvailability[actId].mappedTimeslots, timePointer, segmentPerSession})){return actId;}
		return null;
	},null);
	//(1.1)
	if (cohortId === null){
		timePointer = getIteratedTimePointerWith(segmentPerSession); // CUSTOMIZE: this decides if you want to make an entire session shift, or just a segment
		return createCohortEventMapping({cohortMappedAvailability, teamPerSession, segmentPerSession, segmentPerBreak, segmentBeforeBreakNeeded, breaklessSegmentCounterParam: breaklessSegmentCounter, cohortAttendanceCountParam:cohortAttendanceCount, timePointerParam:timePointer, targetCalendarParam:targetCalendar});
	}

	//(2)
	const freeSlotsOnTime = teamPerSession - targetCalendar[timePointer.day][timePointer.segmentCounter].length;
	const designationCount = freeSlotsOnTime < cohortAttendanceCount[cohortId] ? freeSlotsOnTime : cohortAttendanceCount[cohortId];

	//(3)
	for (let ind = 0; ind < designationCount; ind++){
		targetCalendar[timePointer.day][timePointer.segmentCounter].push(cohortId);
	}
	//(3.1)
	if (targetCalendar[timePointer.day][timePointer.segmentCounter].length === designationCount){
		breaklessSegmentCounter += segmentPerSession;
	}
	//(3.2)
	if (targetCalendar[timePointer.day][timePointer.segmentCounter].length === teamPerSession){
		timePointer = getIteratedTimePointerWith(segmentPerSession);
		//(3.4)
		if (breaklessSegmentCounter >= segmentBeforeBreakNeeded){
			timePointer = getIteratedTimePointerWith(segmentPerBreak);
			breaklessSegmentCounter = 0;
		}
	}
	//(4)
	cohortAttendanceCount[cohortId] -= designationCount;
	if (cohortAttendanceCount[cohortId] === 0){
		delete cohortAttendanceCount[cohortId];
	}
	return createCohortEventMapping({cohortMappedAvailability, teamPerSession, segmentPerSession, segmentPerBreak, segmentBeforeBreakNeeded, breaklessSegmentCounterParam: breaklessSegmentCounter, cohortAttendanceCountParam:cohortAttendanceCount, timePointerParam:timePointer, targetCalendarParam:targetCalendar});
}