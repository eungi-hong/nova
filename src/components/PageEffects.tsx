import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Re-runs the same vanilla effects from the original site:
 *  - scroll progress bar
 *  - parallax on hero/title
 *  - reveal-on-scroll for .reveal nodes
 *  - word-stagger for .cover__title / .post-title / .pull-quote q
 *  - custom cursor
 *
 * It runs after every route change to re-bind to fresh DOM.
 */
export function PageEffects() {
  const { pathname } = useLocation();

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = matchMedia("(pointer: coarse)").matches;

    const progress = document.querySelector<HTMLElement>(".scroll-progress") || (() => {
      const el = document.createElement("div");
      el.className = "scroll-progress";
      document.body.appendChild(el);
      return el;
    })();

    const cleanups: Array<() => void> = [];

    const splitTargets = document.querySelectorAll<HTMLElement>(
      ".cover__title, .post-title, .pull-quote q, .home__title",
    );
    splitTargets.forEach((el) => {
      if (el.dataset.split) return;
      const walk = (node: Node) => {
        if (node.nodeType === 3) {
          const frag = document.createDocumentFragment();
          const parts = (node.textContent || "").split(/(\s+)/);
          parts.forEach((p) => {
            if (/^\s+$/.test(p)) {
              frag.appendChild(document.createTextNode(p));
            } else if (p.length) {
              const w = document.createElement("span");
              w.className = "word";
              w.textContent = p;
              frag.appendChild(w);
            }
          });
          (node as ChildNode).replaceWith(frag);
        } else if (node.nodeType === 1 && (node as HTMLElement).childNodes.length) {
          Array.from((node as HTMLElement).childNodes).forEach(walk);
        }
      };
      Array.from(el.childNodes).forEach(walk);
      el.querySelectorAll<HTMLElement>(".word").forEach((w, i) => {
        w.style.transitionDelay = `${Math.min(i * 0.06, 1.2)}s`;
      });
      el.dataset.split = "1";
    });

    const revealIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            (e.target as HTMLElement).querySelectorAll<HTMLElement>(".word").forEach((w) =>
              w.classList.add("in"),
            );
            revealIO.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );
    const observeReveal = (el: Element) => {
      if ((el as HTMLElement).dataset.revealObserved) return;
      (el as HTMLElement).dataset.revealObserved = "1";
      revealIO.observe(el);
    };
    document.querySelectorAll(".reveal").forEach(observeReveal);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const el = node as HTMLElement;
          if (el.classList?.contains("reveal")) observeReveal(el);
          el.querySelectorAll?.(".reveal").forEach(observeReveal);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => {
      revealIO.disconnect();
      mo.disconnect();
    });

    requestAnimationFrame(() => {
      splitTargets.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < innerHeight) {
          el.querySelectorAll<HTMLElement>(".word").forEach((w) => w.classList.add("in"));
        }
      });
    });

    const parallaxEls: { el: HTMLElement; speed: number }[] = [
      ...Array.from(document.querySelectorAll<HTMLElement>(".cover__title, .post-title, .home__title")).map(
        (el) => ({ el, speed: -0.15 }),
      ),
    ];
    const heroImg = document.querySelector<HTMLElement>(".cover__hero .photo-slot");
    if (heroImg) parallaxEls.push({ el: heroImg, speed: 0.08 });

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const docH = document.documentElement.scrollHeight - innerHeight;
        progress.style.width = docH > 0 ? `${(y / docH) * 100}%` : "0%";
        if (!reduced) {
          parallaxEls.forEach(({ el, speed }) => {
            el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
          });
        }
        ticking = false;
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    cleanups.push(() => removeEventListener("scroll", onScroll));

    if (!coarse && !reduced) {
      const existingCursor = document.querySelector(".cursor");
      const existingDot = document.querySelector(".cursor-dot");
      let cursor = existingCursor as HTMLElement | null;
      let dot = existingDot as HTMLElement | null;
      if (!cursor) {
        cursor = document.createElement("div");
        cursor.className = "cursor";
        document.body.appendChild(cursor);
      }
      if (!dot) {
        dot = document.createElement("div");
        dot.className = "cursor-dot";
        document.body.appendChild(dot);
      }
      let mx = innerWidth / 2;
      let my = innerHeight / 2;
      let cx = mx;
      let cy = my;
      let dx = mx;
      let dy = my;
      const onMove = (e: MouseEvent) => {
        mx = e.clientX;
        my = e.clientY;
      };
      addEventListener("mousemove", onMove, { passive: true });
      let raf = 0;
      const loop = () => {
        cx += (mx - cx) * 0.14;
        cy += (my - cy) * 0.14;
        dx += (mx - dx) * 0.4;
        dy += (my - dy) * 0.4;
        cursor!.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
        dot!.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
        raf = requestAnimationFrame(loop);
      };
      loop();

      const hoverables = document.querySelectorAll<HTMLElement>(
        "a, .entry, .photo-slot, .video-slot, button, .home__diary-card, .editor__upload",
      );
      const onEnter = () => cursor!.classList.add("is-hover");
      const onLeave = () => cursor!.classList.remove("is-hover");
      hoverables.forEach((el) => {
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
      cleanups.push(() => {
        cancelAnimationFrame(raf);
        removeEventListener("mousemove", onMove);
        hoverables.forEach((el) => {
          el.removeEventListener("mouseenter", onEnter);
          el.removeEventListener("mouseleave", onLeave);
        });
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [pathname]);

  return null;
}
