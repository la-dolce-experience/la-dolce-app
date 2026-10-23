import { CircleHelp, PartyPopper, Sparkles } from 'lucide-react';
import { defaultIconKey, SECTION_ICONS, sectionIcon } from './sectionIcons';

describe('ícones das seções', () => {
  it('usa o ícone escolhido no painel', () => {
    expect(sectionIcon({ type: 'faq', icon: 'party-popper' })).toBe(PartyPopper);
  });

  it('sem escolha, ou com um nome desconhecido, usa o ícone do tipo', () => {
    expect(sectionIcon({ type: 'faq', icon: '' })).toBe(CircleHelp);
    expect(sectionIcon({ type: 'hero', icon: 'nao-existe' })).toBe(Sparkles);
  });

  it('o ícone padrão de cada tipo está no catálogo e os nomes não se repetem', () => {
    const keys = SECTION_ICONS.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(defaultIconKey('faq')).toBe('circle-help');
    for (const key of keys) expect(key).toMatch(/^[a-z0-9-]{1,40}$/); // mesmo formato aceito pelo banco
  });
});
