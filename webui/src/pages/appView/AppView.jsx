import { withRouter } from "react-router";
import AppViewBase from './AppViewBase';

// AppView is a shell UX component that only serves to processing props as "/appView"
// deferring main operations to the base class
class AppView extends AppViewBase { }

export default withRouter(AppView);
