import logo from './logo.svg';
import './App.css';
import Header from './Components/Header/Header';
import './Style/style.scss';
import StakePortal from './Pages/StakePortal';
import Footer from './Components/Footer/Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {

  return (
    <>
      <div className="App ">
        <Header />
        <StakePortal />
        <Footer />
        <ToastContainer />
      </div>
    </>
  );
}

export default App;
