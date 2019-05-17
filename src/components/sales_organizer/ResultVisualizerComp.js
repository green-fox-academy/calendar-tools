import React from 'react';

//ResultVisualizer props: [DrawDay props]

export class ResultVisualizer extends React.Component{
	constructor(props){
		super(props);
		this.state = {zoom:1.0};
	}
	render(){
		const inlineStyle = {transform:'scale('+this.state.zoom+')'};
		return (
			<div>
				<button onClick={() => {this.setState(prevState => {return {zoom: prevState.zoom+0.1}});}}>Zoom in</button>
				<button onClick={() => {this.setState(prevState => {return {zoom: prevState.zoom-0.1}});}}>Zoom out</button>
				<div style={inlineStyle}>
					{this.props.eventCollection.map((dayData,index)=>(<DrawSingleDay key={index} {...dayData}/>))}
				</div>
			</div>
		);
	}
}

/*
DrawSingleDay props: {
	day: string, //'YYYY-MM-DD'
	maxParalell:number,
	sessions:[
		{startTime:string, //'HH:MM'
		label:string,
		sessionLength:number, //minutes
		paralellIndex:number}
	]
}
*/

function DrawSingleDay(props){
	const outerInlineStyle = {
		height:props.maxParalell*75+40
	};
	return (
		<div style={outerInlineStyle}>
			<div>
				<span style={{marginRight: '10px'}}>{props.day}</span>
				<span>{new Date(props.day).toString().split(' ')[0]}</span>
			</div>
			<div className="dayLine">
				{props.sessions.map((session, index) => (<DrawEvent key={index} {...session}/>))}
			</div>
		</div>
	);
}

function getInlineStyle(timeObj){
	const parts = timeObj.startTime.split(':');
	const minutes = Number(parts[0])*60+Number(parts[1]);
	return {
		left: minutes/60*100-900,
		width: (timeObj.sessionLength/60*100-2)
	};
}

function DrawEvent(props){
	const inlineStyle = getInlineStyle(props);
	return (
		<div className="daySession" style={Object.assign({},inlineStyle,{top:props.paralellIndex*75})}>
			<div className="tooltip">
				<span className="tooltiptext">{props.startTime+" "+props.label}</span>
				<div>{props.startTime}</div>
				<div>{props.label}</div>
			</div>
		</div>
	);
}