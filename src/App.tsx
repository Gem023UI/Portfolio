import { useEffect, useCallback, useState } from 'react';
import Home from './pages/Home';
import LoadingScreen from './components/LoadingScreen';
import './App.css';

function App() {

const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onNav = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onNav);
    return () => window.removeEventListener('popstate', onNav);
  }, []);

  const isContact = path === '/contact' || path.startsWith('/contact/');
  const [loading, setLoading] = useState(true)
  const handleLoadingDone = useCallback(() => setLoading(false), [])

  return (
    <div className="app">
      {loading && <LoadingScreen onDone={handleLoadingDone} />}

      <main className="app__page">
        <Home />
      </main>
    </div>
  );
}

export default App;