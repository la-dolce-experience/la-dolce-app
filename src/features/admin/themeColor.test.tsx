import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { formatRatio } from '../site/sectionThemes';
import { ThemePicker } from './components/ThemePicker';
import { themeColorError } from './themeColor';

describe('cor de fundo personalizada', () => {
  it('só valida quando a cor personalizada está escolhida', () => {
    expect(themeColorError('acai', 'qualquer')).toBeNull();
    expect(themeColorError('personalizada', '#1d4ed8')).toBeNull();
    expect(themeColorError('personalizada', '1d4ed8')).toMatch(/#RRGGBB/);
    expect(themeColorError('personalizada', '#777777')).toMatch(/contraste suficiente/);
  });

  it('nunca arredonda o contraste para cima', () => {
    expect(formatRatio(4.4999)).toBe('4,49:1');
    expect(formatRatio(13.14)).toBe('13,14:1');
  });

  it('amostras clicáveis, campo hexadecimal e aviso de contraste', () => {
    function Harness() {
      const [state, setState] = useState({ theme: 'padrao', color: '' });
      return (
        <ThemePicker
          id="t"
          theme={state.theme}
          color={state.color}
          onChange={(theme, color) => setState({ theme, color })}
        />
      );
    }
    render(<Harness />);
    expect(screen.getByRole('radio', { name: 'Padrão' })).toBeChecked();
    expect(screen.queryByLabelText('Código da cor')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Cor personalizada' }));
    const hex = screen.getByLabelText('Código da cor');
    expect(hex).toHaveValue('#1d4ed8');
    expect(screen.getByRole('status')).toHaveTextContent('Texto branco');

    fireEvent.change(hex, { target: { value: 'fde68a' } });
    expect(hex).toHaveValue('#fde68a');
    expect(screen.getByRole('status')).toHaveTextContent('Texto escuro');

    fireEvent.change(hex, { target: { value: '#777777' } });
    expect(screen.getByRole('alert')).toHaveTextContent('4,47:1');
    expect(hex).toHaveAttribute('aria-invalid', 'true');
  });
});
