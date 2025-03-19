import { HttpHandlerFn, HttpRequest } from '@angular/common/http';

export function jwtInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // Récupérer le token JWT du localStorage
  const token = localStorage.getItem('jwt_token');

  // Si le token existe et que la requête va vers notre API
  if (token && req.url.includes('127.0.0.1:8000/api')) {
    // Cloner la requête et y ajouter l'en-tête d'autorisation
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Passer la requête au prochain intercepteur ou au gestionnaire de requêtes
  return next(req);
}
