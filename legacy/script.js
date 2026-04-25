(() => {
  const content = window.STAGE_DIARY_CONTENT;
  const pageRoot = document.querySelector("main.page");

  const create = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value == null) return;
      if (key === "className") node.className = value;
      else if (key === "dataset") Object.entries(value).forEach(([dataKey, dataValue]) => {
        if (dataValue != null) node.dataset[dataKey] = dataValue;
      });
      else if (key === "html") node.innerHTML = value;
      else if (key in node) node[key] = value;
      else node.setAttribute(key, value);
    });
    children.forEach((child) => {
      if (child == null) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  };

  const paragraphBlock = (paragraphs) => create("div", { className: "section-body reveal" },
    paragraphs.map((paragraph) => create("p", { html: paragraph }))
  );

  const renderIndexPage = () => {
    const data = content.index;
    document.title = data.title;
    pageRoot.replaceChildren(
      create("section", { className: "cover grid" }, [
        create("p", { className: "cover__eyebrow reveal", textContent: data.cover.eyebrow }),
        create("h1", { className: "cover__title reveal", html: data.cover.titleHtml }),
        create("figure", { className: "cover__hero reveal" }, [
          create("div", { className: "photo-slot", dataset: { label: data.cover.heroLabel } }),
          create("figcaption", { className: "caption", textContent: data.cover.heroCaption }),
        ]),
        create("p", { className: "cover__sub reveal", html: data.cover.subHtml }),
        create("p", { className: "cover__lede reveal", textContent: data.cover.lede }),
      ]),
      create("div", { className: "divider grid" }, [
        create("span"),
        create("span", { className: "divider__mark", textContent: "✻" }),
        create("span"),
      ]),
      create("section", { className: "index grid" }, [
        create("h2", { className: "index__heading reveal" }, [
          create("span", { textContent: "the index" }),
          create("span", { textContent: "04 entries" }),
        ]),
        create("ol", { className: "index__list" },
          data.entries.map((entry) => create("li", {}, [
            create("a", { className: "entry reveal", href: entry.href }, [
              create("span", { className: "entry__num", textContent: entry.num }),
              create("span", { className: "entry__title", html: entry.titleHtml }),
              create("span", { className: "entry__venue", textContent: entry.venue }),
              create("span", { className: "entry__date", textContent: entry.date }),
            ]),
          ]))
        ),
      ]),
      create("footer", { className: "page-foot" }, [
        create("span", { textContent: data.footerLeft }),
        create("span", { textContent: data.footerRight }),
      ])
    );
  };

  const renderPostPage = (slug) => {
    const data = content.posts[slug];
    if (!data) return;
    document.title = data.title;
    const navPrev = data.nav.prev;
    const navNext = data.nav.next;
    pageRoot.replaceChildren(
      create("section", { className: "grid" }, [
        create("p", { className: "post-eyebrow reveal", textContent: data.eyebrow }),
        create("h1", { className: "post-title reveal", html: data.titleHtml }),
        create("div", { className: "post-meta reveal" },
          data.meta.map((item) => create("span", {}, [
            document.createTextNode(item.label + " "),
            create("strong", { textContent: item.value }),
          ]))
        ),
        create("p", { className: "post-intro reveal", textContent: data.intro }),
      ]),
      ...data.sections.flatMap((section) => [
        create("section", { className: "section-row" }, [
          create("p", { className: "section-label reveal", textContent: section.label }),
          paragraphBlock(section.paragraphs),
        ]),
      ]),
      create("section", { className: "photo-grid" },
        data.photoCaptions.map((caption, index) => create("figure", { className: "reveal" }, [
          create("div", { className: `photo-slot photo-slot--${String.fromCharCode(97 + index)}`, dataset: { label: `photo 0${index + 1}${index === 0 ? " · hero" : ""}` } }),
          create("figcaption", { className: "caption", textContent: caption }),
        ]))
      ),
      create("blockquote", { className: "pull-quote reveal" }, [
        create("q", { textContent: data.quote }),
      ]),
      create("figure", { className: "reveal" }, [
        create("div", { className: "video-slot" }),
        create("figcaption", { className: "caption", textContent: data.videoCaption }),
      ]),
      create("nav", { className: "post-nav" }, [
        create("a", { href: navPrev.href, className: "prev" }, [
          create("div", { className: "post-nav__kicker", html: navPrev.kicker }),
          create("div", { className: "post-nav__title", html: navPrev.titleHtml }),
        ]),
        create("a", { href: navNext.href, className: "next" }, [
          create("div", { className: "post-nav__kicker", html: navNext.kicker }),
          create("div", { className: "post-nav__title", html: navNext.titleHtml }),
        ]),
      ]),
      create("div", { className: "folio" }, [
        create("span", { textContent: data.folio[0] }),
        create("span", { textContent: data.folio[1] }),
      ])
    );
  };

  if (content && pageRoot) {
    const pathname = window.location.pathname.split("/").pop() || "index.html";
    if (pathname === "index.html" || pathname === "") {
      renderIndexPage();
    } else {
      renderPostPage(pathname.replace(/\.html$/, ""));
    }
  }

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;

  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  document.body.appendChild(progress);

  /* ————— split hero/post titles into words for stagger reveal ————— */

  const splitTargets = document.querySelectorAll(".cover__title, .post-title, .pull-quote q");
  splitTargets.forEach((el) => {
    // Walk nodes so <br>, <em>, <strong> stay intact.
    const walk = (node) => {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        const parts = node.textContent.split(/(\s+)/);
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
        node.replaceWith(frag);
      } else if (node.nodeType === 1 && node.childNodes.length) {
        Array.from(node.childNodes).forEach(walk);
      }
    };
    Array.from(el.childNodes).forEach(walk);
    // stagger
    el.querySelectorAll(".word").forEach((w, i) => {
      w.style.transitionDelay = `${Math.min(i * 0.06, 1.2)}s`;
    });
  });

  /* ————— reveal on scroll ————— */

  const revealIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        e.target.querySelectorAll(".word").forEach((w) => w.classList.add("in"));
        revealIO.unobserve(e.target);
      }
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -10% 0px" });

  document.querySelectorAll(".reveal").forEach((el) => revealIO.observe(el));

  // titles above the fold need immediate reveal for their words
  requestAnimationFrame(() => {
    splitTargets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < innerHeight) {
        el.querySelectorAll(".word").forEach((w) => w.classList.add("in"));
      }
    });
  });

  /* ————— parallax on hero + title + photo ————— */

  const parallaxEls = [
    ...document.querySelectorAll(".cover__title, .post-title"),
  ].map((el) => ({ el, speed: -0.15 }));

  const heroImg = document.querySelector(".cover__hero .photo-slot");
  if (heroImg) parallaxEls.push({ el: heroImg, speed: 0.08 });

  /* ————— scroll progress + parallax (single rAF loop) ————— */

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

  /* ————— custom cursor ————— */

  if (!coarse && !reduced) {
    const cursor = document.createElement("div");
    cursor.className = "cursor";
    document.body.appendChild(cursor);
    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    document.body.appendChild(dot);

    let mx = innerWidth / 2, my = innerHeight / 2;
    let cx = mx, cy = my;
    let dx = mx, dy = my;

    addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
    }, { passive: true });

    const loop = () => {
      cx += (mx - cx) * 0.14;
      cy += (my - cy) * 0.14;
      dx += (mx - dx) * 0.4;
      dy += (my - dy) * 0.4;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();

    const hoverables = "a, .entry, .photo-slot, .video-slot, button";
    document.querySelectorAll(hoverables).forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
  }
})();
