import '@plumeria/core';
import { styles } from './Card.styles';

export const Card = () => (
  <div classStyle={[styles.base, styles.card]}>
    <span classStyle={styles.badge}>b</span>
    <span classStyle={styles.cardTitle}>t</span>
  </div>
);
