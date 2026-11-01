import { clampArea, cropFileName } from '../../utils/cropImage';
import { heroCropPresets, splitPhotoPresets } from './cropPresets';

describe('proporções do editor de recorte', () => {
  it('foto do topo: começa pelo formato escolhido na seção', () => {
    expect(heroCropPresets(undefined).map((p) => p.value)).toEqual(['horizontal', 'quadrada', 'vertical']);
    expect(heroCropPresets('vertical').map((p) => p.value)).toEqual(['vertical', 'horizontal', 'quadrada']);
    expect(heroCropPresets('horizontal')[0].aspect).toBe(1.25);
  });

  it('texto com imagem: quadrada quando a foto preenche o espaço, livre quando aparece inteira', () => {
    expect(splitPhotoPresets('cortada')[0].aspect).toBe(1);
    expect(splitPhotoPresets('inteira')[0].aspect).toBeNull();
  });
});

describe('recorte no navegador', () => {
  it('mantém a área dentro da imagem, em pixels inteiros', () => {
    expect(clampArea({ x: -3.4, y: 10.6, width: 2000, height: 50.2 }, 1600, 1200)).toEqual({
      x: 0,
      y: 11,
      width: 1600,
      height: 50,
    });
    expect(clampArea({ x: 1700, y: 0, width: 10, height: 10 }, 1600, 1200)).toEqual({
      x: 1599,
      y: 0,
      width: 1,
      height: 10,
    });
  });

  it('nome do recorte na biblioteca', () => {
    expect(cropFileName('IMG_2588.jpg', 'image/webp')).toBe('IMG_2588 (recorte).webp');
    expect(cropFileName('logo (recorte).png', 'image/png')).toBe('logo (recorte).png');
    expect(cropFileName('', 'image/webp')).toBe('imagem (recorte).webp');
  });
});
