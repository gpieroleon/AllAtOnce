"use client";

import { ImgHTMLAttributes } from "react";

// Imagen de producto con patrón "cover absoluto": el degradado del
// contenedor queda debajo como fondo; si la imagen falla, se oculta
// y se ve el fondo + el icono fallback (si existe).
export function CoverImg(props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img
      {...props}
      onError={(e) => {
        e.currentTarget.style.visibility = "hidden";
        props.onError?.(e);
      }}
    />
  );
}
