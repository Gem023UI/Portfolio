import { useEffect, useState } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import ContactPage from './pages/ContactPage';
import SkyBackground from './components/SkyBackground';
import ScrollThumb from './components/ScrollThumb';
import './App.css';

function App() {

const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onNav = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onNav);
    return () => window.removeEventListener('popstate', onNav);
  }, []);

  const isContact = path === '/contact' || path.startsWith('/contact/');

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
      {!isContact && <ScrollThumb />}

      <main className="app__page">
        {isContact ? <ContactPage /> : <Home />}
      </main>
    </div>
  );
}

export default App;