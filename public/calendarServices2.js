//takes Date Objects
const getMinMaxFromDays = (days) => {
  if (days.length === 0){return null;}
  const result = days.reduce((rangeObject, day) => {
    if (rangeObject.timeMin === null || rangeObject.timeMin > day){rangeObject.timeMin = day;}
    if (rangeObject.timeMax === null || rangeObject.timeMax < day){rangeObject.timeMax = day;}
    return rangeObject;
  },{timeMin:null,timeMax:null});
  result.timeMax.setDate(result.timeMax.getDate()+1);
  result.timeMin = result.timeMin.toISOString();
  result.timeMax = result.timeMax.toISOString();
  return result;
};

function getCalendarEvents(options){
  return new Promise((res, rej) => {
    gapi.client.calendar.calendars.get({calendarId: options.calendarId}).then((calendarInfo) => {
      gapi.client.calendar.events.list(options).then(resp=> {
        const events = resp.result.items.filter(event => event.start.dateTime !== undefined);
        res({id: options.calendarId, label: calendarInfo.result.summary, events});
      });
    });
  });
}

function getCalendarInfo(options){
  return new Promise((res, rej) => {
    gapi.client.calendar.calendars.get({calendarId: options.calendarId}).then((calendarInfo) => {
      res({id: options.calendarId, label: calendarInfo.result.summary, count:1});
    });
  });
}

async function doSomeBatchedCalendarQuery(cohortName, baseOption, calendarQueryFunction){
  const cIDs = cohorts.reduce((calendarIdArray, cohortData) => {
    return calendarIdArray || (cohortData.name === cohortName ? cohortData.calendars : null);
  }, null);
  if (cIDs === null){alert('No calendars for this cohort found');throw(new Error({message:'No calendars for this cohort found'}));return;}

  const calendarPromiseArray = cIDs.map((calId) => {return calendarQueryFunction(Object.assign({},baseOption,{calendarId: calId}));});
  const calendarCollection = {};
  for (let ind = 0; ind < calendarPromiseArray.length; ind++){
    const cData = await calendarPromiseArray[ind];
    calendarCollection[cData.id] = cData;
  }
  return calendarCollection;
}

function getCohortCalendarEvents(cohortName, days){
  return new Promise((resolve, reject) => {
    const options = Object.assign({
      'showDeleted': false,
      'singleEvents': true,
      'orderBy': 'startTime'
    },getMinMaxFromDays(days.map(day => new Date(day))));
    doSomeBatchedCalendarQuery(cohortName,options,getCalendarEvents).then((response)=>{resolve(response)}).catch((error)=>{reject(error)});
  });
}

function getCohortCalendarInfos(cohortName){
  return new Promise((resolve, reject) => {
    doSomeBatchedCalendarQuery(cohortName,{},getCalendarInfo).then((response)=>{resolve(response)}).catch((error)=>{reject(error)});
  });
}


function insertEvent(event){
  return gapi.client.calendar.events.insert({
    calendarId: 'primary',
    resource: event
  });
}

function insertEventList(eventList){
  return new Promise((resolve, reject) => {
    var batch = gapi.client.newBatch();
    eventList.forEach(event => batch.add(insertEvent(event)));
    batch.then((response) => {resolve(response);}).catch((error)=>{reject(error);});
  });
}

calendarFunctions = {
  getCohortCalendarEvents,
  getCohortCalendarInfos,
  insertEvent,
  insertEventList
}