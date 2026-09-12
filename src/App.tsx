import Header from './components/Header';
import Home from './pages/Home';
import './App.css';
import ClickSpark from './components/ClickSpark';

function App() {
  return (
    <ClickSpark
      sparkColor="#ffffff"
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      <div className="app">
        <Header />

        <main className="app__page">
          <Home />
        </main>
      </div>
    </ClickSpark>
  );
}

export default App;