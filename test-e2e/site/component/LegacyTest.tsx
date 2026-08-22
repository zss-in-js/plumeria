import styles from './legacy.module.css';

export const LegacyTest = () => (
  <section data-testid="legacy">
    <div className={`${styles.card} ${styles.featured}`} data-open="true">
      <h2>Legacy heading</h2>
      <p className={styles.title}>Legacy title</p>
      <p className={styles.screenOnly}>never carried with the print rule</p>
      <p className={`${styles.emphasis} ${styles.tone}`}>
        written emphasis-first, declared tone-first
      </p>
      <div className={styles.body}>
        <span className={styles.note}>Legacy note</span>
      </div>
      <ul className={styles.list}>
        <li>one</li>
        <li>two</li>
      </ul>
    </div>
  </section>
);
