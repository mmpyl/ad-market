import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas que requieren autenticación
const protectedRoutes = [
  "/",
  "/dashboard",
  "/inventario",
  "/ventas",
  "/compras",
  "/clientes",
  "/productos",
  "/categorias",
];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  // Verifica si la ruta es protegida
  const requiresAuth = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Si NO hay token y la ruta es protegida → redirige al login
  if (!token && requiresAuth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname); // Para volver después del login
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|static|favicon.ico|.*\\.(css|js|svg|png|jpg|jpeg|gif)).*)",
  ],
};
