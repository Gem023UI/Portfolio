import Header from './components/Header';
import Home from './pages/Home';
import ScrollThumb from './components/ScrollThumb';
import './App.css';

function App() {
  return (
    <div className="app">
      <Header />
      <ScrollThumb />

      <main className="app__page">
        <Home />
      </main>
    </div>
  );
}

export default App;