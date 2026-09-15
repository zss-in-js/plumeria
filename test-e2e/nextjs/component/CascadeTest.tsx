import '@plumeria/core';
import { cascadeBase } from 'component/cascade-base.styles';
import { cascadeCondition } from 'component/cascade-condition.styles';

export function CascadeTest() {
  return (
    <div
      style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}
    >
      <h3>Cascade Order Test</h3>
      <div
        data-testid="cascade-box"
        classStyle={[cascadeBase.box, cascadeCondition.box]}
      >
        base then condition
      </div>
      <div
        data-testid="cascade-box-reversed"
        classStyle={[cascadeCondition.box, cascadeBase.box]}
      >
        condition then base
      </div>
      <div
        data-testid="cascade-edge"
        classStyle={[cascadeBase.edge, cascadeCondition.box]}
      >
        base longhand against a conditional shorthand
      </div>
      <span
        data-testid="cascade-text"
        classStyle={[cascadeBase.text, cascadeCondition.text]}
      >
        hover me
      </span>
    </div>
  );
}
