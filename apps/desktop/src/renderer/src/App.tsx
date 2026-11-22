export function App() {
  const { platform, versions } = window.dawdaw;

  return (
    <main className="app">
      <h1>dawdaw</h1>
      <p>
        {platform} · Electron {versions.electron} · Chrome {versions.chrome}
      </p>
    </main>
  );
}
