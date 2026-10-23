import { LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getEventsSummary, type EventSummaryRow } from '../../../services/adminService';
import { toFriendlyError } from '../../../services/errors';
import a from '../admin.module.css';
import { summarize } from '../metricsSummary';
import { useSections } from '../SectionsContext';
import styles from './MetricsPanel.module.css';

const PERIODS = [7, 30, 90] as const;
type Period = (typeof PERIODS)[number];

const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

/** Visitas e cliques no WhatsApp: o resultado do site em números. */
export function MetricsPanel() {
  const [period, setPeriod] = useState<Period>(30);
  const [rows, setRows] = useState<EventSummaryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getEventsSummary(90).then(
      (data) => active && setRows(data),
      (e: unknown) => active && setError(toFriendlyError(e)),
    );
    return () => {
      active = false;
    };
  }, []);

  const { sections } = useSections();
  // Cliques nos botões das seções vêm com o endereço (slug) da seção: o painel mostra o nome.
  const summary = useMemo(() => {
    if (!rows) return null;
    const names = Object.fromEntries((sections ?? []).map((s) => [s.slug, s.name]));
    return summarize(rows, period, undefined, names);
  }, [rows, period, sections]);
  const max = summary ? Math.max(1, ...summary.days.map((d) => Math.max(d.visits, d.clicks))) : 1;

  return (
    <section className={a.panel} aria-labelledby="metrics-title" data-tour="metrics">
      <div className={a.panelHeader}>
        <div>
          <h2 id="metrics-title">Resultados do site</h2>
          <p>Visitas e pedidos de contato pelo WhatsApp.</p>
        </div>
        <div className={styles.periods} role="group" aria-label="Período">
          {PERIODS.map((p) => (
            <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)}>
              {p} dias
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className={`${a.notice} ${a.noticeError}`} role="alert">
          {error}
        </p>
      )}
      {!summary && !error && (
        <p className={a.loading} role="status">
          <LoaderCircle className={a.spin} aria-hidden="true" /> Carregando…
        </p>
      )}

      {summary && (
        <>
          <dl className={styles.cards}>
            <div>
              <dt>Visitas</dt>
              <dd>{summary.visits.toLocaleString('pt-BR')}</dd>
            </div>
            <div>
              <dt>Cliques no WhatsApp</dt>
              <dd>{summary.clicks.toLocaleString('pt-BR')}</dd>
            </div>
            <div>
              <dt>Taxa de contato</dt>
              <dd>{summary.rate === null ? '—' : percent.format(summary.rate)}</dd>
            </div>
          </dl>

          {summary.visits + summary.clicks === 0 ? (
            <p className={a.empty}>
              Ainda não há dados neste período. Os números aparecem conforme o site recebe visitas.
            </p>
          ) : (
            <>
              <figure className={styles.chart}>
                <figcaption className={styles.legend}>
                  <span className={styles.legendVisits}>Visitas</span>
                  <span className={styles.legendClicks}>Cliques no WhatsApp</span>
                </figcaption>
                <div className={styles.bars} aria-hidden="true" data-period={period}>
                  {summary.days.map((d) => (
                    <div
                      key={d.day}
                      className={styles.day}
                      title={`${shortDate(d.day)}: ${d.visits} visitas, ${d.clicks} cliques`}
                    >
                      <span className={styles.barVisits} style={{ height: `${(d.visits / max) * 100}%` }} />
                      <span className={styles.barClicks} style={{ height: `${(d.clicks / max) * 100}%` }} />
                    </div>
                  ))}
                </div>
                <div className={styles.axis} aria-hidden="true">
                  <span>{shortDate(summary.days[0].day)}</span>
                  <span>{shortDate(summary.days[summary.days.length - 1].day)}</span>
                </div>
                <details className={styles.table}>
                  <summary>Ver os números por dia</summary>
                  <table>
                    <caption className="visually-hidden">Visitas e cliques no WhatsApp por dia</caption>
                    <thead>
                      <tr>
                        <th scope="col">Dia</th>
                        <th scope="col">Visitas</th>
                        <th scope="col">Cliques</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...summary.days].reverse().map((d) => (
                        <tr key={d.day}>
                          <th scope="row">{shortDate(d.day)}</th>
                          <td>{d.visits}</td>
                          <td>{d.clicks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </figure>

              {summary.sources.length > 0 && (
                <div>
                  <h3 className={styles.subtitle}>De onde vieram os cliques</h3>
                  <ul className={styles.sources}>
                    {summary.sources.map((s) => (
                      <li key={s.key}>
                        <span>{s.label}</span>
                        <span className={styles.sourceBar} aria-hidden="true">
                          <span style={{ width: `${(s.total / summary.clicks) * 100}%` }} />
                        </span>
                        <strong>{s.total}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          <p className={styles.note}>
            Contagem anônima, sem cookies. Visitas feitas em um navegador conectado ao painel não são contadas.
          </p>
        </>
      )}
    </section>
  );
}
