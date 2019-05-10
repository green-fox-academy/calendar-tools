import React from 'react';
import { BrowserRouter, Route, Switch, Link } from "react-router-dom";
import './App.css';
import SalesEventOrganizerComponent from './components/sales_organizer/SalesEventOrganizerComponent';
import CalendarUploaderComponent from './components/calendar_uploader/CalendarUploaderComponent';
import WeeklyTemplateGeneratorComponent from './components/weekly_template_generator/WeeklyTemplateGenerator';

function Home(){
  return (
    <div>
      <h1>GFA Calendar Tool</h1>
      <div>
        <Link to="/organizer">Organizer</Link>
      </div>
      <div>
        <Link to="/templategenerator">Template generator</Link>
      </div>
      <div>
        <Link to="/uploader">Uploader</Link>
      </div>
    </div>
  );
}

class App extends React.Component {
  constructor(props){
    super(props);
  }
  render(){
    return (
      <div className="App">
        <BrowserRouter>
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/organizer" component={SalesEventOrganizerComponent} />
            <Route path="/templategenerator" component={WeeklyTemplateGeneratorComponent} />
            <Route path="/uploader" component={CalendarUploaderComponent} />
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;
