import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

const opts = {
  datasets: [{
    name: 'AAV Rep protein',
    url: { json: '%PUBLIC_URL%/Rep78_aa_correct.json' },
    structure: {
      'YP_680423.1': [{ pdb: '5dcx', chains: [{ chain: 'A' }] },
                      { pdb: '1s9h', chains: [{ chain: 'A' }] },
                      { pdb: '1uoj', chains: [{ chain: 'A' }] },
                      { pdb: '4zo0', chains: [{ chain: 'A' }] },
                      { pdb: '4zq9', chains: [{ chain: 'A' }] },
                      { pdb: '5byg', chains: [{ chain: 'A' }] }],
      'YP_068408.1': [{ pdb: '1m55', chains: [{ chain: 'A' }] },
                      { pdb: '1rz9', chains: [{ chain: 'A' }] },
                      { pdb: '1uut', chains: [{ chain: 'A' }] }],
    },
             }],
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
