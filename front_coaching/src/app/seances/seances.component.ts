import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthService, UserRole } from '../services/auth.service';
import { Router } from '@angular/router';
import { SeanceService } from '../services/seance.service';
import { Seance } from '../models/seance.model';

// Interface pour les exercices
interface Exercice {
  nom: string;
  series: number;
  repetitions: string;
  repos: string;
  description?: string;
  image?: string;
  expanded?: boolean;
}

@Component({
  selector: 'app-seances',
  templateUrl: './seances.component.html',
  styleUrl: './seances.component.css',
  standalone: false
})
export class SeancesComponent implements OnInit {
  // Référence à la section de détails pour le défilement
  @ViewChild('seanceDetails') seanceDetailsElement: ElementRef | undefined;

  // Liste des séances
  seances: Seance[] = [];

  // Séance sélectionnée pour afficher les détails
  seanceSelectionnee: Seance | null = null;

  // Filtres
  filtreTypeActif: string = 'Tous';
  filtreNiveauActif: string = 'Tous';
  filtreFormatActif: string = 'Tous';

  // Séances filtrées à afficher
  seancesFiltrees: Seance[] = [];
  
  // Indicateur de chargement
  loading: boolean = true;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private seanceService: SeanceService
  ) {}

  ngOnInit(): void {
    // Charger les séances depuis le service
    this.seanceService.getAllSeances().subscribe({
      next: (seances) => {
        this.seances = seances;
        this.seancesFiltrees = [...this.seances];
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des séances:', error);
        this.loading = false;
      }
    });
  }

  // Méthode pour vérifier si l'utilisateur est un client connecté
  isClient(): boolean {
    return this.authService.hasRole(UserRole.CLIENT);
  }

  // Méthode pour sélectionner une séance et afficher ses détails
  selectionnerSeance(seance: Seance): void {
    // Si l'utilisateur n'est pas un client connecté, rediriger vers la page de connexion
    if (!this.isClient()) {
      this.router.navigate(['/connexion'], {
        queryParams: {
          returnUrl: '/seances',
          message: 'Connectez-vous pour accéder aux détails des séances',
        },
      });
      return;
    }

    // Si on clique sur la séance déjà sélectionnée, on la désélectionne
    if (this.seanceSelectionnee && this.seanceSelectionnee.id === seance.id) {
      this.seanceSelectionnee = null;
    } else {
      // Sinon, on sélectionne la nouvelle séance
      this.seanceSelectionnee = seance;

      // Attendre que le DOM soit mis à jour avant de faire défiler
      setTimeout(() => {
        this.scrollToDetails();
      }, 100);
    }
  }

  // Méthode pour faire défiler vers les détails de la séance
  private scrollToDetails(): void {
    if (this.seanceDetailsElement) {
      this.seanceDetailsElement.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  // Méthode pour filtrer par type d'entraînement
  filtrerParType(type: string): void {
    this.filtreTypeActif = type;
    this.appliquerFiltres();
  }

  // Méthode pour filtrer par niveau
  filtrerParNiveau(niveau: string): void {
    this.filtreNiveauActif = niveau;
    this.appliquerFiltres();
  }

  // Méthode pour filtrer par format
  filtrerParFormat(format: string): void {
    this.filtreFormatActif = format;
    this.appliquerFiltres();
  }

  // Méthode pour appliquer les filtres
  private appliquerFiltres(): void {
    // Réinitialiser la séance sélectionnée
    this.seanceSelectionnee = null;

    // Filtrer les séances selon les critères actifs
    this.seancesFiltrees = this.seances.filter((seance) => {
      // Vérifier le filtre de type (thème)
      const typeMatch =
        this.filtreTypeActif === 'Tous' || 
        (seance.theme && seance.theme.toLowerCase() === this.filtreTypeActif.toLowerCase()) ||
        (seance.themeSeance && seance.themeSeance.toLowerCase() === this.filtreTypeActif.toLowerCase()) ||
        (seance.theme_seance && seance.theme_seance.toLowerCase() === this.filtreTypeActif.toLowerCase());

      // Vérifier le filtre de niveau
      const niveauMatch =
        this.filtreNiveauActif === 'Tous' ||
        (seance.niveau && seance.niveau.toLowerCase() === this.filtreNiveauActif.toLowerCase()) ||
        (seance.niveauSeance && seance.niveauSeance.toLowerCase() === this.filtreNiveauActif.toLowerCase()) ||
        (seance.niveau_seance && seance.niveau_seance.toLowerCase() === this.filtreNiveauActif.toLowerCase());

      // Vérifier le filtre de format
      const formatMatch =
        this.filtreFormatActif === 'Tous' ||
        (seance.type && seance.type.toLowerCase() === this.filtreFormatActif.toLowerCase()) ||
        (seance.typeSeance && seance.typeSeance.toLowerCase() === this.filtreFormatActif.toLowerCase()) ||
        (seance.type_seance && seance.type_seance.toLowerCase() === this.filtreFormatActif.toLowerCase());

      // Retourner true si tous les filtres correspondent
      return typeMatch && niveauMatch && formatMatch;
    });

    // Afficher un message de débogage
    console.log('Filtres appliqués:', {
      type: this.filtreTypeActif,
      niveau: this.filtreNiveauActif,
      format: this.filtreFormatActif,
      résultats: this.seancesFiltrees.length
    });
  }
}
