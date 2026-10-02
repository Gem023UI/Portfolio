import Header from './components/Header';
import Home from './pages/Home';
import SkyBackground from './components/SkyBackground';
import ScrollThumb from './components/ScrollThumb';
import './App.css';

function App() {
  return (
    <div className="app">
      <SkyBackground
        className="app__sky"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          aspectRatio: 'auto',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />
      <Header />
      <ScrollThumb />

      <main className="app__page">
        <Home />
      </main>
    </div>
  );
}

export default App;