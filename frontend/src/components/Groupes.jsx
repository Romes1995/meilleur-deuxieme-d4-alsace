import styled from 'styled-components'

function sgn(n) { return n >= 0 ? `+${n}` : String(n) }

function normName(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '')
}

const PILL_COLORS = {
  V: { bg: 'rgba(42,255,143,0.15)', border: '#2aff8f', text: '#2aff8f' },
  N: { bg: 'rgba(255,184,48,0.15)', border: '#ffb830', text: '#ffb830' },
  D: { bg: 'rgba(255,82,82,0.15)',  border: '#ff5252', text: '#ff5252' },
  '-': { bg: 'rgba(91,127,255,0.12)', border: 'rgba(91,127,255,0.4)', text: '#5b7fff' },
}

function MatchPill({ match, label }) {
  const res = match ? match.res : '-'
  const c = PILL_COLORS[res]
  const score = match ? `${match.sg}–${match.og}` : '?'
  return (
    <PillWrap>
      <PillLabel>{label}</PillLabel>
      <Pill bg={c.bg} border={c.border}>
        <PillScore color={c.text}>{score}</PillScore>
      </Pill>
    </PillWrap>
  )
}

export default function Groupes({ groups }) {
  if (!groups?.length) return null

  return (
    <Grid>
      {groups.map(({ group, teams, second: s }) => {
        const top5 = (teams ?? []).slice(0, 5)

        // Group detail matches by opponent (normalized) → aller/retour
        const matchByOpp = {}
        if (s?.detail) {
          for (const m of s.detail) {
            const key = normName(m.opp)
            if (!matchByOpp[key]) matchByOpp[key] = {}
            matchByOpp[key][m.leg ?? (m.is_home ? 'aller' : 'retour')] = m
          }
        }

        return (
          <GCard key={group}>
            <GCardHead>
              <GCardTitle>Poule {group}</GCardTitle>
              {s && <GCardSecond>2ᵉ : <strong>{s.name}</strong></GCardSecond>}
            </GCardHead>

            <GCardBody>
              {/* ── Top 5 ── */}
              <SectionLabel>Classement</SectionLabel>
              <Top5Grid>
                {top5.map((t, i) => (
                  <TopCard key={t.name} rank={i}>
                    <TopRank>{i + 1}</TopRank>
                    <TopName>{t.name}</TopName>
                    <TopStats>
                      <TopStat><TopVal>{t.pts}</TopVal><TopLbl>pts</TopLbl></TopStat>
                      <TopStat><TopVal>{t.j}</TopVal><TopLbl>j</TopLbl></TopStat>
                      <TopStat diff={t.diff}><TopVal>{sgn(t.diff)}</TopVal><TopLbl>diff</TopLbl></TopStat>
                    </TopStats>
                  </TopCard>
                ))}
              </Top5Grid>

              {!s ? (
                <NoData>Données non disponibles</NoData>
              ) : (
                <>
                  <Divider />

                  {/* ── 2ᵉ en évidence ── */}
                  <SecondHero>
                    <SecondLeft>
                      <SecondLabel>2ᵉ du groupe</SecondLabel>
                      <SecondName>{s.name}</SecondName>
                    </SecondLeft>
                    <SecondRight>
                      <SecondStat><SecondVal>{s.total_pts ?? teams?.[1]?.pts ?? '—'}</SecondVal><SecondLbl>pts gén.</SecondLbl></SecondStat>
                      <SecondStat><SecondVal highlight>{s.pts}</SecondVal><SecondLbl>pts*</SecondLbl></SecondStat>
                      <SecondStat diff={s.diff}><SecondVal>{sgn(s.diff)}</SecondVal><SecondLbl>diff*</SecondLbl></SecondStat>
                    </SecondRight>
                  </SecondHero>

                  {/* ── Matchs vs top 5 (pastilles aller/retour) ── */}
                  <SectionLabel style={{ marginTop: '16px' }}>Résultats vs top 5</SectionLabel>
                  <MatchGrid>
                    {top5.filter(t => normName(t.name) !== normName(s.name)).map((t) => {
                      const ms = matchByOpp[normName(t.name)] ?? {}
                      return (
                        <MatchLine key={t.name}>
                          <OppName>{t.name}</OppName>
                          <Pills>
                            <MatchPill match={ms.aller} label="Aller" />
                            <MatchPill match={ms.retour} label="Ret." />
                          </Pills>
                        </MatchLine>
                      )
                    })}
                  </MatchGrid>
                </>
              )}
            </GCardBody>
          </GCard>
        )
      })}
    </Grid>
  )
}

