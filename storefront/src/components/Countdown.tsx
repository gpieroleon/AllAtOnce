"use client";

import { useEffect, useState } from "react";

export function useCountdown() {
  const [cd, setCd] = useState({ h: "00", m: "00", s: "00" });

  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const s = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      setCd({ h: pad(Math.floor(s / 3600)), m: pad(Math.floor((s % 3600) / 60)), s: pad(s % 60) });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return cd;
}

export function CountdownBoxes({ big = false }: { big?: boolean }) {
  const cd = useCountdown();
  if (big) {
    return (
      <div className="flash-hero__timer" aria-label="Cuenta atrás de la oferta">
        <div className="fbox">
          <b>{cd.h}</b>
          <i>Horas</i>
        </div>
        <span className="fbox__sep">:</span>
        <div className="fbox">
          <b>{cd.m}</b>
          <i>Minutos</i>
        </div>
        <span className="fbox__sep">:</span>
        <div className="fbox">
          <b>{cd.s}</b>
          <i>Segundos</i>
        </div>
      </div>
    );
  }
  return (
    <div className="countdown-boxes" aria-label="Cuenta atrás de la oferta">
      <div className="cbox">
        <b>{cd.h}</b>
        <i>Horas</i>
      </div>
      <div className="cbox">
        <b>{cd.m}</b>
        <i>Min</i>
      </div>
      <div className="cbox">
        <b>{cd.s}</b>
        <i>Seg</i>
      </div>
    </div>
  );
}
