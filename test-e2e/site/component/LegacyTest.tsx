import styles from './legacy.module.css';

export const LegacyTest = () => (
  <section data-testid="legacy">
    <div className={`${styles.card} ${styles.featured}`} data-open="true">
      <h2>Legacy heading</h2>
      <p className={styles.title}>Legacy title</p>
      <div className={styles.body}>
        <span className={styles.note}>Legacy note</span>
      </div>
      <ul className={styles.list}>
        <li className={styles.item}>one</li>
        <li className={styles.item}>two</li>
        <li className={styles.item}>three</li>
      </ul>
    </div>
  </section>
);
