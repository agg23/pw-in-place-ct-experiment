import { useState } from "react";
// import styles from './Counter.module.scss';

export const Counter: React.FC<{ initial?: number }> = ({ initial }) => {
  const [count, setCount] = useState(initial ?? 0);

  return (
    <div>
      <div data-testid="count">{count}</div>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count + 1)}>Decrement</button>
    </div>
  );
}