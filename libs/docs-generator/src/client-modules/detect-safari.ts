// Tags <html> with `is-safari` on hydration so CSS can opt specific
// animations out — see custom.css for the matching rule.
//
// Reason: WebKit only interpolates standardized font-variation axes
// (wght/wdth/slnt). Our hover animation changes Roboto Flex custom axes
// (XOPQ/XTRA/YTLC/etc.), so Safari snaps mid-transition. Disabling the
// hover-state variation entirely is cleaner than a broken animation.

export const onRouteUpdate = () => {
  if (typeof navigator === 'undefined') return;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafari) document.documentElement.classList.add('is-safari');
};
