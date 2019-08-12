import React from 'react';
import './App.css';
import drac from './assets/dracula.svg'

import Routes from './routes';

function App() {

  function themeChange(e) {
    if (e.target.checked) {
      document.documentElement.setAttribute('data-theme', 'dracula');
    }
    else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  return (
    <div className="app">
      <div className="theme-switch-wrapper">
        <img src={drac} alt="dracula logo" />
        <label className="theme-switch">
          <input type="checkbox" id="checkbox" onChange={themeChange} />
          <div className="slider round"></div>
        </label>
      </div>
      <Routes />
    </div>
  );
}

export default App;
