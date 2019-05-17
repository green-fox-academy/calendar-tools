import React from 'react';
import { Link } from "react-router-dom";
import { readFile, downloadObjectAsJson, sanitizeTime } from '../../utilities/utilities';

function EventEditor(props){
	return (
		<div>
			<div>
				<input value={props.summary} onChange={(event) => {props.changeField(props.index,'summary',event.target.value)}} placeholder={'Esemény neve'} />
				<button onClick={props.remove}>Törlés</button>
			</div>
			<input className="timeInput" value={props.start} onChange={(event) => {props.changeField(props.index,'start',event.target.value)}} onBlur={(event) => {props.changeField(props.index,'start',sanitizeTime(event.target.value))}} placeholder={'Esemény kezdete(HH:MM)'} />
			<input className="timeInput" value={props.end} onChange={(event) => {props.changeField(props.index,'end',event.target.value)}} onBlur={(event) => {props.changeField(props.index,'start',sanitizeTime(event.target.value))}} placeholder={'Esemény vége(HH:MM)'} />
		</div>
	);
	//
}

function DayEditor(props){
	return (
		<div style={{minWidth:'400px',backgroundColor:'antiquewhite'}}>
			<div>
				<button onClick={props.addNewEventToEditedList}>Új esemény</button>
				<button onClick={() => {props.recordEventsToDay(props.editedDayIndex, props.editedDayEvents)}}>Rögzít</button>
			</div>
			<div>{'Szerkesztve: '+(['Hétfő','Kedd','Szerda','Csütörtök','Péntek'])[props.editedDayIndex]}</div>
			{props.editedDayEvents.map((eventData,index) => {
				return (<EventEditor key={index} index={index} {...eventData} changeField={props.changeEditedEvent} remove={() => {props.removeEventFromEditedList(index)}} />);
			})}
		</div>
	);
	//
}

function WeekVisualizer(props){
	const inlineStyle={width:'20%',display:'inline-flex', flexDirection:'column'};
	return (
		<div style={{width:'calc(100% - 400px)'}}>
			<div style={{textAlign:'center'}}>
				<span>Import:</span><input type="file" id="input" multiple onChange={props.handleFiles}/>
			</div>
			<div style={{textAlign:'center'}}>
				<button style={{backgroundColor:'darkseagreen'}} onClick={props.exportTemplate}>Export</button>
				<button style={{backgroundColor:'darkseagreen'}} onClick={props.generateData}>Generálás</button>
			</div>
			<div style={{textAlign:'center'}}>
				<span>Generalásá időtartama:</span>
				<input value={props.startDate} onChange={(event) => {props.changeField('startDate',event.target.value)}} placeholder={'Nyitó dátum(YYYY-MM-DD)'} />
				<input value={props.endDate} onChange={(event) => {props.changeField('endDate',event.target.value)}} placeholder={'Záró dátum(YYYY-MM-DD)'} />
			</div>
			{props.weeklyTemplates.map((weekDayEvents, dayIndex) => {
				return (
					<span style={inlineStyle} key={dayIndex}>
						<div style={{'textAlign':'center'}}>
							<div>
								{(['Hétfő','Kedd','Szerda','Csütörtök','Péntek'])[dayIndex]}
							</div>
							<button onClick={() => {props.recordEventsToDay(dayIndex,[]);}}>Töröl</button>
							<button onClick={() => {props.selectDayToEdit(dayIndex);}}>Szerkeszt</button>
						</div>
						{weekDayEvents.length <= 0 ? null :
						 weekDayEvents.map((event, eventIndex) => {
							return(
								<div key={eventIndex} style={{textAlign:'center'}}>
									<div>{event.summary}</div>
									<div>{'('+event.start+'-'+event.end+')'}</div>
								</div>
							);
						})}
					</span>
				);
			})}
		</div>
	);
	//
}

