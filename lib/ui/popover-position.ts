/** Keep a right-aligned popover fully inside the viewport. */
export function getAnchoredPopoverStyle(
  anchor: DOMRect,
  {
    maxWidth = 384,
    gutter = 16,
    offset = 8,
  }: {
    maxWidth?: number;
    gutter?: number;
    offset?: number;
  } = {},
) {
  const width = Math.min(maxWidth, window.innerWidth - gutter * 2);
  const left = Math.min(
    Math.max(gutter, anchor.right - width),
    window.innerWidth - gutter - width,
  );

  return {
    top: anchor.bottom + offset,
    left,
    width,
    maxHeight: `min(24rem, calc(100dvh - ${anchor.bottom + offset}px - 5.5rem))`,
  };
}
