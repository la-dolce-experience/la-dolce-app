import styles from './SectionHeading.module.css';

interface Props {
  id?: string;
  eyebrow?: string;
  title: string;
  body?: string;
  align?: 'left' | 'center';
  tone?: 'default' | 'inverse';
}

export function SectionHeading({ id, eyebrow, title, body, align = 'left', tone = 'default' }: Props) {
  return (
    <div className={[styles.heading, styles[align], styles[tone]].join(' ')}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      {body && <p className={`${styles.body} prewrap`}>{body}</p>}
    </div>
  );
}
