import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthService, UserRole } from '../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
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

// Interface pour les coachs (pour le filtrage)
interface Coach {
  id: string | number;
  nom: string;
  prenom: string;
  name?: string;
  email?: string;
}

@Component({
  selector: 'app-seances',
  templateUrl: './seances.component.html',
  styleUrl: './seances.component.css',
  standalone: false,
})
export class SeancesComponent implements OnInit {
  // Référence à la section de détails pour le défilement
  @ViewChild('seanceDetails') seanceDetailsElement: ElementRef | undefined;

  // Liste des séances
  seances: Seance[] = [];

  // Liste des coachs pour le filtrage
  coachs: Coach[] = [];

  // Séance sélectionnée pour afficher les détails
  seanceSelectionnee: Seance | null = null;

  // Filtres
  filtreTypeActif: string = 'Tous';
  filtreNiveauActif: string = 'Tous';
  filtreFormatActif: string = 'Tous';
  filtreCoachActif: string = 'Tous';

  // Séances filtrées à afficher
  seancesFiltrees: Seance[] = [];

  // Indicateur de chargement
  loading: boolean = true;
  
  // Nouvel indicateur pour les réservations en cours
  reservationEnCours: boolean = false;
  
  // Message de notification
  messageNotification: string = '';
  typeNotification: 'success' | 'error' = 'success';
  afficherNotification: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private seanceService: SeanceService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Charger les séances depuis le service
    this.seanceService.getAllSeances().subscribe({
      next: (seances) => {
        // Filtrer uniquement les séances avec le statut "prevue"
        console.log('seances', seances);
        this.seances = seances.filter(seance => seance.statut === 'à venir');
        console.log('seances', this.seances);
        this.seancesFiltrees = [...this.seances];
        this.loading = false;

        // Log pour vérifier les détails des séances
        console.log('Séances récupérées (statut prevue uniquement):', this.seances);
        this.seances.forEach((seance, index) => {
          console.log(`Séance ${index + 1} - ID: ${seance.id}`, {
            titre: seance.titre,
            theme: seance.theme || seance.themeSeance || seance.theme_seance,
            niveau: seance.niveau || seance.niveauSeance || seance.niveau_seance,
            type: seance.type || seance.typeSeance || seance.type_seance,
            statut: seance.statut,
            image: seance.image,
            photo: seance.photo,
          });
        });

        // Extraire la liste unique des coachs à partir des séances
        this.extraireCoachs();

        // Vérifier s'il y a un paramètre coach dans l'URL
        this.route.queryParams.subscribe((params) => {
          const coachId = params['coach'];
          if (coachId) {
            // Attendre que la liste des coachs soit chargée
            setTimeout(() => {
              // Appliquer le filtre du coach
              this.filtrerParCoach(coachId);
              console.log(`Filtre appliqué pour le coach ID: ${coachId}`);
            }, 300);
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des séances:', error);
        this.loading = false;
      },
    });
  }

  // Méthode pour extraire la liste unique des coachs à partir des séances
  private extraireCoachs(): void {
    const coachsMap = new Map<string, Coach>();

    this.seances.forEach((seance) => {
      if (seance.coach) {
        const coach = seance.coach;
        // Créer un identifiant unique pour le coach
        const coachId = coach.id || `${coach.nom}_${coach.prenom}`;

        if (!coachsMap.has(String(coachId))) {
          coachsMap.set(String(coachId), {
            id: coach.id || coachId,
            nom: coach.nom || '',
            prenom: coach.prenom || '',
            name:
              coach.name || `${coach.prenom || ''} ${coach.nom || ''}`.trim(),
            email: coach.email,
          });
        }
      }
    });

    // Convertir la Map en tableau
    this.coachs = Array.from(coachsMap.values());
    console.log('Liste des coachs extraite:', this.coachs);
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

  // Méthode pour filtrer par coach
  filtrerParCoach(coachId: string): void {
    this.filtreCoachActif = coachId;
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
        (seance.theme &&
          seance.theme.toLowerCase() === this.filtreTypeActif.toLowerCase()) ||
        (seance.themeSeance &&
          seance.themeSeance.toLowerCase() ===
            this.filtreTypeActif.toLowerCase()) ||
        (seance.theme_seance &&
          seance.theme_seance.toLowerCase() ===
            this.filtreTypeActif.toLowerCase());

      // Vérifier le filtre de niveau
      const niveauMatch =
        this.filtreNiveauActif === 'Tous' ||
        (seance.niveau &&
          seance.niveau.toLowerCase() ===
            this.filtreNiveauActif.toLowerCase()) ||
        (seance.niveauSeance &&
          seance.niveauSeance.toLowerCase() ===
            this.filtreNiveauActif.toLowerCase()) ||
        (seance.niveau_seance &&
          seance.niveau_seance.toLowerCase() ===
            this.filtreNiveauActif.toLowerCase());

      // Vérifier le filtre de format
      const formatMatch =
        this.filtreFormatActif === 'Tous' ||
        (seance.type &&
          seance.type.toLowerCase() === this.filtreFormatActif.toLowerCase()) ||
        (seance.typeSeance &&
          seance.typeSeance.toLowerCase() ===
            this.filtreFormatActif.toLowerCase()) ||
        (seance.type_seance &&
          seance.type_seance.toLowerCase() ===
            this.filtreFormatActif.toLowerCase());

      // Vérifier le filtre de coach
      const coachMatch =
        this.filtreCoachActif === 'Tous' ||
        (seance.coach &&
          seance.coach.id &&
          seance.coach.id.toString() === this.filtreCoachActif) ||
        (seance.coach &&
          !seance.coach.id &&
          `${seance.coach.nom}_${seance.coach.prenom}` ===
            this.filtreCoachActif);

      // Retourner true si tous les filtres correspondent
      return typeMatch && niveauMatch && formatMatch && coachMatch;
    });

    // Afficher un message de débogage
    console.log('Filtres appliqués:', {
      type: this.filtreTypeActif,
      niveau: this.filtreNiveauActif,
      format: this.filtreFormatActif,
      coach: this.filtreCoachActif,
      résultats: this.seancesFiltrees.length,
    });
  }

  // Méthode pour obtenir le lien mailto vers l'email du coach
  getCoachEmailLink(): string {
    console.log('seanceSelectionnee', this.seanceSelectionnee?.coach?.email);
    if (
      !this.seanceSelectionnee ||
      !this.seanceSelectionnee.coach ||
      !this.seanceSelectionnee.coach.email
    ) {
      return '#';
    }
    return `mailto:${this.seanceSelectionnee.coach.email}`;
  }

  // Méthode pour vérifier si le coach a un email
  hasCoachEmail(): boolean {
    return !!this.seanceSelectionnee?.coach?.email;
  }

  // Méthode pour obtenir le nom complet du coach
  getCoachName(coach: Coach): string {
    if (coach.name) return coach.name;
    return `${coach.prenom || ''} ${coach.nom || ''}`.trim() || 'Coach';
  }

  // Méthode pour vérifier si l'utilisateur est inscrit à une séance
  estInscritASeance(seance: Seance): boolean {
    // Vérifier si l'utilisateur est connecté
    const user = this.authService.currentUserValue;
    if (!user || !user.id || !seance.sportifs) {
      return false;
    }
    
    // Vérifier si l'ID de l'utilisateur est dans la liste des sportifs de la séance
    return seance.sportifs.includes(user.id);
  }
  
  // Méthode pour vérifier si une séance est complète
  estSeancePleine(seance: Seance): boolean {
    // Si l'utilisateur est déjà inscrit, la séance n'est pas considérée comme pleine pour lui
    if (this.estInscritASeance(seance)) {
      return false;
    }
    
    // Vérifier la capacité et le nombre actuel de participants
    const nombreParticipants = seance.sportifs?.length || 0;
    const capaciteMax = seance.capaciteMax || this.getCapaciteMaxFromType(seance);
    
    return nombreParticipants >= capaciteMax;
  }
  
  // Méthode pour obtenir le message approprié concernant la capacité
  getCapaciteMessage(seance: Seance): string {
    if (!seance) return '';
    
    const nombreParticipants = seance.sportifs?.length || 0;
    const capaciteMax = seance.capaciteMax || this.getCapaciteMaxFromType(seance);
    
    return `${nombreParticipants}/${capaciteMax} places`;
  }
  
  // Méthode pour déterminer la capacité maximale en fonction du type
  getCapaciteMaxFromType(seance: Seance): number {
    const type = seance.type?.toLowerCase() || seance.typeSeance?.toLowerCase() || seance.type_seance?.toLowerCase() || '';
    
    switch (type) {
      case 'solo': return 1;
      case 'duo': return 2;
      case 'trio': return 3;
      default: return 1; // Par défaut
    }
  }
  
  // Méthode pour réserver ou annuler une réservation
  toggleReservation(seance: Seance, event?: Event): void {
    // Empêcher la propagation de l'événement pour ne pas déclencher l'affichage des détails
    if (event) {
      event.stopPropagation();
    }
    
    // Vérifier si l'utilisateur est connecté
    if (!this.isClient()) {
      this.router.navigate(['/connexion'], {
        queryParams: {
          returnUrl: '/seances',
          message: 'Connectez-vous pour réserver une séance'
        }
      });
      return;
    }
    
    // Indiquer que la réservation est en cours
    this.reservationEnCours = true;
    
    // Appeler le service pour réserver/annuler
    this.seanceService.toggleReservationSeance(seance.id).subscribe({
      next: (response) => {
        console.log('Réponse de réservation:', response);
        
        // Afficher un message de succès
        this.messageNotification = response.message;
        this.typeNotification = 'success';
        this.afficherNotification = true;
        
        // Mettre à jour la liste des séances pour refléter les changements
        this.refreshSeances();
        
        // Fermer la notification après 3 secondes
        setTimeout(() => {
          this.afficherNotification = false;
        }, 3000);
        
        this.reservationEnCours = false;
      },
      error: (error) => {
        console.error('Erreur lors de la réservation:', error);
        
        // Afficher un message d'erreur
        this.messageNotification = error.message || 'Une erreur est survenue lors de la réservation';
        this.typeNotification = 'error';
        this.afficherNotification = true;
        
        // Fermer la notification après 3 secondes
        setTimeout(() => {
          this.afficherNotification = false;
        }, 3000);
        
        this.reservationEnCours = false;
      }
    });
  }
  
  // Méthode pour rafraîchir la liste des séances
  private refreshSeances(): void {
    this.seanceService.getAllSeances().subscribe({
      next: (seances) => {
        // Conserver uniquement les séances avec statut "prevue"
        this.seances = seances.filter(seance => seance.statut === 'à venir');
        this.appliquerFiltres(); // Réappliquer les filtres
      },
      error: (error) => {
        console.error('Erreur lors du rafraîchissement des séances:', error);
      }
    });
  }
}
