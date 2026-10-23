import type { EventSummaryRow } from '../../services/adminService';
import { summarize } from './metricsSummary';

// 17/10/2026 às 15h em Brasília.
const TODAY = new Date('2026-10-17T18:00:00Z');
const row = (day: string, kind: EventSummaryRow['kind'], total: number, source: string | null = null) => ({
  day,
  kind,
  source,
  total,
});

describe('resumo das métricas', () => {
  it('soma o período, preenche dias sem eventos e calcula a taxa de contato', () => {
    const s = summarize(
      [
        row('2026-10-17', 'visit', 10),
        row('2026-10-17', 'whatsapp_click', 2, 'botao_flutuante'),
        row('2026-10-15', 'visit', 30),
        row('2026-10-15', 'whatsapp_click', 3, 'formulario'),
        row('2026-10-15', 'whatsapp_click', 1, 'botao_flutuante'),
      ],
      7,
      TODAY,
    );
    expect(s.days).toHaveLength(7);
    expect(s.days[0].day).toBe('2026-10-11');
    expect(s.days[6]).toEqual({ day: '2026-10-17', visits: 10, clicks: 2 });
    expect(s.days[5]).toEqual({ day: '2026-10-16', visits: 0, clicks: 0 });
    expect(s.visits).toBe(40);
    expect(s.clicks).toBe(6);
    expect(s.rate).toBeCloseTo(0.15);
    expect(s.sources).toEqual([
      { key: 'botao_flutuante', label: 'Botão flutuante', total: 3 },
      { key: 'formulario', label: 'Formulário de orçamento', total: 3 },
    ]);
  });

  it('mostra o nome da seção quando o clique veio do botão de uma seção', () => {
    const s = summarize([row('2026-10-17', 'whatsapp_click', 4, 'sobre')], 7, TODAY, { sobre: 'Sobre nós' });
    expect(s.sources).toEqual([{ key: 'sobre', label: 'Sobre nós', total: 4 }]);
  });

  it('ignora dias fora do período e não divide por zero', () => {
    const s = summarize([row('2026-09-01', 'visit', 99), row('2026-10-17', 'whatsapp_click', 1, 'x')], 7, TODAY);
    expect(s.visits).toBe(0);
    expect(s.rate).toBeNull();
    expect(s.sources).toEqual([{ key: 'x', label: 'Outros', total: 1 }]);
  });
});
