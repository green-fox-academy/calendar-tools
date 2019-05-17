function gcd_two_numbers(x, y) { // greatest common divisor
  if ((typeof x !== 'number') || (typeof y !== 'number')) 
    return false;
  x = Math.abs(x);
  y = Math.abs(y);
  while(y) {
    var t = y;
    y = x % y;
    x = t;
  }
  return x;
}

const areIntervalsOverlapping = (i1, i2) => {
  if (i1.start >= i2.end){return false;}
  if (i2.start >= i1.end){return false;}
  return true;
};

const convertEventToInterval = (event) => {
  const timeParts = event.start.dateTime.split('T');
  const startTime = new Date(event.start.dateTime);
  const endTime = new Date(event.end.dateTime);
  const start = (startTime.getTime()-(startTime.getTimezoneOffset()*60000))%(86400000);
  const end = (endTime.getTime()-(endTime.getTimezoneOffset()*60000))%(86400000);
  const result = {};
  result[timeParts[0]] = {start, end};
  return result;
};

const mapEventsToAvailabilityArrays = (events, {days, dayStart, dayEnd, sessionLength, breakAfter, breakLength /* , eventType, personPerSession */}) => {
  const eventIntervals = events.reduce((prev, event) => {
    const evInt = convertEventToInterval(event);
    const key = Object.keys(evInt)[0];
    if (prev[key] === undefined){prev[key] = [];}
    prev[key].push(evInt[key]);
    return prev;
  },{});
  const smallestTimeInterval = gcd_two_numbers(sessionLength, breakLength);
  const activityMap = days.reduce((prev, day) => {
    let actStart = dayStart;
    let actEnd = actStart + smallestTimeInterval;
    prev[day] = [];
    while(actEnd <= dayEnd){
      const isAvailable = eventIntervals[day] === undefined ? true : eventIntervals[day].reduce((prev, evInt) => {
        return prev && !areIntervalsOverlapping(evInt, {start:actStart, end: actEnd});
      }, true);
      prev[day].push(isAvailable);
      actStart = actEnd;
      actEnd = actStart + smallestTimeInterval;
    }
    return prev;
  },{});
  return activityMap;
};