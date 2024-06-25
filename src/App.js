import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './Style/style.css';
import Header from './Components/Header/Header';
import Footer from './Components/Footer/Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Pool from './Pages/Pool';
import Admin from './Pages/Admin/admin';

function App() {
  return (
    <div className="App">
      <Router>
        <Header />
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Pool />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        <Footer />
      </Router>
    </div>
  );
}

export default App;