import React from 'react';

export function InputField(props){
  return (
    <div className="sm-col6">
      <span>{props.label}</span>
      <input value={props.value} onChange={props.onChange} onBlur={props.onBlur} />
    </div>
  );
}

export function DaysSelector(props){
  return (
    <div>
      <div>
        <span>Napok(YYYY-MM-DD):</span>
        <button onClick={props.addOne}>+</button>
      </div>
      {props.days.map((day,index) => {
        return (
          <div key={index}>
            <input value={day} onChange={(event) => {props.changeDay(event.target.value, index)}}/>
            <button onClick={() => {props.removeOne(index);}}>-</button>
          </div>
        );
      })}
    </div>
  );
}
