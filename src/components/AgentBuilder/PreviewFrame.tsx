import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders the site preview inside an iframe.
 *
 * Without one the preview is a lie at every width except the one you happen to
 * be at. Tailwind's breakpoints are media queries, and a media query measures
 * the WINDOW, not the box the preview is drawn in. So a 375px-wide preview panel
 * inside a 1900px browser rendered the full desktop layout squeezed into a phone
 * -shaped column: navigation that a real phone collapses stayed expanded, grids
 * that stack stayed side by side, and the device buttons changed the width of
 * the frame while changing nothing about the page inside it.
 *
 * An iframe has its own viewport. Media queries resolve against the frame, so
 * the phone button now shows what a phone shows.
 *
 * Styles are copied from the parent document rather than rebuilt, because the
 * preview must use the same CSS the deployed site is built from — a second
 * stylesheet would drift, and drifting between preview and deploy is the whole
 * failure this is meant to end.
 */

export interface PreviewFrameProps {
  /** Applied to the frame's own root, since the frame has no other styling. */
  bodyStyle?: React.CSSProperties;
  bodyClassName?: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
}

/** Clones every stylesheet and style tag from the host page into the frame. */
function syncStyles(doc: Document) {
  const head = doc.head;
  head.querySelectorAll('[data-preview-style]').forEach(n => n.remove());
  document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
    const clone = node.cloneNode(true) as HTMLElement;
    clone.setAttribute('data-preview-style', '');
    head.appendChild(clone);
  });
  // The frame is its own document and inherits nothing from the host's reset.
  if (!head.querySelector('[data-preview-base]')) {
    const base = doc.createElement('style');
    base.setAttribute('data-preview-base', '');
    base.textContent = 'html,body{margin:0;padding:0;background:transparent}';
    head.appendChild(base);
  }
}

export function PreviewFrame({ bodyStyle, bodyClassName, className, title, children }: PreviewFrameProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const frame = ref.current;
    const doc = frame?.contentDocument;
    if (!doc) return;

    doc.body.innerHTML = '';
    const mount = doc.createElement('div');
    doc.body.appendChild(mount);
    syncStyles(doc);
    setRoot(mount);

    // Vite injects styles as the app runs, and the operator changes themes while
    // the frame is open. Without this the preview keeps whatever CSS existed the
    // moment it mounted.
    const observer = new MutationObserver(() => syncStyles(doc));
    observer.observe(document.head, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!root) return;
    Object.assign(root.style, bodyStyle || {});
    root.className = bodyClassName || '';
  }, [root, bodyStyle, bodyClassName]);

  return (
    <iframe ref={ref} title={title || 'Site preview'} className={className}>
      {root && createPortal(children, root)}
    </iframe>
  );
}
