import styled, { keyframes } from 'styled-components'

const Q_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8]

export default function Header({ onRefresh, loading, updatedAt, qualified, onQualified }) {
  return (
    <HeaderEl>
      <div>
        <LogoTag>District Alsace Football · Saison 2025/2026</LogoTag>
        <H1>Meilleurs <em>2ᵉ</em><br />D4 Alsace</H1>
        <Sub>Art. 24.2 DAF · Points vs 5 premiers · 9 Poules</Sub>
        {updatedAt && <Meta>Données du {updatedAt}</Meta>}
      </div>
      <Controls>
        <QualifBlock>
          <QualifLabel>Qualifiés</QualifLabel>
          <QualifBtns>
            {Q_OPTIONS.map(n => (
              <QBtn key={n} active={qualified === n} onClick={() => onQualified(n)}>{n}</QBtn>
            ))}
          </QualifBtns>
        </QualifBlock>
        <Btn onClick={onRefresh} disabled={loading}>
          {loading ? 'Calcul en cours…' : 'Calculer le classement'}
        </Btn>
      </Controls>
    </HeaderEl>
  )
}

const pulse = keyframes`0%,100%{opacity:1}50%{opacity:0.2}`

const HeaderEl = styled.header`
  padding: 2.5rem 3rem 2rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
`

const LogoTag = styled.div`
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--green);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  &::before {
    content: '';
    width: 7px; height: 7px;
    background: var(--green);
    border-radius: 50%;
    box-shadow: 0 0 10px var(--green);
    display: inline-block;
    animation: ${pulse} 2.5s ease-in-out infinite;
  }
`

const H1 = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: clamp(28px, 5vw, 52px);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #fff;
  line-height: 1.05;
  em { color: var(--green); font-style: normal; }
`

const Sub = styled.div`
  font-size: 11px;
  color: var(--text2);
  margin-top: 8px;
  letter-spacing: 0.06em;
`

const Meta = styled.div`
  font-size: 11px;
  color: var(--text3);
  margin-top: 6px;
  letter-spacing: 0.05em;
`

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
`

const QualifBlock = styled.div`display: flex; flex-direction: column; align-items: flex-end; gap: 6px;`

const QualifLabel = styled.div`
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text3);
`

const QualifBtns = styled.div`display: flex; gap: 4px;`

const QBtn = styled.button`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid ${p => p.active ? 'var(--green)' : 'var(--border2)'};
  background: ${p => p.active ? 'rgba(42,255,143,0.12)' : 'transparent'};
  color: ${p => p.active ? 'var(--green)' : 'var(--text2)'};
  cursor: pointer;
  transition: all 0.12s;
  &:hover { border-color: var(--green); color: var(--green); }
`

const Btn = styled.button`
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.06em;
  padding: 13px 28px;
  background: var(--green);
  color: #000;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  &:hover { background: #4fffaa; box-shadow: 0 6px 24px var(--green-glow); transform: translateY(-1px); }
  &:active { transform: translateY(0); }
  &:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
`
