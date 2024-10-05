import './App.css';
import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import Risk from './pages/risk/Risk';
import Apps from './pages/apps/Apps';
import AttackGraphs from './pages/attackGraphs/AttackGraphs';
import AppView from './pages/appView/AppView';
import Error from './pages/error/Error';
import Layout from './layout';

class App extends Component {
	render() {
		return (
			<Router>
				<Layout isLoggedIn={true}>
					<Switch>
						<Route exact path="/risk"> <Risk /> </Route>

						<Route path="/" exact>
							<Redirect to="/graphs" />
						</Route>
						{/* routes */}

						<Route exact path="/risk"> <Risk /> </Route>
						<Route path="/apps"> <Apps /> </Route>
						<Route path="/attackGraphs"> <AttackGraphs /> </Route>
						<Route path="/appView"> <AppView /> </Route>

						<Route exact path="/appView/:type:group:app"> <AppView /> </Route>

						<Route path="/error"> <Error /> </Route>
						<Route path="/:message"> <Risk /> </Route>
					</Switch>
				</Layout >
			</Router >

		);
	}
}

export default App;
