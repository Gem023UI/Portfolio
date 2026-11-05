
import { useCallback, useState } from 'react';
import Home from './pages/Home';
import LoadingScreen from './components/LoadingScreen';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);

  const handleLoadingDone = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <div className="app">
      {loading ? (
        <LoadingScreen onDone={handleLoadingDone} />
      ) : (
        <main className="app__page">
          <Home />
        </main>
      )}
    </div>
  );
}

export default App;
