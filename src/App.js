import logo from './logo.svg';
import './App.css';
import {BrowserRouter,Route,Routes } from 'react-router-dom'
import Login from './Components/Login';
import Home from './Components/Home';


function App() {

  return (
    <div className="App">
     <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login/>}/>
        <Route path='/home' element={<Home/>}/>
      </Routes>
     </BrowserRouter>
    </div>
  );
}

export default App;
