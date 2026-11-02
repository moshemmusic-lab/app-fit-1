import { t } from '@/lib/i18n';

import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.card}>
        <h1 className={styles.wordmark}>
          {t.app.name}
          <span className={styles.dot}>.</span>
        </h1>
        <p className={styles.tagline}>{t.web.tagline}</p>
        <p className={styles.soon}>{t.web.comingSoon}</p>
      </section>
    </main>
  );
}
