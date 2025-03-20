import { useEffect, useRef, useState } from 'react';

export const TimeCount = () => {
  const [time, setTime] = useState(0);
  const requestRef = useRef(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      setTime(elapsed * 0.1);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return time;
};
