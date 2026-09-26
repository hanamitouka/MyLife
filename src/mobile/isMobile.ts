/** 判断当前是否运行在移动端（安卓 / iOS WebView，或浏览器用 ?mobile 模拟）。 */
export function isMobilePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  // 开发调试：加 ?mobile 可在桌面浏览器里预览移动端界面
  if (new URLSearchParams(window.location.search).has('mobile')) return true;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
