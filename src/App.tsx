import Header from './components/Header';
import Home from './pages/Home';
import SkyBackground from './components/SkyBackground';
import ScrollThumb from './components/ScrollThumb';
import GradualBlur from './components/GradualBlur';
import './App.css';

function App() {
  return (
    <div className="app">
      <SkyBackground />
      <Header />
      <ScrollThumb />

      <GradualBlur target="page" position="bottom" height="7rem" strength={2}
             divCount={5} curve="bezier" exponential opacity={1} />

      <main className="app__page">
        <Home />
      </main>
    </div>
  );
}

export default App;