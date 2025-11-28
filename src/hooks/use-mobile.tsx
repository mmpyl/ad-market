import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Hook para detectar si el dispositivo es móvil
 * @returns boolean - true si el ancho de la ventana es menor a 768px
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // Crear media query
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Handler para cambios en el tamaño de ventana
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Agregar listener
    mql.addEventListener("change", onChange);
    
    // Setear valor inicial
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    // Cleanup
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Retornar false por defecto si undefined (SSR)
  return !!isMobile;
}
