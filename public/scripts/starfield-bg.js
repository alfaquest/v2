(function () {
  if (typeof document === "undefined") return;

  function initStarfield() {
    const body = document.body;
    if (!body || document.getElementById("starfield-bg")) return;

    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = document.createElement("canvas");
    canvas.id = "starfield-bg";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "0";
    canvas.style.opacity = "0.82";

    const style = document.createElement("style");
    style.textContent = [
      "body.starfield-active > * { position: relative; z-index: 1; }",
      "#starfield-bg { mix-blend-mode: screen; }",
    ].join("\n");
    document.head.appendChild(style);

    body.classList.add("starfield-active");
    body.insertBefore(canvas, body.firstChild);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR_CAP = 1.8;
    const STAR_DENSITY = 0.00008;
    const MIN_STARS = 120;
    const MAX_STARS = 420;

    let width = 0;
    let height = 0;
    let centerX = 0;
    let centerY = 0;
    let scale = 0;
    let speed = 0.62;
    let stars = [];
    let rafId = 0;
    let lastTs = 0;

    function createStar() {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.pow(Math.random(), 0.35) * 1.05;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: 0.05 + Math.random() * 0.95,
        b: 0.45 + Math.random() * 0.55,
      };
    }

    function resetStar(star) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.pow(Math.random(), 0.4) * 1.1;
      star.x = Math.cos(angle) * radius;
      star.y = Math.sin(angle) * radius;
      star.z = 0.92 + Math.random() * 0.08;
      star.b = 0.45 + Math.random() * 0.55;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      width = Math.floor(window.innerWidth);
      height = Math.floor(window.innerHeight);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      centerX = width * 0.5;
      centerY = height * 0.5;
      scale = Math.min(width, height) * 0.92;

      const targetCount = Math.max(
        MIN_STARS,
        Math.min(MAX_STARS, Math.floor(width * height * STAR_DENSITY))
      );

      if (stars.length < targetCount) {
        for (let i = stars.length; i < targetCount; i += 1) {
          stars.push(createStar());
        }
      } else if (stars.length > targetCount) {
        stars.length = targetCount;
      }

      speed = Math.max(0.44, Math.min(0.82, width / 1600));
    }

    function drawStaticFrame() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(5, 18, 35, 0.55)";
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i += 1) {
        const star = stars[i];
        const z = Math.max(0.001, star.z);
        const x = centerX + (star.x / z) * scale;
        const y = centerY + (star.y / z) * scale;
        if (x < -4 || x > width + 4 || y < -4 || y > height + 4) continue;

        const size = 0.6 + (1 - z) * 1.4;
        const alpha = 0.18 + (1 - z) * 0.35 * star.b;
        ctx.fillStyle = "rgba(176, 223, 255, " + alpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function animate(ts) {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(4, 14, 28, 0.35)";
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i += 1) {
        const star = stars[i];
        const prevZ = star.z;
        star.z -= speed * dt;

        if (star.z <= 0.01) {
          resetStar(star);
          continue;
        }

        const x = centerX + (star.x / star.z) * scale;
        const y = centerY + (star.y / star.z) * scale;
        const px = centerX + (star.x / prevZ) * scale;
        const py = centerY + (star.y / prevZ) * scale;

        if (
          x < -50 ||
          x > width + 50 ||
          y < -50 ||
          y > height + 50
        ) {
          resetStar(star);
          continue;
        }

        const brightness = 0.24 + (1 - star.z) * 0.76 * star.b;
        const trailWidth = 0.6 + (1 - star.z) * 1.9;

        ctx.strokeStyle =
          "rgba(170, 220, 255, " + brightness.toFixed(3) + ")";
        ctx.lineWidth = trailWidth;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      rafId = window.requestAnimationFrame(animate);
    }

    function onVisibilityChange() {
      if (document.hidden) {
        if (rafId) window.cancelAnimationFrame(rafId);
        rafId = 0;
        return;
      }
      lastTs = 0;
      if (!prefersReducedMotion && !rafId) {
        rafId = window.requestAnimationFrame(animate);
      }
    }

    resize();
    if (prefersReducedMotion) {
      drawStaticFrame();
    } else {
      rafId = window.requestAnimationFrame(animate);
    }

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStarfield, {
      once: true,
    });
  } else {
    initStarfield();
  }
})();