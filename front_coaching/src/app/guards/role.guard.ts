import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const currentUser = this.authService.currentUserValue;
    
    // Vérifier si l'utilisateur est connecté
    if (!currentUser) {
      this.router.navigate(['/connexion'], { queryParams: { returnUrl: state.url } });
      return false;
    }
    
    // Vérifier si la route a des rôles requis
    const requiredRoles = route.data['roles'] as UserRole[];
    
    if (requiredRoles && requiredRoles.length > 0) {
      // Vérifier si l'utilisateur a l'un des rôles requis
      if (!this.authService.hasAnyRole(requiredRoles)) {
        // Rediriger vers une page d'accès refusé ou la page d'accueil
        this.router.navigate(['/acces-refuse']);
        return false;
      }
    }
    
    return true;
  }
} 