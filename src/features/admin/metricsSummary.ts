import { WHATSAPP_SOURCES } from '../../lib/metrics';
import type { EventSummaryRow } from '../../services/adminService';

interface Day {
  day: string;
  visits: number;
  clicks: number;
}

/** Datas no fuso de Brasília, do mais antigo ao mais recente, incluindo dias sem eventos. */
function lastDays(count: number, today = new Date()): string[] {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
  return Array.from({ length: count }, (_, i) => fmt.format(new Date(today.getTime() - (count - 1 - i) * 864e5)));
}

/** Totais do período, série diária (com dias zerados) e cliques por origem. */
export function summarize(rows: EventSummaryRow[], period: number, today?: Date) {
  const byDay = new Map(lastDays(period, today).map((d) => [d, { day: d, visits: 0, clicks: 0 } as Day]));
  const bySource = new Map<string, number>();
  for (const r of rows) {
    const day = byDay.get(r.day);
    if (!day) continue;
    if (r.kind === 'visit') day.visits += r.total;
    else {
      day.clicks += r.total;
      const key = r.source ?? 'outros';
      bySource.set(key, (bySource.get(key) ?? 0) + r.total);
    }
  }
  const days = [...byDay.values()];
  const visits = days.reduce((s, d) => s + d.visits, 0);
  const clicks = days.reduce((s, d) => s + d.clicks, 0);
  const sources = [...bySource.entries()]
    .map(([key, total]) => ({ key, label: WHATSAPP_SOURCES[key as keyof typeof WHATSAPP_SOURCES] ?? 'Outros', total }))
    .sort((x, y) => y.total - x.total);
  return { days, visits, clicks, rate: visits > 0 ? clicks / visits : null, sources };
}
