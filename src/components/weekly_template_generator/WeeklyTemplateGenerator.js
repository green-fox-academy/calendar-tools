import React from 'react';
import { Link } from "react-router-dom";

function EventEditor(props){
	return (
		<div>
			<input value={props.summary} onChange={(event) => {props.changeField(props.index,'summary',event.target.value)}} placeholder={'Esemény neve'} />
			<input className="timeInput" value={props.start} onChange={(event) => {props.changeField(props.index,'start',event.target.value)}} placeholder={'Esemény kezdete'} />
			<input className="timeInput" value={props.end} onChange={(event) => {props.changeField(props.index,'end',event.target.value)}} placeholder={'Esemény vége'} />
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
				return (<EventEditor key={index} index={index} {...eventData} changeField={props.changeEditedEvent} />);
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
				<button style={{backgroundColor:'darkseagreen'}} onClick={props.exportData}>Export</button>
			</div>
			{props.weeklyTemplates.map((weekDayEvents, dayIndex) => {
				return (
					<span style={inlineStyle} key={dayIndex}>
						<div style={{'textAlign':'center'}}>
							<div>
								{(['Hétfő','Kedd','Szerda','Csütörtök','Péntek'])[dayIndex]}
							</div>
							<button onClick={() => {props.recordEventsToDay(dayIndex,null);}}>Töröl</button>
							<button onClick={() => {props.selectDayToEdit(dayIndex);}}>Szerkeszt</button>
						</div>
						{weekDayEvents === null ? null :
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
			editedDayEvents: [{summary:'', start:'09:00', end:''}], /* {summary: string, start: timeString(HH:MM), end: timeString(HH:MM)} */
			weeklyTemplates: [null,null,null,null,null],
			generationInterval: {
				start: '', //YYYY-MM-DD
				end: '' //YYYY-MM-DD
			},
			editedDayIndex: 0,
			breakIntervals: []
		};
		this.addNewEventToEditedList = this.addNewEventToEditedList.bind(this);
		this.changeEditedEvent = this.changeEditedEvent.bind(this);
		this.changeWeekDayEventsTo = this.changeWeekDayEventsTo.bind(this);
		this.changeEditedDay = this.changeEditedDay.bind(this);
		this.exportData = this.exportData.bind(this);
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
			return prevState;
		});
	}
	exportData(){

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
						addNewEventToEditedLis={this.addNewEventToEditedList}
						recordEventsToDay={this.changeWeekDayEventsTo}
						editedDayIndex={this.state.editedDayIndex}
					/>
					<WeekVisualizer
						weeklyTemplates={this.state.weeklyTemplates}
						selectDayToEdit={this.changeEditedDay}
						recordEventsToDay={this.changeWeekDayEventsTo}
						exportData={this.exportData}
					/>
				</div>
		    </div>
		);
	}
}

export default WeeklyTemplateGeneratorComponent;