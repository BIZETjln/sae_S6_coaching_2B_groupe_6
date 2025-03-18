import { Component, OnInit, Renderer2 } from '@angular/core';
import { AuthService, User, UserRole } from './services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  title = 'SportCoach';
  sidebarMini = false;
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private renderer: Renderer2,
    private router: Router
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements d'utilisateur
    this.authService.currentUser.subscribe((user) => {
      console.log('Utilisateur connecté:', user);
      this.currentUser = user;
    });

    // Récupérer la préférence du mode sidebar depuis le localStorage
    const savedSidebarMode = localStorage.getItem('sidebarMini');
    if (savedSidebarMode) {
      this.sidebarMini = savedSidebarMode === 'true';
    }

    // Initialiser le menu mobile
    this.initMobileMenu();

    // S'abonner aux événements de fin de navigation pour défiler vers le haut
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        window.scrollTo(0, 0);
      });
  }

  toggleSidebar(): void {
    this.sidebarMini = !this.sidebarMini;
    // Sauvegarder la préférence dans le localStorage
    localStorage.setItem('sidebarMini', this.sidebarMini.toString());
  }

  // Méthodes de vérification de rôle
  isClient(): boolean {
    return this.authService.hasRole(UserRole.CLIENT);
  }

  isCoach(): boolean {
    return this.authService.hasRole(UserRole.COACH);
  }

  isAgent(): boolean {
    return this.authService.hasRole(UserRole.AGENT);
  }

  isResponsable(): boolean {
    return this.authService.hasRole(UserRole.RESPONSABLE);
  }

  isStaff(): boolean {
    return this.authService.hasAnyRole([
      UserRole.COACH,
      UserRole.AGENT,
      UserRole.RESPONSABLE,
    ]);
  }

  // Méthode de déconnexion
  logout(): void {
    this.authService.logout();
  }

  getAvatarUrl(): string {
    return this.authService.getUserAvatarUrl();
  }

  getUserDisplayName(): string {
    if (this.currentUser?.nom && this.currentUser?.prenom) {
      return `${this.currentUser.prenom} ${this.currentUser.nom}`;
    } else if (this.currentUser?.nom) {
      return this.currentUser.nom;
    } else if (this.currentUser?.name) {
      return this.currentUser.name;
    }
    return 'Utilisateur';
  }

  private initMobileMenu(): void {
    // Cette méthode sera appelée après le chargement du DOM
    setTimeout(() => {
      const navbarToggle = document.getElementById('navbar-toggle');
      const navbarMobile = document.getElementById('navbar-mobile');

      if (navbarToggle && navbarMobile) {
        this.renderer.listen(navbarToggle, 'click', () => {
          navbarToggle.classList.toggle('active');
          navbarMobile.classList.toggle('active');
        });

        // Fermer le menu quand on clique sur un lien
        const mobileLinks = navbarMobile.querySelectorAll('a');
        mobileLinks.forEach((link) => {
          this.renderer.listen(link, 'click', () => {
            navbarToggle.classList.remove('active');
            navbarMobile.classList.remove('active');
          });
        });

        // Fermer le menu quand on clique en dehors
        this.renderer.listen('document', 'click', (event: Event) => {
          const target = event.target as HTMLElement;
          if (
            navbarMobile.classList.contains('active') &&
            !navbarMobile.contains(target) &&
            !navbarToggle.contains(target)
          ) {
            navbarToggle.classList.remove('active');
            navbarMobile.classList.remove('active');
          }
        });
      }
    }, 0);
  }
}
