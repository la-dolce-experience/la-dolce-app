import { MAX_CROP_SIDE, clampArea, cropFileName, planCrop } from '../../utils/cropImage';
import { OG_PRESETS, heroCropPresets, splitPhotoPresets } from './cropPresets';

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

  it('aproximando, desenha só a área escolhida, sem sobra', () => {
    expect(planCrop({ x: 100, y: 50, width: 800, height: 800 }, 1600, 1200)).toEqual({
      width: 800,
      height: 800,
      source: { x: 100, y: 50, width: 800, height: 800 },
      dest: { x: 0, y: 0, width: 800, height: 800 },
    });
  });

  it('afastando, a moldura passa das bordas e a foto inteira fica centralizada com sobra', () => {
    // Foto 1600 × 1200 numa moldura quadrada de 1600: 200 px de sobra em cima e embaixo.
    expect(planCrop({ x: 0, y: -200, width: 1600, height: 1600 }, 1600, 1200)).toEqual({
      width: 1600,
      height: 1600,
      source: { x: 0, y: 0, width: 1600, height: 1200 },
      dest: { x: 0, y: 200, width: 1600, height: 1200 },
    });
  });

  it('afastando muito, reduz a imagem final ao lado máximo', () => {
    const plan = planCrop({ x: -3000, y: -3000, width: 8192, height: 8192 }, 2000, 2000);
    expect(plan).toMatchObject({ width: MAX_CROP_SIDE, height: MAX_CROP_SIDE });
    expect(plan?.dest).toEqual({ x: 1500, y: 1500, width: 1000, height: 1000 });
  });

  it('foto arrastada para fora da moldura não gera recorte', () => {
    expect(planCrop({ x: 1700, y: 0, width: 500, height: 500 }, 1600, 1200)).toBeNull();
  });

  it('imagem de compartilhamento afasta com fundo branco; os outros formatos, transparente', () => {
    expect(OG_PRESETS[0].background).toBe('#ffffff');
    expect(splitPhotoPresets('cortada')[0].background).toBeUndefined();
  });

  it('nome do recorte na biblioteca', () => {
    expect(cropFileName('IMG_2588.jpg', 'image/webp')).toBe('IMG_2588 (recorte).webp');
    expect(cropFileName('logo (recorte).png', 'image/png')).toBe('logo (recorte).png');
    expect(cropFileName('', 'image/webp')).toBe('imagem (recorte).webp');
  });
});
