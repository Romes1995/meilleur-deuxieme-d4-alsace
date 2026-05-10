import styled from 'styled-components'

function sgn(n) { return n >= 0 ? `+${n}` : String(n) }

export default function Classement({ seconds, qualified = 2 }) {
  if (!seconds?.length) return null

  const labels = ['1ᵉʳ meilleur 2ᵉ', '2ᵉ meilleur 2ᵉ', '3ᵉ meilleur 2ᵉ']
  const cls    = ['gold', 'silver', 'bronze']
  const podium = seconds.slice(0, Math.min(3, qualified))

  return (
    <>
      <Podium>
        {podium.map((s, i) => (
          <Pod key={s.group} rank={cls[i]}>
            <PodRank rank={cls[i]}>{labels[i]}</PodRank>
            <PodName>{s.name}</PodName>
            <PodGroup>{s.group}</PodGroup>
            <PodStats>
              <Ps><PsV>{s.pts}</PsV><PsL>Pts*</PsL></Ps>
              <Ps><PsV>{s.j}</PsV><PsL>J*</PsL></Ps>
              <Ps><PsV>{sgn(s.diff)}</PsV><PsL>Diff*</PsL></Ps>
              <Ps><PsV>{s.bp}</PsV><PsL>Bp*</PsL></Ps>
            </PodStats>
          </Pod>
        ))}
      </Podium>

      <TblWrap>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Équipe</th>
              <th>Groupe</th>
              <th>Pts gén.</th>
              <th>J</th>
              <th>G</th>
              <th>N</th>
              <th>P</th>
              <th>Diff gén.</th>
              <ThSep title="Points obtenus uniquement contre les équipes classées 1ᵉ à 5ᵉ">Pts*</ThSep>
              <ThSep>J*</ThSep>
              <th>G*</th>
              <th>N*</th>
              <th>P*</th>
              <th>Diff*</th>
              <th>Bp*</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {seconds.map((s, i) => (
              <tr key={s.group}>
                <td style={{ color: 'var(--text3)' }}>{i + 1}</td>
                <Tn>{s.name}</Tn>
                <td style={{ color: 'var(--text2)' }}>{s.group}</td>
                <td>{s.total_pts ?? '—'}</td>
                <td style={{ color: 'var(--text2)' }}>{s.total_j ?? '—'}</td>
                <td style={{ color: 'var(--text2)' }}>{s.total_g ?? '—'}</td>
                <td style={{ color: 'var(--text2)' }}>{s.total_n ?? '—'}</td>
                <td style={{ color: 'var(--text2)' }}>{s.total_p ?? '—'}</td>
                <td style={{ color: s.total_diff > 0 ? 'var(--green)' : s.total_diff < 0 ? 'var(--red)' : 'var(--text2)' }}>{sgn(s.total_diff)}</td>
                <TdSep>{s.pts}</TdSep>
                <TdSep style={{ color: 'var(--text2)' }}>{s.j}</TdSep>
                <td style={{ color: 'var(--text2)' }}>{s.win}</td>
                <td style={{ color: 'var(--text2)' }}>{s.nul}</td>
                <td style={{ color: 'var(--text2)' }}>{s.def}</td>
                <td style={{ color: s.diff > 0 ? 'var(--green)' : s.diff < 0 ? 'var(--red)' : 'var(--text2)' }}>{sgn(s.diff)}</td>
                <td style={{ color: 'var(--text2)' }}>{s.bp}</td>
                <td><Badge qualified={i < qualified}>{i < qualified ? 'Qualifié' : 'Éliminé'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TblWrap>

      <Note>
        * calculé uniquement sur les matchs contre les équipes classées 1ᵉ à 5ᵉ de la poule (Art. 24.2 DAF)<br />
        Départage : points* → fair-play (non automatisé) → goal-average général (Diff gén.)
      </Note>
    </>
  )
}

const rankColors = { gold: '#FFD700', silver: '#C0C0C0', bronze: '#CD7F32' }

const Podium = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-bottom: 2.5rem;
`

const Pod = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 22px;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: ${p => rankColors[p.rank]};
  }
`

const PodRank = styled.div`
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 12px;
  color: ${p => rankColors[p.rank]};
`

const PodName = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
  line-height: 1.2;
`

const PodGroup = styled.div`
  font-size: 11px;
  color: var(--text2);
  margin-bottom: 16px;
  letter-spacing: 0.06em;
`

const PodStats = styled.div`display: flex; gap: 18px;`
const Ps = styled.div`text-align: center;`
const PsV = styled.div`font-size: 20px; font-weight: 500; color: var(--green);`
const PsL = styled.div`font-size: 10px; color: var(--text3); letter-spacing: 0.06em; margin-top: 3px;`

const TblWrap = styled.div`overflow-x: auto; margin-bottom: 1rem;`

const ThSep = styled.th`border-left: 1px solid var(--border2) !important;`
const TdSep = styled.td`border-left: 1px solid var(--border2) !important;`

const Tn = styled.td`
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 13px;
  color: #fff;
`

const Badge = styled.span`
  display: inline-block;
  font-size: 10px;
  padding: 3px 10px;
  border-radius: 2px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 500;
  background: ${p => p.qualified ? 'var(--green-dim)' : 'transparent'};
  color: ${p => p.qualified ? 'var(--green)' : 'var(--text3)'};
  border: 1px solid ${p => p.qualified ? 'rgba(42,255,143,0.25)' : 'var(--border2)'};
`

const Note = styled.p`
  font-size: 11px;
  color: var(--text3);
  line-height: 1.8;
  letter-spacing: 0.03em;
`
