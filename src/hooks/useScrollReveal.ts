import { useEffect } from "react";

/**
 * Hook ligero de IntersectionObserver para activar animaciones fluidas al hacer scroll.
 * Observa todos los elementos con la clase `.reveal-on-scroll` y les añade `.is-revealed`
 * al entrar en el viewport, respetando la configuración de accesibilidad prefers-reduced-motion.
 */
export function useScrollReveal(trigger?: unknown) {
  useEffect(() => {
    // Si el usuario prefiere movimiento reducido, marcar como revelados inmediatamente
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const elements = document.querySelectorAll(".reveal-on-scroll");
      elements.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            obs.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -50px 0px",
        threshold: 0.08,
      },
    );

    // Timeout mínimo para asegurar que el DOM derivado de React esté montado
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll(".reveal-on-scroll");
      elements.forEach((el) => observer.observe(el));
    }, 40);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [trigger]);
}
