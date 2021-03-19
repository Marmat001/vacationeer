import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import ProfilePage from './pages/ProfilePage'
import ActivationPage from './pages/ActivationPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PrivateRoute from './components/PrivateRoute'
import AdminPage from './pages/AdminPage'
import AdminRoute from './components/AdminRoute'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css'
import DashboardPage from './pages/DashboardPage'
import SellerDashboardPage from './pages/SellerDashboardPage'
import NewHotelsPage from './pages/NewHotelsPage'
import StripeCallbackPage from './pages/StripeCallbackPage'

const App = () => {
	return (
		<Router>
			<ToastContainer />
			<Switch>
				<Route path='/' component={HomePage} exact />
				<Route path='/register' component={RegisterPage} exact />
				<Route path='/login' component={LoginPage} exact />
				<Route path='/authentication/activate/:token' component={ActivationPage} exact />
				<PrivateRoute path='/user/dashboard' component={DashboardPage} exact />
				<PrivateRoute path='/user/dashboard/seller' component={SellerDashboardPage} exact />
				<PrivateRoute path='/user/dashboard/profile' component={ProfilePage} exact />
				<PrivateRoute path='/hotels/new' component={NewHotelsPage} exact />
				<PrivateRoute path='/stripe/callback' component={StripeCallbackPage} exact />
				<AdminRoute path='/admin' component={AdminPage} exact />
				<Route path='/authentication/forgot-password' component={ForgotPasswordPage} exact />
				<Route path='/authentication/password/reset/:token' component={ResetPasswordPage} exact />
			</Switch>
		</Router>
	)
}

export default App
