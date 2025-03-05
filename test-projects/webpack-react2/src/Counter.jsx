import React, { useState } from "react";
import * as styles from './Counter.module.scss';

debugger;

export const Counter = ({ initial }) => {
  const [count, setCount] = useState(initial ?? 0);

  return (
    <div className={styles.testClass}>
      <div data-testid="count">{count}</div>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  );
}