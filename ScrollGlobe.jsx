'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReactLenis } from '@studio-freight/react-lenis';

gsap.registerPlugin(ScrollTrigger);

const desktopPath = [
  { id: 'sec-rio', x: '72vw', y: '-34vh', scale: 1.06, rotate: -7, body: 'earth' },
  { id: 'sec-waf', x: '-68vw', y: '-14vh', scale: 1.02, rotate: -9, body: 'earth' },
  { id: 'sec-peyote', x: '68vw', y: '8vh', scale: 0.98, rotate: 10, body: 'earth' },
  { id: 'sec-toad', x: '-68vw', y: '24vh', scale: 0.95, rotate: -10, body: 'earth' },
  { id: 'sec-support', x: '68vw', y: '36vh', scale: 0.92, rotate: 8, body: 'earth' },
  { id: 'sec-network', x: '-68vw', y: '48vh', scale: 0.88, rotate: -7, body: 'earth' },
];

const mobilePath = [
  { id: 'sec-rio', x: '52vw', y: '-32vh', scale: 0.82, rotate: -6, body: 'earth' },
  { id: 'sec-waf', x: '-48vw', y: '-16vh', scale: 0.9, rotate: -7, body: 'earth' },
  { id: 'sec-peyote', x: '48vw', y: '2vh', scale: 0.92, rotate: 8, body: 'earth' },
  { id: 'sec-toad', x: '-48vw', y: '18vh', scale: 0.9, rotate: -7, body: 'earth' },
  { id: 'sec-support', x: '48vw', y: '28vh', scale: 0.86, rotate: 7, body: 'earth' },
  { id: 'sec-network', x: '-48vw', y: '38vh', scale: 0.82, rotate: -5, body: 'earth' },
];

function pyramidTarget() {
  const apex = document.querySelector('#pyramid-apex');
  if (!apex) return { x: '0vw', y: '-18vh' };
  const rect = apex.getBoundingClientRect();
  const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100 - 50;
  const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100 - 50;
  return { x: `${x}vw`, y: `${y - 12}vh` };
}

function PlaceholderGlobe({ body }) {
  const moon = body === 'moon';
  return (
    <div className={moon ? 'sg-globe sg-moon' : 'sg-globe sg-earth'}>
      <span className="sg-shine" />
      <span className="sg-land sg-land-a" />
      <span className="sg-land sg-land-b" />
      <span className="sg-land sg-land-c" />
    </div>
  );
}

export default function ScrollGlobe({ children, globe, moonGlobe }) {
  const globeRef = useRef(null);
  const containerRef = useRef(null);
  const [body, setBody] = useState('earth');

  useEffect(() => {
    const globeEl = globeRef.current;
    if (!globeEl) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const path = window.innerWidth < 860 ? mobilePath : desktopPath;

    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    gsap.killTweensOf(globeEl);

    const moveTo = (target, duration = 1.8) => {
      setBody(target.body || 'earth');
      const vars = {
        x: target.x,
        y: target.y,
        scale: target.scale,
        rotate: target.rotate,
        overwrite: 'auto',
      };

      if (reduced) gsap.set(globeEl, vars);
      else gsap.to(globeEl, { ...vars, duration, ease: 'power3.inOut' });
    };

    gsap.set(globeEl, {
      x: path[0].x,
      y: path[0].y,
      scale: path[0].scale,
      rotate: path[0].rotate,
      transformOrigin: 'center center',
      force3D: true,
    });

    path.forEach((target) => {
      const section = document.getElementById(target.id);
      if (!section) return;
      ScrollTrigger.create({
        trigger: section,
        start: 'top 54%',
        end: 'bottom 46%',
        onEnter: () => moveTo(target),
        onEnterBack: () => moveTo(target, 1.25),
      });
    });

    const footer = document.getElementById('site-footer');
    if (footer) {
      ScrollTrigger.create({
        trigger: footer,
        start: 'top 62%',
        onEnter: () => {
          const apex = pyramidTarget();
          moveTo({ ...apex, scale: window.innerWidth < 860 ? 0.62 : 0.52, rotate: 0, body: 'moon' }, 2.6);
        },
        onLeaveBack: () => moveTo(path[path.length - 1], 1.2),
      });
    }

    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      gsap.killTweensOf(globeEl);
    };
  }, []);

  const activeGlobe = body === 'moon' && moonGlobe ? moonGlobe : globe;

  return (
    <ReactLenis root>
      <style>{`
        .sg-wrap{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;pointer-events:none;overflow:visible}
        .sg-holder{width:min(54vw,720px);height:min(54vw,720px);will-change:transform}
        .sg-globe{position:relative;width:100%;height:100%;border-radius:9999px;overflow:hidden;box-shadow:0 0 34px rgba(80,165,255,.32),0 0 90px rgba(53,194,107,.12)}
        .sg-earth{background:radial-gradient(circle at 32% 25%,#78c8ff 0,#12639a 34%,#05182e 100%)}
        .sg-moon{background:radial-gradient(circle at 32% 25%,#f1ebdc 0,#bdb7aa 48%,#595756 100%);box-shadow:0 0 34px rgba(244,238,214,.28),0 0 90px rgba(244,238,214,.12)}
        .sg-shine{position:absolute;inset:0;border-radius:inherit;background:radial-gradient(circle at 28% 22%,rgba(255,255,255,.55),transparent 28%),linear-gradient(90deg,rgba(0,0,0,.38),transparent 42%,rgba(0,0,0,.3))}
        .sg-land{position:absolute;display:block;border-radius:50%;background:rgba(57,172,103,.75);filter:blur(.5px)}
        .sg-land-a{left:16%;top:22%;width:38%;height:24%}.sg-land-b{left:42%;top:43%;width:27%;height:34%}.sg-land-c{left:63%;top:25%;width:24%;height:18%}
        .sg-moon .sg-land{background:rgba(92,89,84,.28)}
        @media(max-width:860px){.sg-holder{width:min(78vw,430px);height:min(78vw,430px)}}
      `}</style>
      <div ref={containerRef} className="relative w-full">
        <div className="sg-wrap">
          <div ref={globeRef} className="sg-holder" aria-hidden="true">
            {activeGlobe || <PlaceholderGlobe body={body} />}
          </div>
        </div>
        {children}
      </div>
    </ReactLenis>
  );
}
