import styles from './legacy-nested.module.css';

export const LegacyNestedTest = () => (
  <div className={styles.card} data-testid="legacy-nested">
    <div className={styles.panel}>
      <h2>reached by both</h2>
      <section>
        <h2>reached by the descendant rule only</h2>
      </section>
    </div>
  </div>
);
