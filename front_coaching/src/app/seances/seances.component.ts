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

// Nouvelle interface pour les options de filtre de date
interface DateFilterOption {
  label: string;
  value: string;
  filterFn: (date: Date) => boolean;
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
  filtreDateActif: string = 'Tous'; // Nouveau filtre pour la date

  // Options de filtre de date
  optionsFilterDate: DateFilterOption[] = [
    { 
      label: 'Tous', 
      value: 'Tous', 
      filterFn: () => true 
    },
    { 
      label: 'Aujourd\'hui', 
      value: 'Aujourd\'hui', 
      filterFn: (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() && 
               date.getMonth() === today.getMonth() && 
               date.getFullYear() === today.getFullYear();
      } 
    },
    { 
      label: 'Cette semaine', 
      value: 'Cette semaine', 
      filterFn: (date: Date) => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Lundi de la semaine courante
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche de la semaine courante
        endOfWeek.setHours(23, 59, 59, 999);
        
        return date >= startOfWeek && date <= endOfWeek;
      } 
    },
    { 
      label: 'Ce mois-ci', 
      value: 'Ce mois-ci', 
      filterFn: (date: Date) => {
        const today = new Date();
        return date.getMonth() === today.getMonth() && 
               date.getFullYear() === today.getFullYear();
      } 
    }
  ];

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

  // Méthode pour filtrer par date
  filtrerParDate(dateFilter: string): void {
    this.filtreDateActif = dateFilter;
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

      // Vérifier le filtre de date
      let dateMatch = true;
      if (this.filtreDateActif !== 'Tous' && seance.date) {
        const seanceDate = new Date(seance.date);
        const filterOption = this.optionsFilterDate.find(option => option.value === this.filtreDateActif);
        if (filterOption) {
          dateMatch = filterOption.filterFn(seanceDate);
        }
      }

      // Retourner true si tous les filtres correspondent
      return typeMatch && niveauMatch && formatMatch && coachMatch && dateMatch;
    });

    // Afficher un message de débogage
    console.log('Filtres appliqués:', {
      type: this.filtreTypeActif,
      niveau: this.filtreNiveauActif,
      format: this.filtreFormatActif,
      coach: this.filtreCoachActif,
      date: this.filtreDateActif,
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
  
  // Méthode pour vérifier si l'utilisateur peut réserver une séance
  peutReserver(seance: Seance): boolean {
    // Vérifier si l'utilisateur est connecté
    const user = this.authService.currentUserValue;
    if (!user || !user.id) {
      return false;
    }
    
    // Si l'utilisateur est déjà inscrit, pas besoin de vérifier les autres conditions
    if (this.estInscritASeance(seance)) {
      return true;
    }
    
    // Vérifier si la séance est complète
    if (this.estSeancePleine(seance)) {
      return false;
    }
    
    // Vérifier si le niveau de la séance correspond au niveau de l'utilisateur
    if (!this.niveauEstCompatible(seance, user)) {
      return false;
    }
    
    // Vérifier si l'utilisateur a déjà réservé 3 séances à venir
    if (this.nombreReservationsAtteint()) {
      return false;
    }
    
    return true;
  }
  
  // Vérifier si le niveau de la séance est compatible avec le niveau de l'utilisateur
  private niveauEstCompatible(seance: Seance, user: any): boolean {
    // Si la séance n'a pas de niveau spécifié ou est marquée "tous niveaux", tous les utilisateurs peuvent la réserver
    const niveauSeance = seance.niveau || seance.niveauSeance || seance.niveau_seance;
    if (!niveauSeance || niveauSeance.toLowerCase() === 'tous niveaux') {
      return true;
    }
    
    // Si l'utilisateur n'a pas de niveau défini, on suppose qu'il est débutant
    const niveauUser = user.niveau || 'debutant';
    
    // Définir l'ordre des niveaux (du plus bas au plus élevé)
    const ordreNiveaux: Record<string, number> = {
      'debutant': 1,
      'intermediaire': 2,
      'avance': 3
    };
    
    // Un utilisateur ne peut pas réserver une séance d'un niveau supérieur au sien
    const niveauUserValue = ordreNiveaux[niveauUser.toLowerCase()] || 1;
    const niveauSeanceValue = ordreNiveaux[niveauSeance.toLowerCase()] || 3;
    
    return niveauUserValue >= niveauSeanceValue;
  }
  
  // Vérifier si l'utilisateur a déjà réservé 3 séances à venir
  private nombreReservationsAtteint(): boolean {
    const user = this.authService.currentUserValue;
    if (!user || !user.id) {
      return true; // Si pas d'utilisateur, on considère que la limite est atteinte
    }
    
    // Compter le nombre de séances à venir auxquelles l'utilisateur est inscrit
    const seancesReservees = this.seances.filter(seance => 
      seance.statut === 'à venir' && 
      seance.sportifs && 
      seance.sportifs.includes(user.id)
    );
    
    return seancesReservees.length >= 3;
  }
  
  // Vérifier si l'utilisateur peut annuler sa réservation (plus de 24h avant la séance)
  peutAnnuler(seance: Seance): boolean {
    // Vérifier si l'utilisateur est inscrit à la séance
    if (!this.estInscritASeance(seance)) {
      return false;
    }
    
    // Vérifier si la séance est dans plus de 24h
    if (!seance.date) {
      return true; // Si pas de date, on autorise l'annulation
    }
    
    const dateSeance = new Date(seance.date);
    
    // Ajouter l'heure de début si disponible
    if (seance.heureDebut) {
      const [heures, minutes] = seance.heureDebut.split(':').map(Number);
      dateSeance.setHours(heures || 0, minutes || 0);
    }
    
    const maintenant = new Date();
    const differenceEnMs = dateSeance.getTime() - maintenant.getTime();
    const differenceEnHeures = differenceEnMs / (1000 * 60 * 60);
    
    return differenceEnHeures >= 24;
  }
  
  // Méthode pour obtenir un message explicatif si la réservation n'est pas possible
  getMessageReservation(seance: Seance): string {
    // Vérifier si l'utilisateur est connecté
    const user = this.authService.currentUserValue;
    if (!user || !user.id) {
      return 'Veuillez vous connecter pour réserver une séance';
    }
    
    // Si l'utilisateur est déjà inscrit
    if (this.estInscritASeance(seance)) {
      if (!this.peutAnnuler(seance)) {
        return 'Annulation impossible moins de 24h avant la séance';
      }
      return 'Annuler ma réservation';
    }
    
    // Si la séance est complète
    if (this.estSeancePleine(seance)) {
      return 'Cette séance est complète';
    }
    
    // Si le niveau de la séance ne correspond pas au niveau de l'utilisateur
    if (!this.niveauEstCompatible(seance, user)) {
      const niveauSeance = seance.niveau || seance.niveauSeance || seance.niveau_seance || 'tous niveaux';
      return `Niveau requis : ${niveauSeance}`;
    }
    
    // Si l'utilisateur a déjà réservé 3 séances à venir
    if (this.nombreReservationsAtteint()) {
      return 'Vous avez atteint la limite de 3 réservations';
    }
    
    return 'Réserver cette séance';
  }
  
  // Méthode modifiée pour réserver ou annuler une réservation
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
    
    // Si l'utilisateur est inscrit mais ne peut pas annuler (moins de 24h)
    if (this.estInscritASeance(seance) && !this.peutAnnuler(seance)) {
      this.messageNotification = 'Vous ne pouvez pas annuler une séance moins de 24h avant son début';
      this.typeNotification = 'error';
      this.afficherNotification = true;
      
      // Fermer la notification après 3 secondes
      setTimeout(() => {
        this.afficherNotification = false;
      }, 3000);
      
      return;
    }
    
    // Si l'utilisateur n'est pas inscrit et ne peut pas réserver
    if (!this.estInscritASeance(seance) && !this.peutReserver(seance)) {
      this.messageNotification = this.getMessageReservation(seance);
      this.typeNotification = 'error';
      this.afficherNotification = true;
      
      // Fermer la notification après 3 secondes
      setTimeout(() => {
        this.afficherNotification = false;
      }, 3000);
      
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
        // Ne pas désactiver l'indicateur de chargement avant que les données soient rechargées
        this.refreshSeancesWithLoadingState();
        
        // Fermer la notification après 3 secondes
        setTimeout(() => {
          this.afficherNotification = false;
        }, 3000);
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
        
        // Désactiver l'indicateur de chargement
        this.reservationEnCours = false;
      }
    });
  }
  
  // Méthode pour rafraîchir la liste des séances avec l'état de chargement maintenu
  private refreshSeancesWithLoadingState(): void {
    this.seanceService.getAllSeances().subscribe({
      next: (seances) => {
        // Conserver uniquement les séances avec statut "prevue"
        this.seances = seances.filter(seance => seance.statut === 'à venir');
        this.appliquerFiltres(); // Réappliquer les filtres
        
        // Désactiver l'indicateur de chargement après un court délai pour s'assurer
        // que l'interface est mise à jour correctement
        setTimeout(() => {
          this.reservationEnCours = false;
        }, 500);
      },
      error: (error) => {
        console.error('Erreur lors du rafraîchissement des séances:', error);
        // Désactiver l'indicateur de chargement
        this.reservationEnCours = false;
      }
    });
  }
  
  // Méthode originale pour rafraîchir la liste des séances (conservée par compatibilité)
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