/* ── Styled components ────────────────────────────────── */

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 16px;
`

const GCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
`

const GCardHead = styled.div`
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const GCardTitle = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--green);
`

const GCardSecond = styled.div`
  font-size: 11px;
  color: var(--text2);
  strong { color: #fff; font-weight: 600; }
`

const GCardBody = styled.div`padding: 16px 20px;`

const SectionLabel = styled.div`
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text3);
  margin-bottom: 10px;
`

/* Top 5 */
const Top5Grid = styled.div`display: flex; flex-direction: column; gap: 5px;`

const rankBg = ['rgba(255,215,0,0.06)', 'rgba(192,192,192,0.05)', 'rgba(205,127,50,0.05)', 'transparent', 'transparent']
const rankBorder = ['rgba(255,215,0,0.2)', 'rgba(192,192,192,0.15)', 'rgba(205,127,50,0.15)', 'var(--border)', 'var(--border)']

const TopCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: ${p => rankBg[p.rank]};
  border: 1px solid ${p => rankBorder[p.rank]};
  border-radius: 4px;
`

const TopRank = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: var(--text3);
  min-width: 14px;
  text-align: center;
`

const TopName = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const TopStats = styled.div`display: flex; gap: 14px;`
const TopStat = styled.div`text-align: right;`
const TopVal = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${p => p.diff > 0 ? 'var(--green)' : p.diff < 0 ? 'var(--red)' : 'var(--text)'};
`
const TopLbl = styled.div`font-size: 9px; color: var(--text3); letter-spacing: 0.05em;`

/* Divider */
const Divider = styled.div`
  border-top: 1px solid var(--border);
  margin: 16px 0;
`

/* 2ᵉ hero */
const SecondHero = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(42,255,143,0.05);
  border: 1px solid rgba(42,255,143,0.15);
  border-radius: var(--radius);
`

const SecondLeft = styled.div``

const SecondLabel = styled.div`
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(42,255,143,0.5);
  margin-bottom: 4px;
`

const SecondName = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--green);
`

const SecondRight = styled.div`display: flex; gap: 16px;`
const SecondStat = styled.div`text-align: center;`
const SecondVal = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${p => p.highlight ? 'var(--green)' : p.diff > 0 ? 'var(--green)' : p.diff < 0 ? 'var(--red)' : '#fff'};
`
const SecondLbl = styled.div`font-size: 9px; color: var(--text3); letter-spacing: 0.05em; margin-top: 2px;`

/* Match pills */
const MatchGrid = styled.div`display: flex; flex-direction: column; gap: 6px;`

const MatchLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`

const OppName = styled.div`
  font-size: 11px;
  color: var(--text2);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Pills = styled.div`display: flex; gap: 8px;`

const PillWrap = styled.div`display: flex; flex-direction: column; align-items: center; gap: 3px;`

const PillLabel = styled.div`font-size: 9px; color: var(--text3); letter-spacing: 0.06em;`

const Pill = styled.div`
  background: ${p => p.bg};
  border: 1px solid ${p => p.border};
  border-radius: 4px;
  padding: 4px 10px;
  min-width: 52px;
  text-align: center;
`

const PillScore = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: ${p => p.color};
`

const NoData = styled.p`font-size: 11px; color: var(--text3); padding: 8px 0;`
