import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

const opts = {
  dataurl: '%PUBLIC_URL%/pfam-cov2.stock',
  config: {
    containerHeight: '1000px',
    handler: {
      click: (coords) => {
        console.warn ('Click ' + coords.node + ' column ' + coords.column + (coords.isGap ? '' : (', position ' + coords.seqPos)) + ' (' + coords.c + ')')
      }
    }
  }
}

ReactDOM.render(
  <React.StrictMode>
    <App {...opts} />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
