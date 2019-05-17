import React from 'react';
import { Link } from "react-router-dom";
import { InputField, DaysSelector } from './InteractComps';
import { ResultVisualizer } from './ResultVisualizerComp';
import { gcd_two_numbers, downloadObjectAsJson, sanitizeTime } from '../../utilities/utilities';
import { runEventOrganizer, getCohortCalendarInfos, getCohortList } from '../../services/calendarServices';

class SalesEventOrganizerComponent extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      inputs: {
        cohortName: 'Megalotis',
        days: [(new Date()).toISOString().split('T')[0]],
        eventName: 'Névtelen esemény',
        teamPerSession: '1',
        dayStart:'09:00',
        dayEnd:'16:00',
        sessionLength:'60',
        breakAfter: '120',
        breakLength: '30',
        simplifiedAttendanceCount: '1'
      },
      labels: {
        eventName: 'Esemény neve:',
        teamPerSession: 'Párhuzamos csapatok száma:',
        dayStart:'Nap kezdete(HH:MM):',
        dayEnd:'Nap vége(HH:MM):',
        sessionLength:'Egy foglalkozás hossza(perc):',
        breakAfter: 'Szünet nélküli idő(perc):',
        breakLength: 'Szünet hossza(perc):'
      },
      inputfieldToValue: {
        eventName: a => a,
        cohortName: a => a,
        teamPerSession: (a) => Number(a),
        dayStart: this.timeToMillisec,
        dayEnd:this.timeToMillisec,
        sessionLength: (minute)=>{return this.timeToMillisec('0:'+minute)},
        breakAfter: (minute)=>{return this.timeToMillisec('0:'+minute)},
        breakLength: (minute)=>{return this.timeToMillisec('0:'+minute)},
      },
      fieldValueSanitizer: {
        dayStart: sanitizeTime,
        dayEnd: sanitizeTime,
      },
      calculatedEvents: [],
      calendarInfos: [],
      errorText: '',
      cohortList: []
    };
    this.load = this.load.bind(this);
    this.doRun = this.doRun.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.timeToMillisec = this.timeToMillisec.bind(this);
    this.millisecToTime = this.millisecToTime.bind(this);
    this.addOneDay = this.addOneDay.bind(this);
    this.removeOneDay = this.removeOneDay.bind(this);
    this.changeOneDay = this.changeOneDay.bind(this);
    this.getVisualizedDay = this.getVisualizedDay.bind(this);
    this.changeAllAttendance = this.changeAllAttendance.bind(this);
    this.exportVisualizedData = this.exportVisualizedData.bind(this);
    getCohortList().then((cohorts) => {
      this.setState(prevState => {
        prevState.cohortList = cohorts;
        prevState.inputs.cohortName = cohorts[0].name;
        return prevState;
      })
    });
  }
  timeToMillisec(str){
    const parts = sanitizeTime(str).split(':');
    return (Number(parts[0])*60+Number(parts[1]))*60000;
  }
  millisecToTime(millis){
    const minutes = parseInt(millis/60000)%60;
    const hours = parseInt(millis/3600000);
    return (hours<10?'0'+hours:hours)+":"+(minutes<10?'0'+minutes:minutes);
  }
  getVisualizedDay(dayLabel,dayInfo){
    const sessionLengthMinute = Number(this.state.inputs.sessionLength);
    const dayStartMillis = this.timeToMillisec(this.state.inputs.dayStart);
    const segmentMillis = gcd_two_numbers(Number(this.state.inputs.breakLength),sessionLengthMinute)*60000;
    const visualData = {
      day: dayLabel,
      sessions: dayInfo.reduce((sessionOnADay,segmentInfo,index) => {
        if(segmentInfo.length === 0){return sessionOnADay;}
        const sessionBluePrint = {
          sessionLength: sessionLengthMinute,
          startTime: this.millisecToTime(dayStartMillis+segmentMillis*index)
        };
        segmentInfo.forEach((teamName,index) => {
          sessionOnADay.push(Object.assign({},sessionBluePrint,{label:teamName,paralellIndex:index}));
        });
        return sessionOnADay;
      },[]),
      maxParalell: Number(this.state.inputs.teamPerSession)
    }
    return visualData;
  }
  doRun() {
    const state = this.state;
    const inputOptions = Object.keys(this.state.labels).reduce((initialOptions, key) => {
      initialOptions[key] = state.inputfieldToValue[key](state.inputs[key]);
      return initialOptions;
    },{});
    inputOptions.cohortAttendanceCountParam = this.state.calendarInfos.reduce((attendanceNeeded, calInfo) => {
      attendanceNeeded[calInfo.id] = Number(calInfo.count);
      return attendanceNeeded;
    },{});
    runEventOrganizer(Object.assign({},this.state.inputs,inputOptions)).then((response) => {
      const sortedCount = Object.keys(response.sorted).reduce((sum, key) => {return response.sorted[key].reduce((subsum, eventsArray) => {return subsum+eventsArray.length;},sum);},0);
      const expectedCount = this.state.calendarInfos.reduce((sum, calInfo) => sum+calInfo.count,0);
      this.setState(prevState => {
        prevState.errorText = sortedCount === expectedCount ? '' : 'Nem sikerült mindenkit beosztani!'
        return prevState;
      });
      const visualData = Object.keys(response.mapped).map(dayStr => {return this.getVisualizedDay(dayStr,response.mapped[dayStr]);});
      this.setState(prevState=>Object.assign(prevState,{calculatedEvents:visualData}));
    });
  };
  load(){
    getCohortCalendarInfos(this.state.inputs.cohortName).then((response) => {
      const responseArray = Object.keys(response).map(calId => response[calId]).sort((a,b)=> a.label.localeCompare(b.label));
      this.setState(prevState => {return Object.assign(prevState,{calendarInfos: responseArray})});
    });
  }
  handleInputChange(field, value){
    const newInputs = {};
    newInputs[field] = value;
    this.setState(prevState => {
      prevState.inputs = Object.assign({},prevState.inputs,newInputs);
      return prevState;
    });
  }
  handleAttendanceChange(id, value){
    this.setState(prevState => {
      prevState.calendarInfos.forEach(calInfo => {
        if (calInfo.id === id){calInfo.count = value;}
      });
      return prevState;
    });
  }
  addOneDay(){
    this.setState(prevState => {
      prevState.inputs.days.push('');
      return prevState;
    });
  }
  removeOneDay(index){
    this.setState(prevState => {
      prevState.inputs.days.splice(index,1);
      return prevState;
    });
  }
  changeOneDay(newVal,index){
    this.setState(prevState => {
      prevState.inputs.days[index]=newVal;
      return prevState;
    });
  }
  changeAllAttendance(){
    const cnt = this.state.inputs.simplifiedAttendanceCount;
    this.setState(prevState => {
      prevState.calendarInfos = prevState.calendarInfos.map((calInfo) => {
        calInfo.count = cnt;
        return calInfo;
      });
      return prevState;
    });
  }
  exportVisualizedData(){
    const generatedEvents = this.state.calculatedEvents.reduce((eventList, generatedDay) => {
      return eventList.concat(generatedDay.sessions.map(session => {
        const startTime = new Date(generatedDay.day+"T"+session.startTime);
        return {
          summary: this.state.inputs.eventName,
          label: session.label,
          start:{
            dateTime: startTime.toISOString()
          },
          end:{
            dateTime: new Date(startTime.getTime()+session.sessionLength*60000).toISOString()
          },
          attendees: this.state.calendarInfos.reduce((attendees,calInfo) => {
            if (calInfo.label === session.label){attendees.push({email:calInfo.id});}
            return attendees;
          },[])
        }
      }));
    },[]);
    downloadObjectAsJson(generatedEvents, 'scheduled_calendar_events');
  }
  render(){
    return (
      <div>
        <div>
          <Link to="/">Home</Link>
        </div>
        <div className="col6">
          <div className="spacedBottom">
            <DaysSelector days={this.state.inputs.days} changeDay={this.changeOneDay} removeOne={this.removeOneDay} addOne={this.addOneDay}/>
          </div>
          {Object.keys(this.state.labels).map((key) => {
            return (<InputField
              type="text"
              key={key}
              label={this.state.labels[key]}
              value={this.state.inputs[key]}
              onChange={(event) => {this.handleInputChange(key,event.target.value);}}
              onBlur={(event) => {
                const sanitizer = this.state.fieldValueSanitizer[key] ? this.state.fieldValueSanitizer[key] : a => a;
                this.handleInputChange(key,sanitizer(event.target.value));}}
            />);
          })}
        </div>
        <div className="col6">
          <div className="spacedBottom">
            <span>Cohort:</span>
            <select value={this.state.inputs.cohortName} onChange={(event) => {this.handleInputChange('cohortName',event.target.value);}}>
              {this.state.cohortList.map(cohort => cohort.name).map((name, index) => {return (<option key={index} value={name}>{name}</option>);})}
            </select>
            <button onClick={this.load}>Betöltés</button>
          </div>
          {this.state.calendarInfos.length <= 0 ? null :
            <div>
              <div>Csapatonkénti foglalkozás:</div>
              <span>Állítsd be mind</span>
              <input value={this.state.inputs.simplifiedAttendanceCount} onChange={(event) => {this.handleInputChange('simplifiedAttendanceCount',event.target.value);}}/>
              <span>-ra/re</span>
              <button onClick={this.changeAllAttendance}>Átírás</button>
            </div>
          }
          {this.state.calendarInfos.map((calInfo, index) => {
            return (
              <div className="sm-col6" key={index}>
                <span>{calInfo.label}</span>
                <input value={calInfo.count} onChange={(event) => {this.handleAttendanceChange(calInfo.id, event.target.value);}} />
              </div>
            );
          })}
        </div>
        {this.state.calendarInfos.length <= 0 ? null :
          <div>
            <button onClick={this.doRun}>Keresés</button>
            <span className="errorText">{this.state.errorText}</span>
          </div>
        }
        {(this.state.calculatedEvents && this.state.calculatedEvents.length === 0) ? null :
          <button onClick={this.exportVisualizedData}>Mentés fájlba</button>
        }
        {(this.state.calculatedEvents && this.state.calculatedEvents.length === 0) ? null : <ResultVisualizer eventCollection={this.state.calculatedEvents}/>}
      </div>
    );
  }
}

export default SalesEventOrganizerComponent;
