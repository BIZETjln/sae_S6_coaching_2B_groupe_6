import { Component, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'SportCoach';
  sidebarMini = false;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    // Initialiser le menu mobile
    this.initMobileMenu();
  }

  toggleSidebar(): void {
    this.sidebarMini = !this.sidebarMini;
    // Sauvegarder la préférence dans le localStorage
    localStorage.setItem('sidebarMini', this.sidebarMini.toString());
  }

  private initMobileMenu(): void {
    // Récupérer la préférence du mode sidebar depuis le localStorage
    const savedSidebarMode = localStorage.getItem('sidebarMini');
    if (savedSidebarMode) {
      this.sidebarMini = savedSidebarMode === 'true';
    }
    
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
