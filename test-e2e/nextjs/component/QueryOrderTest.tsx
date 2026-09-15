import '@plumeria/core';
import { queryMedium } from 'component/query-medium.styles';
import { queryWide } from 'component/query-wide.styles';

export function QueryOrderTest() {
  return (
    <div
      style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}
    >
      <h3>Query Order Test</h3>
      <span
        data-testid="query-pair"
        classStyle={[queryMedium.box, queryWide.box]}
      >
        narrower written second
      </span>
      <span
        data-testid="query-pair-reversed"
        classStyle={[queryWide.box, queryMedium.box]}
      >
        narrower written first
      </span>
      <span data-testid="query-solo" classStyle={queryWide.box}>
        the wide one on its own, which pins its rule when this module is
        compiled first
      </span>
    </div>
  );
}
