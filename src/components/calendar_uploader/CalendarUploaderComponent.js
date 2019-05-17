import React from 'react';
import { Link } from "react-router-dom";
import {insertEventList, getCalendarList} from '../../services/calendarServices';
import {readFile} from '../../utilities/utilities';

function CalendarEvent(props){
	return (
		<div>
			<span>
				{props.summary || 'No event summary'}
			</span>
			<span>
				{'('+(new Date(props.start.dateTime)).toLocaleString()+'-'+(new Date(props.end.dateTime)).toLocaleString()+')'}
			</span>
		</div>
	);
}

class CalendarUploaderComponent extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			calendarEvents: [],
			targetCalendar: {id:''},
			calendarsList: [],
			answerState: 'none'
		};
		this.handleFiles = this.handleFiles.bind(this);
		this.uploadEvents = this.uploadEvents.bind(this);
		this.load = this.load.bind(this);
		this.changeCalendar = this.changeCalendar.bind(this);
	}
	handleFiles(event) {
		this.load();
		this.setState(prevState => {
			prevState.answerState = 'none';
			return prevState;
		});
		readFile(event.target.files).then((result) => {
			const calendarEvents = JSON.parse(result);
			this.setState(prevState => {
				prevState.calendarEvents = calendarEvents;
				return prevState;
			});
		});
	}
	uploadEvents(){
		this.setState(prevState => {
			prevState.answerState = 'none';
			return prevState;
		});
		insertEventList(this.state.targetCalendar.id, this.state.calendarEvents).then((response) => {
			const wasError = Object.keys(response.result).reduce((wasError,eventResultKey) => {
				return wasError || response.result[eventResultKey].result.error !== undefined;
			},false);
			if (wasError){this.setState(prevState => {prevState.answerState = 'error'; return prevState});}
			else{this.setState(prevState => {prevState.answerState = 'success'; return prevState});}
		}).catch(console.error);
	}
	load(){
		getCalendarList().then((response) => {
			this.setState(prevState => {
				prevState.calendarsList = response.result.items.sort((a,b)=>{return a.summary.localeCompare(b.summary)});
				return prevState;
			});
		});
	}
	changeCalendar(event){
		const calId = event.target.value;
		this.setState(prevState => {
			prevState.targetCalendar = prevState.calendarsList.reduce((targetCalendar,calendar) => {
				if (calId === calendar.id){return calendar;}
				return targetCalendar;
			},{id:''});
			prevState.answerState = 'none';
			return prevState;
		});
	}
	render(){
		return (
			<div>
		        <div>
		        	<Link to="/">Home</Link>
		        </div>
				<input type="file" id="input" multiple onChange={this.handleFiles}/>
				<div>
					<div>
						Események:
					</div>
					{this.state.calendarEvents.map((calEvent, index) => (<CalendarEvent key={index} {...calEvent}/>))}
					{this.state.calendarEvents.length <= 0 ? null:
						<div>
							<div>
								<select value={this.state.targetCalendar.id} onChange={this.changeCalendar}>
									<option value={''}>Válassz naptárat!</option>
									{this.state.calendarsList.map(calendar=>(
										<option key={calendar.id} value={calendar.id}>{calendar.summary}</option>
									))}
								</select>
							</div>
							<button onClick={this.uploadEvents}>Feltöltés</button>
							{this.state.answerState === 'success' ? (<span className="successText">Sikeres feltöltés</span>) :
							 this.state.answerState === 'error' ? (<span className="errorText">Hibás feltöltés</span>) :
							 null
							}
						</div>
					}
				</div>
			</div>
		);
	}
}

export default CalendarUploaderComponent;