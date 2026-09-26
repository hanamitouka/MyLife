import { useRef, useState } from 'react';

const THRESHOLD = 64;

/**
 * 下拉刷新 hook：返回绑定到滚动容器上的 touch 处理器 + 状态。
 * 只在容器已滚到顶部（scrollTop <= 0）时向下拉才触发。
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent<HTMLElement>) {
    if (refreshing) return;
    startY.current = e.currentTarget.scrollTop <= 0 ? e.touches[0].clientY : null;
  }

  function onTouchMove(e: React.TouchEvent<HTMLElement>) {
    if (startY.current === null || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    setPull(Math.max(0, Math.min(dy, 120)));
  }

  function onTouchEnd() {
    if (startY.current === null) return;
    const shouldRefresh = pull >= THRESHOLD && !refreshing;
    setPull(0);
    startY.current = null;
    if (shouldRefresh) {
      setRefreshing(true);
      void onRefresh().finally(() => setRefreshing(false));
    }
  }

  return {
    pulling: pull > 0,
    ready: pull >= THRESHOLD,
    refreshing,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