class WeeklyTemplateGeneratorComponent extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			editedDayEvents: [], /* {summary: string, start: timeString(HH:MM), end: timeString(HH:MM)} */
			weeklyTemplates: [[],[],[],[],[]],
			generationInterval: {
				start: '', //YYYY-MM-DD
				end: '' //YYYY-MM-DD
			},
			editedDayIndex: 0,
			breakIntervals: [],
			startDate: '',
			endDate: ''
		};
		this.addNewEventToEditedList = this.addNewEventToEditedList.bind(this);
		this.changeEditedEvent = this.changeEditedEvent.bind(this);
		this.changeWeekDayEventsTo = this.changeWeekDayEventsTo.bind(this);
		this.changeEditedDay = this.changeEditedDay.bind(this);
		this.exportTemplate = this.exportTemplate.bind(this);
		this.removeEventFromEditedList = this.removeEventFromEditedList.bind(this);
		this.generateData = this.generateData.bind(this);
		this.handleFiles = this.handleFiles.bind(this);
	}
	handleFiles(event) {
		readFile(event.target.files).then((result) => {
			const weeklyTemplates = JSON.parse(result);
			this.setState(prevState => {
				prevState.weeklyTemplates = weeklyTemplates;
				return prevState;
			}, () => {this.changeEditedDay(this.state.editedDayIndex)});
		});
	}
	addNewEventToEditedList(){
		this.setState(prevState => {
			const lastEvent = prevState.editedDayEvents.length > 0 ? prevState.editedDayEvents[prevState.editedDayEvents.length-1] : {end:''};
			const newEvent = {
				summary: '',
				start: lastEvent.end, // initialize starttime to the last event's endtime
				end: ''
			};
			prevState.editedDayEvents.push(newEvent);
			return prevState;
		});
	}
	removeEventFromEditedList(index){
		this.setState(prevState => {
			prevState.editedDayEvents.splice(index,1);
			return prevState;
		});
	}
	changeEditedEvent(index,field,newValue){
		this.setState(prevState => {
			prevState.editedDayEvents[index][field] = newValue;
			return prevState;
		});
	}
	changeWeekDayEventsTo(weekdayIndex,eventList){
		this.setState(prevState => {
			prevState.weeklyTemplates[weekdayIndex] = eventList;
			return prevState;
		});
	}
	changeEditedDay(index){
		this.setState(prevState => {
			prevState.editedDayIndex = index;
			prevState.editedDayEvents = prevState.weeklyTemplates[index].map(ev=>Object.assign({},ev));
			return prevState;
		});
	}
	exportTemplate(){
		downloadObjectAsJson(this.state.weeklyTemplates,'weekTemplate');
	}
	generateData(){
		const generatedEvents = [];
		let actDateTime = new Date(this.state.startDate);
		const endDateTime = new Date(this.state.endDate);
		endDateTime.setHours(22); // this is for the while comparison
		while(actDateTime < endDateTime){
			const dayOfTheWeek = actDateTime.getDay()-1;
			if (dayOfTheWeek !== 5 && dayOfTheWeek !== -1){ //sunday is 0...
				const dayString = actDateTime.toISOString().split('T')[0];
				this.state.weeklyTemplates[dayOfTheWeek].forEach((event) => {
					generatedEvents.push({
						summary: event.summary,
						start: {dateTime: dayString+'T'+sanitizeTime(event.start)+':00.000Z'},
						end: {dateTime: dayString+'T'+sanitizeTime(event.end)+':00.000Z'}
					});
				});
			}
			actDateTime = new Date(actDateTime.setDate(actDateTime.getDate()+1));
		}
		downloadObjectAsJson(generatedEvents,'generatedEvents');
	}
	render(){
		return (
			<div>
				<div>
					<Link to="/">Home</Link>
				</div>
				<div style={{display:'flex'}}>
					<DayEditor
						editedDayEvents={this.state.editedDayEvents}
						changeEditedEvent={this.changeEditedEvent}
						addNewEventToEditedList={this.addNewEventToEditedList}
						removeEventFromEditedList={this.removeEventFromEditedList}
						recordEventsToDay={this.changeWeekDayEventsTo}
						editedDayIndex={this.state.editedDayIndex}
					/>
					<WeekVisualizer
						weeklyTemplates={this.state.weeklyTemplates}
						selectDayToEdit={this.changeEditedDay}
						recordEventsToDay={this.changeWeekDayEventsTo}
						exportTemplate={this.exportTemplate}
						generateData={this.generateData}
						handleFiles={this.handleFiles}
						startDate={this.startDate}
						endDate={this.endDate}
						changeField={(field, value) => {this.setState(prevState => {prevState[field] = value; return prevState;})}}
					/>
				</div>
		    </div>
		);
	}
}

export default WeeklyTemplateGeneratorComponent;