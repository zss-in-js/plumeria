import styles from './legacy-held.module.css';

export const LegacyHeldTest = () => (
  <ul data-testid="legacy-held">
    <li className={styles.row}>one</li>
    <li className={styles.row}>two</li>
    <li className={styles.label}>three</li>
  </ul>
);
