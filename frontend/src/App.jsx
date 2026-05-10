import { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import Header from './components/Header.jsx'
import Classement from './components/Classement.jsx'
import Groupes from './components/Groupes.jsx'

const API = 'http://localhost:8001'

export default function App() {
  const [tab, setTab]             = useState('classement')
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [qualified, setQualified] = useState(2)

  async function refresh() {
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/refresh`, { method: 'POST' })
      const d = await r.json()
      if (d.error) {
        alert(d.error)
        return
      }
      setData(d)
      setUpdatedAt(d.updated_at)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch(`${API}/api/data`)
      .then(r => r.json())
      .then(d => {
        if (d.seconds?.length) { setData(d); setUpdatedAt(d.updated_at) }
      })
      .catch(() => {})
  }, [])

  return (
    <Layout>
      <Header onRefresh={refresh} loading={loading} updatedAt={updatedAt} qualified={qualified} onQualified={setQualified} />

      <Wrap>
        <Rule>
          <strong>Règle officielle (Art. 24.2 DAF)</strong> — Points obtenus lors des matchs{' '}
          <strong>aller/retour contre les équipes classées 1ᵉ à 5ᵉ</strong> du groupe.
          Départage : fair-play, puis goal-average général.
        </Rule>

        <Tabs>
          <Tab active={tab === 'classement'} onClick={() => setTab('classement')}>
            Classement général
          </Tab>
          <Tab active={tab === 'groupes'} onClick={() => setTab('groupes')}>
            Détail par groupe
          </Tab>
        </Tabs>

        {!data && !loading && (
          <Empty>
            <span>⚽</span>
            Clique sur <strong>Calculer le classement</strong> pour récupérer les données FFF
          </Empty>
        )}

        {loading && (
          <Empty>
            <Spinner />
            Récupération des données en cours…
          </Empty>
        )}

        {data && !loading && tab === 'classement' && (
          <Classement seconds={data.seconds} qualified={qualified} />
        )}

        {data && !loading && tab === 'groupes' && (
          <Groupes groups={data.groups} />
        )}
      </Wrap>
    </Layout>
  )
}

const Layout = styled.div`display: flex; flex-direction: column; min-height: 100vh;`

const Wrap = styled.main`
  max-width: 1300px;
  margin: 0 auto;
  padding: 2.5rem 3rem;
  width: 100%;
`

const Rule = styled.div`
  border-left: 3px solid var(--accent);
  background: var(--surface);
  border-radius: var(--radius);
  padding: 14px 18px;
  font-size: 12px;
  color: var(--text2);
  line-height: 1.8;
  margin-bottom: 1.5rem;
  strong { color: var(--text); }
`

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border);
  margin-bottom: 2.5rem;
  gap: 2px;
`

const Tab = styled.button`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 11px 22px;
  background: none;
  border: none;
  border-bottom: 2px solid ${p => p.active ? 'var(--green)' : 'transparent'};
  color: ${p => p.active ? 'var(--green)' : 'var(--text2)'};
  cursor: pointer;
  margin-bottom: -1px;
  transition: all 0.15s;
  &:hover { color: var(--text); }
`

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 5rem 2rem;
  color: var(--text3);
  font-size: 13px;
  text-align: center;
  span { font-size: 48px; opacity: 0.15; }
  strong { color: var(--text2); }
`

const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`
const Spinner = styled.div`
  width: 28px; height: 28px;
  border: 2px solid var(--border2);
  border-top-color: var(--green);
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`
