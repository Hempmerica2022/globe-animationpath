'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReactLenis } from '@studio-freight/react-lenis';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollGlobe({ children }) {
  const globeRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // 1. Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // 2. Setup the GSAP Timeline tied to the body scroll
    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1, // 1-second smoothing lag
          invalidateOnRefresh: true, // Recalculates on window resize
        }
      });

      // Get all sections to calculate side-to-side sweeping
      const sections = document.querySelectorAll('.scroll-section');
      
      sections.forEach((section, index) => {
        // Skip the last section here, we handle the pyramid landing separately
        if (index === sections.length - 1) return;

        const isEven = index % 2 === 0;
        const xOffset = isEven ? '40vw' : '-40vw';

        tl.to(globeRef.current, {
          x: xOffset,
          scale: 1, // Enlarge while traveling
          ease: "sine.inOut",
        });
      });

      // 3. Final Landing on the Pyramid
      tl.to(globeRef.current, {
        scale: 0.33, // Return to starting size
        x: () => {
          const target = document.querySelector("#pyramid-apex");
          if (!target) return 0;
          const targetRect = target.getBoundingClientRect();
          // Calculate delta from screen center
          return targetRect.left - (window.innerWidth / 2) + (targetRect.width / 2);
        },
        y: () => {
          const target = document.querySelector("#pyramid-apex");
          if (!target) return 0;
          const targetRect = target.getBoundingClientRect();
          return targetRect.top - (window.innerHeight / 2) + (targetRect.height / 2);
        },
        ease: "power2.inOut"
      });
    }, containerRef);

    return () => ctx.revert(); // Cleanup on unmount
  },[]);

  return (
    <ReactLenis root>
      <div ref={containerRef} className="relative w-full">
        {/* Fixed Globe Overlay */}
        <div 
          className="fixed top-0 left-0 w-screen h-screen z-50 pointer-events-none flex items-center justify-center"
        >
          <div 
            ref={globeRef} 
            className="w-32 h-32 bg-blue-500 rounded-full shadow-2xl will-change-transform"
            style={{ transform: 'scale(0.33)' }}
          >
            {/* Replace this div with your actual Globe Image/SVG/Component */}
          </div>
        </div>

        {/* Page Content goes here */}
        {children}
      </div>
    </ReactLenis>
  );
}
