import { useState } from 'react'
import './styles/global.css'
import SetupSection from './components/SetupSection'
import ResultsSection from './components/ResultsSection'
import { Game } from './types'

function App() {
  const [isTracking, setIsTracking] = useState(false)
  const [games, setGames] = useState<Game[]>([])
  const [aliases, setAliases] = useState<string[]>([])
  const [playerName, setPlayerName] = useState('')

  return (
    <div className="container">
      <h1>PokerNow Games Tracker</h1>
      
      {!isTracking ? (
        <SetupSection
          games={games}
          setGames={setGames}
          aliases={aliases}
          setAliases={setAliases}
          playerName={playerName}
          setPlayerName={setPlayerName}
          onStartTracking={() => setIsTracking(true)}
        />
      ) : (
        <ResultsSection
          games={games}
          setGames={setGames}
          aliases={aliases}
          setAliases={setAliases}
          playerName={playerName}
          onStopTracking={() => setIsTracking(false)}
        />
      )}
    </div>
  )
}

export default App
