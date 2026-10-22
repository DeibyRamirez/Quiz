"use client";

import { useEffect } from "react";

/** GSAP y Lenis solo se cargan en la portada. */
export function LandingMotion() {
  useEffect(() => {
    let vivo = true;
    let revertir: (() => void) | undefined;
    let destruirLenis: (() => void) | undefined;

    const arrancar = async () => {
      const gsapMod = await import("gsap");
      const stMod = await import("gsap/ScrollTrigger");
      const gsap = gsapMod.default;
      const ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      let easeHero = "power2.out";
      try {
        const ce = await import("gsap/CustomEase");
        gsap.registerPlugin(ce.CustomEase);
        ce.CustomEase.create("smoothPower2Out", "M0,0 C0.11,0.49 0.1,1 1,1");
        easeHero = "smoothPower2Out";
      } catch {
        easeHero = "power2.out";
      }

      type SplitHecho = { chars: Element[]; lines: Element[]; revert: () => void };
      type SplitClase = new (el: Element, vars: Record<string, unknown>) => SplitHecho;
      let SplitTextCtor: SplitClase | null = null;
      try {
        const sp = await import("gsap/SplitText");
        gsap.registerPlugin(sp.SplitText);
        SplitTextCtor = sp.SplitText as unknown as NonNullable<typeof SplitTextCtor>;
      } catch {
        SplitTextCtor = null;
      }

      if (!vivo) return;

      const SplitListo = SplitTextCtor;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-hero-line], [data-reveal]", { opacity: 1, y: 0, x: 0 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        import("lenis").then((mod) => {
          if (!vivo) return;
          const Lenis = mod.default;
          const lenis = new Lenis({ lerp: 0.1 });
          lenis.on("scroll", ScrollTrigger.update);
          const ticker = (time: number) => lenis.raf(time * 1000);
          gsap.ticker.add(ticker);
          gsap.ticker.lagSmoothing(0);
          destruirLenis = () => {
            gsap.ticker.remove(ticker);
            lenis.destroy();
          };
        });

        const titulo = document.querySelector("[data-hero-title]");
        if (titulo && SplitListo) {
          const clase: SplitClase = SplitListo;
          const split = new clase(titulo, { type: "lines,chars" });
          gsap.from(split.lines, {
            yPercent: 110,
            duration: 1,
            ease: easeHero,
            stagger: 0.08,
          });
          gsap.from(split.chars, {
            x: (i: number) => (i % 2 === 0 ? -28 : 28),
            opacity: 0,
            duration: 1.6,
            ease: "expo.out",
            stagger: 0.02,
          });
        } else {
          gsap.from("[data-hero-line]", {
            yPercent: 100,
            opacity: 0,
            duration: 1,
            ease: easeHero,
            stagger: 0.08,
          });
        }

        gsap.from("[data-reveal]", {
          y: "1em",
          opacity: 0,
          duration: 0.75,
          ease: "power3.out",
          stagger: 0.025,
          scrollTrigger: { trigger: "[data-reveal-root]", start: "top 85%" },
        });

        gsap.utils.toArray<HTMLElement>("[data-step-num]").forEach((el) => {
          gsap.fromTo(
            el,
            { yPercent: 20 },
            {
              yPercent: -30,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        });

        const pista = document.querySelector<HTMLElement>("[data-marquee]");
        if (pista) {
          pista.style.animation = "none";
          const tween = gsap.to(pista, {
            xPercent: -50,
            duration: 26,
            ease: "none",
            repeat: -1,
          });
          ScrollTrigger.create({
            onUpdate: (self) => {
              const velocidad = Math.abs(self.getVelocity());
              tween.timeScale(1 + Math.min(velocidad / 800, 3));
            },
          });
        }
      });

      revertir = () => mm.revert();
    };

    arrancar();
    return () => {
      vivo = false;
      destruirLenis?.();
      revertir?.();
    };
  }, []);

  return null;
}
