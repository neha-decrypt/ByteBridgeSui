import './Style/style.css';
import Header from './Components/Header/Header';
import Footer from './Components/Footer/Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Pools from './Pages/Pools';

function App() {

  return (
    <>
      <div className="App ">
        <Header />
        <Pools />
        <Footer />
        <ToastContainer />
      </div>
    </>
  );
}

export default App;
