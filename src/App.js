import './Style/style.css';
import Header from './Components/Header/Header';
import Footer from './Components/Footer/Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Pools from './Pages/Pools';
import Pool from './Pages/Pool';


function App() {

  return (
    <div className="App ">
      <Header />
      {/* <Pools />
        <ToastContainer /> */}
      <Pool />
      <Footer />
    </div>
  );
}

export default App;
