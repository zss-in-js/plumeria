import "./App.css";
import { css } from "@plumeria/core";

export const styles = css.create({
  color: {
    background: "linear-gradient(90deg, #58c6ff 0%, #076ad9 50%, #ff3bef 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
});

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src="logo.svg" className="App-logo" alt="logo" />
        <div className={styles.color}>Webpack + React + Plumeria</div>
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
