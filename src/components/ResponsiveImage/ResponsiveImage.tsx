import type { ImageRef } from '../../types/content';

interface Props {
  image: ImageRef;
  /** Tamanho exibido por breakpoint, usado pelo navegador para escolher a variante. */
  sizes?: string;
  /** Imagem da primeira dobra: carrega com prioridade e sem lazy loading. */
  priority?: boolean;
  className?: string;
  alt?: string;
}

export function ResponsiveImage({ image, sizes = '100vw', priority = false, className, alt }: Props) {
  return (
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={image.srcSet ? sizes : undefined}
      width={image.width}
      height={image.height}
      alt={alt ?? image.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={className}
    />
  );
}
