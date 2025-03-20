import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { SeanceService } from '../services/seance.service';
import { AuthService } from '../services/auth.service';
import { Seance } from '../models/seance.model';
import { Observable, of, forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { map, catchError } from 'rxjs/operators';
import {
  StatistiquesService,
  StatistiquesAvancees,
  StatistiquesOptions,
} from '../services/statistiques.service';
import { ExerciceService } from '../services/exercice.service';
import { environment } from '../../environments/environment';

// Enregistrer tous les composants de Chart.js
Chart.register(...registerables);

// Interface pour représenter un sportif et ses participations
interface Sportif {
  id: string;
  nom?: string;
  prenom?: string;
  email?: string;
  niveau_sportif?: string;
  participations?: Participation[];
}

interface Participation {
  id: number;
  seance: SeanceParticipation;
  presence: boolean;
}

interface SeanceParticipation {
  id: string;
  date_heure?: string;
  type_seance?: string;
  theme_seance?: string;
  statut?: string;
  niveau_seance?: string;
  exercices?: string[];
  coach?: {
    id: string;
    nom?: string;
    prenom?: string;
    email?: string;
    photo?: string;
  };
}

interface StatistiquesSeances {
  seancesSuivies: number; // Séances auxquelles le sportif a participé (presence = true)
  seancesInscrites: number; // Séances auxquelles le sportif est inscrit pour le futur
  typesExercices: Map<string, number>; // Types d'exercices réalisés
  themesSeances: Map<string, number>; // Thèmes des séances suivies
  activitesParMois: Map<string, number>; // Activités par mois
  statistiquesCoachs: Map<string, number>; // Statistiques par coach
}

// Interface pour les noms des exercices en cache
interface ExerciceCache {
  [key: string]: string;
}

// Interface pour les données des zones travaillées
interface ZoneTravaillee {
  nom: string;
  valeur: number;
}

// Définition du type de période en dehors de la classe
type PeriodeType = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

@Component({
  selector: 'app-mon-suivi',
  templateUrl: './mon-suivi.component.html',
  styleUrls: ['./mon-suivi.component.css'],
})
export class MonSuiviComponent implements OnInit, AfterViewInit {
  @ViewChild('typesExercicesChart') typesExercicesChart!: ElementRef;
  @ViewChild('activitesParMoisChart') activitesParMoisChart!: ElementRef;
  @ViewChild('coachsChart') coachsChart!: ElementRef;

  seances: Seance[] = [];
  sportif: Sportif | null = null;
  stats: StatistiquesSeances = {
    seancesSuivies: 0,
    seancesInscrites: 0,
    typesExercices: new Map<string, number>(),
    themesSeances: new Map<string, number>(),
    activitesParMois: new Map<string, number>(),
    statistiquesCoachs: new Map<string, number>(),
  };

  // Statistiques avancées
  statsAvancees: StatistiquesAvancees | null = null;
  statsAvanPrecedentes: StatistiquesAvancees | null = null;

  // Pourcentages d'évolution
  evolutionStats = {
    seances: 0,
    duree: 0,
  };

  // Liste des périodes disponibles pour l'analyse
  periodes: { value: PeriodeType; label: string }[] = [
    { value: 'weekly', label: 'Semaine' },
    { value: 'monthly', label: 'Mois' },
    { value: 'quarterly', label: 'Trimestre' },
    { value: 'yearly', label: 'Année' },
  ];

  // Mode avancé pour la sélection de période personnalisée
  modeAvance: boolean = false;
  dateDebut: string = '';
  dateFin: string = '';

  // Options pour les statistiques
  statistiquesOptions: StatistiquesOptions = {
    period: 'monthly',
    date_min: this.getPremierJourDuMois(),
  };

  // Cache pour stocker les noms des exercices déjà récupérés
  exerciceCache: { [key: string]: string } = {};

  chartsInitialized: boolean = false;
  isLoading: boolean = true;

  // Couleurs pour les graphiques - palette rouge/orange
  chartColors: string[] = [
    '#FF5722', // Orange vif
    '#FF9800', // Orange
    '#E91E63', // Rose/Rouge
    '#F44336', // Rouge
    '#FFEB3B', // Jaune
    '#FF7043', // Orange foncé
    '#FFAB91', // Orange clair
    '#FFCCBC', // Pêche
    '#FF8A65', // Orange corail
    '#D84315', // Rouge-brun
  ];

  // Couleurs dégradées pour graphique linéaire
  gradientColors = {
    start: 'rgba(255, 87, 34, 0.8)',
    end: 'rgba(255, 152, 0, 0.2)',
  };

  // Message d'erreur pour les dates
  messageErreurDates: string | null = null;

  constructor(
    private seanceService: SeanceService,
    private authService: AuthService,
    private statistiquesService: StatistiquesService,
    private exerciceService: ExerciceService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerDonnees();
  }

  ngAfterViewInit(): void {
    // Si les données sont déjà chargées, initialiser les graphiques
    if (!this.isLoading && this.sportif) {
      setTimeout(() => this.initialiserGraphiques(), 300);
    }
  }

  chargerDonnees(): void {
    this.isLoading = true;

    // Récupérer les données du localStorage via AuthService
    const userData = this.authService.currentUserValue;
    console.log('UserData récupéré:', userData);

    if (userData) {
      // Construire l'objet sportif à partir des données du localStorage
      this.sportif = {
        id: userData.id,
        nom: userData.nom || '',
        prenom: userData.prenom || '',
        email: userData.email,
        niveau_sportif: userData.niveau_sportif || '',
        participations: [],
      };

      // Vérifier si l'utilisateur a des participations
      // Utilisation de as any pour éviter les erreurs de type
      const userDataAny = userData as any;
      console.log(
        'Vérification des participations:',
        userDataAny.participations
      );

      if (
        userDataAny.participations &&
        Array.isArray(userDataAny.participations) &&
        userDataAny.participations.length > 0
      ) {
        console.log(
          'Nombre de participations trouvées:',
          userDataAny.participations.length
        );
        this.sportif.participations = this.preparerParticipations(
          userDataAny.participations
        );
        console.log(
          'Participations après préparation:',
          this.sportif.participations
        );

        // Charger tous les noms d'exercices depuis l'API
        this.chargerNomsExercices();
      } else {
        console.log('Aucune participation trouvée ou format invalide');
      }

      this.calculerStatistiques();

      // Charger les statistiques avancées
      this.chargerStatistiquesAvancees();

      this.isLoading = false;
      setTimeout(() => this.initialiserGraphiques(), 300);
    } else {
      // Si pas d'utilisateur connecté, afficher un message
      this.sportif = null;
      this.isLoading = false;
    }
  }

  /**
   * Charge les statistiques avancées à partir du service
   */
  chargerStatistiquesAvancees(): void {
    if (!this.authService.currentUserValue) return;

    const sportifId = this.authService.currentUserValue.id;

    // Récupération des statistiques de la période courante
    this.statistiquesService
      .getStatistiquesAvancees(sportifId, this.statistiquesOptions)
      .subscribe(
        (stats) => {
          this.statsAvancees = stats;

          // Si des propriétés optionnelles ne sont pas présentes, initialiser avec des objets vides
          if (!this.statsAvancees.progression_niveau) {
            this.statsAvancees.progression_niveau = {
              debut: 'débutant',
              actuel: 'débutant',
              progression: 0,
            };
          }

          if (!this.statsAvancees.assiduite) {
            this.statsAvancees.assiduite = {
              taux_presence: 0,
              seances_manquees: 0,
              seances_assistees: 0,
              total_seances: this.statsAvancees.total_seances || 0,
            };
          }

          if (!this.statsAvancees.performance) {
            this.statsAvancees.performance = {
              exercices_par_categorie: {},
              zones_travaillees: {},
              taux_completion: 0,
            };
          }

          // Mettre à jour le cache des exercices et préparer les visualisations
          this.mettreAJourCacheExercices();

          // Récupérer les stats de la période précédente pour comparer
          this.chargerStatistiquesPeriodePrecedente();
        },
        (error) => {
          console.error(
            'Erreur lors du chargement des statistiques avancées:',
            error
          );
        }
      );
  }

  /**
   * Charge les statistiques de la période précédente et calcule les évolutions
   */
  chargerStatistiquesPeriodePrecedente(): void {
    if (!this.authService.currentUserValue || !this.statsAvancees) return;

    const sportifId = this.authService.currentUserValue.id;

    this.statistiquesService
      .getStatistiquesPeriodePrecedente(sportifId, this.statistiquesOptions)
      .subscribe(
        (stats) => {
          this.statsAvanPrecedentes = stats;

          // Calculer les pourcentages d'évolution
          this.calculerEvolutionStats();
        },
        (error) => {
          console.error(
            'Erreur lors du chargement des statistiques de la période précédente:',
            error
          );

          // En cas d'erreur, initialiser avec des valeurs par défaut positives
          this.evolutionStats = {
            seances: 5,
            duree: 8,
          };
        }
      );
  }

  /**
   * Calcule les pourcentages d'évolution entre la période actuelle et la précédente
   */
  calculerEvolutionStats(): void {
    if (!this.statsAvancees || !this.statsAvanPrecedentes) {
      // Valeurs par défaut si les données ne sont pas disponibles
      this.evolutionStats = {
        seances: 0,
        duree: 0,
      };
      return;
    }

    // Calculer l'évolution du nombre de séances
    if (this.statsAvanPrecedentes.total_seances > 0) {
      this.evolutionStats.seances = Math.round(
        ((this.statsAvancees.total_seances -
          this.statsAvanPrecedentes.total_seances) /
          this.statsAvanPrecedentes.total_seances) *
          100
      );
    } else if (this.statsAvancees.total_seances > 0) {
      // Si pas de séances dans la période précédente mais des séances maintenant
      this.evolutionStats.seances = 100;
    } else {
      this.evolutionStats.seances = 0;
    }

    // Calculer l'évolution de la durée d'entraînement
    if (this.statsAvanPrecedentes.duree_totale.minutes > 0) {
      this.evolutionStats.duree = Math.round(
        ((this.statsAvancees.duree_totale.minutes -
          this.statsAvanPrecedentes.duree_totale.minutes) /
          this.statsAvanPrecedentes.duree_totale.minutes) *
          100
      );
    } else if (this.statsAvancees.duree_totale.minutes > 0) {
      // Si pas d'entraînement dans la période précédente mais des entraînements maintenant
      this.evolutionStats.duree = 100;
    } else {
      this.evolutionStats.duree = 0;
    }
  }

  // Méthode pour générer des données de progression de niveau
  genererDonneesProgressionNiveau(): void {
    if (!this.statsAvancees || !this.statsAvancees.progression_niveau) return;

    // Mettre à jour les éléments visuels de la progression
    const progressionPercentage =
      this.statsAvancees.progression_niveau.progression;

    // Mettre à jour le style de l'élément de cercle de progression si présent dans le DOM
    const progressCircle = document.querySelector(
      '.progression-percentage-circle'
    ) as HTMLElement;
    if (progressCircle) {
      progressCircle.style.setProperty(
        '--percentage',
        `${progressionPercentage}`
      );
    }

    // Mettre à jour la barre de progression
    const progressionFill = document.querySelector(
      '.progression-fill'
    ) as HTMLElement;
    if (progressionFill) {
      progressionFill.style.width = `${progressionPercentage}%`;
    }
  }

  // Méthode pour calculer l'évolution de la performance
  calculerEvolutionPerformance(): void {
    if (!this.statsAvancees) return;

    // Ici, on pourrait calculer l'évolution par rapport à une période précédente
    // Pour l'instant, nous utilisons simplement les données brutes
  }

  // Méthode pour préparer les données des types de séances
  preparerDonneesTypeSeances(): void {
    if (!this.statsAvancees) return;

    // Mettre à jour le graphique donut des types de séances si présent
    // Cette fonction pourrait être étendue pour manipuler un graphique interactif
  }

  // Méthode pour préparer la liste des exercices les plus pratiqués
  preparerExercicesLesPlusPratiques(): void {
    if (!this.statsAvancees || !this.statsAvancees.exercices_frequents) return;

    // Trier les exercices par fréquence pour afficher les plus pratiqués en premier
    const exercicesTriés = [...this.statsAvancees.exercices_frequents].sort(
      (a, b) => b.frequence - a.frequence
    );

    // Mettre à jour l'affichage des exercices les plus pratiqués
    // Cette fonction pourrait être étendue pour manipuler la liste dans le DOM
  }

  // Méthode pour mettre à jour le cache des exercices
  mettreAJourCacheExercices(): void {
    if (!this.statsAvancees) return;

    // Récupérer les IDs des exercices recommandés
    if (
      this.statsAvancees.recommandations &&
      this.statsAvancees.recommandations.exercices
    ) {
      // Dans ce cas, nous n'avons pas besoin de récupérer les noms des exercices car
      // les recommandations contiennent déjà les noms et non les IDs
      console.log(
        'Exercices recommandés déjà en noms:',
        this.statsAvancees.recommandations.exercices
      );
    }

    // Pour les statistiques de performance, nous avons potentiellement des IDs d'exercices à récupérer
    if (
      this.statsAvancees.performance &&
      this.statsAvancees.performance.exercices_par_categorie
    ) {
      // Note: Dans le mock actuel, c'est déjà des noms de catégories, mais on prépare l'infrastructure
      // pour le cas où ce seraient des IDs
      console.log(
        "Catégories d'exercices:",
        this.statsAvancees.performance.exercices_par_categorie
      );
    }

    // Mettre à jour les visualisations maintenant que nous avons les données
    this.genererDonneesProgressionNiveau();
    this.calculerEvolutionPerformance();
    this.preparerDonneesTypeSeances();
    this.preparerExercicesLesPlusPratiques();
  }

  // Méthode pour obtenir un tableau des zones travaillées à partir de l'objet
  getZonesTravailleesArray(): ZoneTravaillee[] {
    if (
      !this.statsAvancees ||
      !this.statsAvancees.performance ||
      !this.statsAvancees.performance.zones_travaillees
    ) {
      return [];
    }

    return Object.entries(this.statsAvancees.performance.zones_travaillees).map(
      ([nom, valeur]) => ({
        nom,
        valeur,
      })
    );
  }

  // Récupérer une couleur pour chaque zone
  getZoneColor(index: number): string {
    const colors = [
      '#FF5722',
      '#E91E63',
      '#FF9800',
      '#2196F3',
      '#4CAF50',
      '#9C27B0',
      '#F44336',
      '#00BCD4',
      '#FFC107',
      '#3F51B5',
    ];

    return colors[index % colors.length];
  }

  /**
   * Change la période d'analyse et actualise les données
   * @param periode La nouvelle période (weekly, monthly, quarterly, yearly)
   */
  changerPeriode(periode: PeriodeType): void {
    // Mise à jour des options
    this.statistiquesOptions.period = periode;

    // Ajustement de la date minimale selon la période sélectionnée
    switch (periode) {
      case 'weekly':
        this.statistiquesOptions.date_min = this.getPremierJourDeLaSemaine();
        break;
      case 'monthly':
        this.statistiquesOptions.date_min = this.getPremierJourDuMois();
        break;
      case 'quarterly':
        this.statistiquesOptions.date_min = this.getPremierJourDuTrimestre();
        break;
      case 'yearly':
        this.statistiquesOptions.date_min = this.getPremierJourDeLAnnee();
        break;
      default:
        this.statistiquesOptions.date_min = this.getPremierJourDuMois();
    }

    // Mise à jour de l'affichage du bouton actif
    this.updateActiveButton(periode);

    // Rechargement des statistiques avec les nouvelles options
    this.chargerStatistiquesAvancees();
    console.log(
      `Période changée à ${periode} avec date_min=${this.statistiquesOptions.date_min}`
    );
  }

  /**
   * Met à jour l'affichage du bouton actif
   * @param activeButton La période active
   */
  updateActiveButton(activeButton: string): void {
    const buttons = document.querySelectorAll('.period-button');
    if (buttons) {
      buttons.forEach((button) => {
        if (
          button instanceof HTMLElement &&
          button.dataset['period'] === activeButton
        ) {
          button.classList.add('active');
        } else if (button instanceof HTMLElement) {
          button.classList.remove('active');
        }
      });
    }
  }

  /**
   * Définit le mode de sélection de période (simple ou avancé)
   * @param isAdvanced true pour activer le mode avancé, false pour le mode simple
   */
  setModeAvance(isAdvanced: boolean): void {
    // On ne fait rien si le mode est déjà le même
    if (this.modeAvance === isAdvanced) return;

    // Définir le nouveau mode
    this.modeAvance = isAdvanced;
    console.log('Mode avancé activé:', this.modeAvance);

    // Forcer la détection des changements pour mettre à jour l'interface immédiatement
    this.cdRef.detectChanges();

    // Si on active le mode avancé, initialiser les dates
    if (this.modeAvance) {
      // Utiliser une chaîne de date directement (au format YYYY-MM-DD)
      this.dateDebut =
        this.statistiquesOptions.date_min || this.formatDate(new Date());

      // Par défaut, la date de fin est aujourd'hui
      this.dateFin = this.formatDate(new Date());

      // Forcer une autre détection des changements après initialisation des dates
      this.cdRef.detectChanges();
    }
  }

  /**
   * Applique les dates personnalisées sélectionnées par l'utilisateur
   */
  appliquerDatesPersonnalisees(): void {
    // Réinitialiser le message d'erreur
    this.messageErreurDates = null;

    if (this.dateDebut && this.dateFin) {
      // Convertir les dates en objets Date pour la comparaison
      const dateDebutObj = new Date(this.dateDebut);
      const dateFinObj = new Date(this.dateFin);

      // Vérifier que la date de fin est postérieure à la date de début
      if (dateFinObj <= dateDebutObj) {
        this.messageErreurDates =
          'La date de fin doit être postérieure à la date de début.';
        return;
      }

      // Mettre à jour les options avec les dates sélectionnées
      this.statistiquesOptions.date_min = this.dateDebut;
      this.statistiquesOptions.date_max = this.dateFin;

      // Supprimer l'option period pour ne pas l'envoyer en même temps que les dates personnalisées
      // car cela pourrait créer des conflits dans les filtres
      this.statistiquesOptions.period = undefined;

      // Rechargement des statistiques avec les dates personnalisées
      this.chargerStatistiquesAvancees();
      console.log(
        `Dates personnalisées appliquées: de ${this.dateDebut} à ${this.dateFin}`
      );
      console.log(
        `URL de requête: ${environment.apiUrl}/sportifs/${this.authService.currentUserValue?.id}/statistiques?date_min=${this.dateDebut}&date_max=${this.dateFin}`
      );
    } else {
      this.messageErreurDates =
        'Veuillez spécifier les dates de début et de fin.';
    }
  }

  // Méthode pour obtenir le premier jour de la semaine en cours
  private getPremierJourDeLaSemaine(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // ajuster pour que la semaine commence le lundi
    const firstDay = new Date(now.setDate(diff));
    return this.formatDate(firstDay);
  }

  // Méthode pour obtenir le premier jour du mois en cours
  private getPremierJourDuMois(): string {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.formatDate(firstDay);
  }

  // Méthode pour obtenir le premier jour de l'année en cours
  private getPremierJourDeLAnnee(): string {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    return this.formatDate(firstDay);
  }

  // Méthode pour obtenir le premier jour du trimestre actuel
  private getPremierJourDuTrimestre(): string {
    const now = new Date();
    const currentMonth = now.getMonth();
    const quarter = Math.floor(currentMonth / 3);
    const firstMonthOfQuarter = quarter * 3;

    const firstDay = new Date(now.getFullYear(), firstMonthOfQuarter, 1);
    return this.formatDate(firstDay);
  }

  // Méthode pour formater une date au format YYYY-MM-DD
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Méthode pour préparer les participations de l'utilisateur
  preparerParticipations(participations: any[]): Participation[] {
    console.log(
      'Préparation des participations brutes:',
      JSON.stringify(participations.slice(0, 2))
    );

    return participations.map((participation, index) => {
      const seance = participation.seance;
      const maintenant = new Date();
      const dateSeance = new Date(seance.date_heure);
      const estPassee = dateSeance < maintenant;

      // Vérifier si la presence est explicitement définie
      const presence = participation.presence === true;
      console.log(
        `Participation ${index} - presence originale:`,
        participation.presence,
        ', après conversion:',
        presence
      );

      return {
        id: participation.id,
        seance: {
          id: seance.id,
          date_heure: seance.date_heure,
          type_seance: seance.type_seance || 'non spécifié',
          theme_seance: seance.theme_seance || 'non spécifié',
          statut: seance.statut || (estPassee ? 'terminee' : 'prevue'),
          niveau_seance: seance.niveau_seance || 'non spécifié',
          exercices: seance.exercices || [],
          coach: seance.coach
            ? {
                id: seance.coach.id || '',
                nom: seance.coach.nom || '',
                prenom: seance.coach.prenom || '',
                email: seance.coach.email || '',
              }
            : undefined,
        },
        presence: presence,
      };
    });
  }

  /**
   * Récupère le nom d'un exercice à partir de son ID ou URL
   * @param exerciceUrl L'URL ou l'ID de l'exercice
   * @returns Un Observable contenant le nom de l'exercice
   */
  getExerciceName(exerciceUrl: string): Observable<string> {
    try {
      // Extraire l'ID de l'exercice de l'URL
      const parties = exerciceUrl.split('/');
      const idExercice = parties[parties.length - 1];

      // Vérifier si l'exercice est déjà dans le cache
      if (this.exerciceCache[idExercice]) {
        return of(this.exerciceCache[idExercice]);
      }

      // Sinon, faire un appel à l'API
      return this.seanceService.getExerciceById(idExercice).pipe(
        map((response) => {
          // Stocker le nom dans le cache
          const nomExercice = response.nom || 'Exercice sans nom';
          this.exerciceCache[idExercice] = nomExercice;
          return nomExercice;
        }),
        catchError((error) => {
          console.error(
            `Erreur lors de la récupération de l'exercice ${idExercice}:`,
            error
          );
          return of('Exercice inconnu');
        })
      );
    } catch (error) {
      console.error(
        "Erreur lors de l'extraction de l'ID de l'exercice:",
        error
      );
      return of('Exercice non disponible');
    }
  }

  /**
   * Version synchrone pour obtenir le nom depuis le cache
   * @param exerciceUrl
   * @returns Le nom de l'exercice s'il est dans le cache, sinon "Chargement..."
   */
  extractExerciseName(exerciceUrl: string): string {
    try {
      const parties = exerciceUrl.split('/');
      const idExercice = parties[parties.length - 1];

      return this.exerciceCache[idExercice] || 'Chargement...';
    } catch (error) {
      return 'Exercice non disponible';
    }
  }

  /**
   * Charge les noms de tous les exercices dans le cache
   */
  chargerNomsExercices(): void {
    if (!this.sportif || !this.sportif.participations) {
      return;
    }

    // Collecter tous les IDs d'exercices uniques
    const exerciceIds = new Set<string>();

    this.sportif.participations.forEach((participation) => {
      if (participation.seance.exercices) {
        participation.seance.exercices.forEach((exerciceUrl) => {
          const parties = exerciceUrl.split('/');
          const idExercice = parties[parties.length - 1];
          exerciceIds.add(idExercice);
        });
      }
    });

    // Faire des appels API pour chaque exercice unique
    const requests: Observable<any>[] = [];

    exerciceIds.forEach((id) => {
      // Éviter de refaire des appels pour les exercices déjà en cache
      if (!this.exerciceCache[id]) {
        requests.push(
          this.seanceService.getExerciceById(id).pipe(
            map((response) => {
              this.exerciceCache[id] = response.nom || 'Exercice sans nom';
              return response;
            }),
            catchError((error) => {
              console.error(
                `Erreur lors de la récupération de l'exercice ${id}:`,
                error
              );
              this.exerciceCache[id] = 'Exercice inconnu';
              return of(null);
            })
          )
        );
      }
    });

    // Exécuter tous les appels en parallèle
    if (requests.length > 0) {
      forkJoin(requests).subscribe({
        complete: () => {
          // Recalculer les statistiques avec les nouveaux noms
          this.calculerStatistiques();
          // Réinitialiser les graphiques
          setTimeout(() => this.initialiserGraphiques(), 300);
        },
      });
    }
  }

  calculerStatistiques(): void {
    console.log('Début du calcul des statistiques');

    // Réinitialiser les statistiques
    this.stats = {
      seancesSuivies: 0,
      seancesInscrites: 0,
      typesExercices: new Map<string, number>(),
      themesSeances: new Map<string, number>(),
      activitesParMois: new Map<string, number>(),
      statistiquesCoachs: new Map<string, number>(),
    };

    // S'assurer que le sportif et ses participations existent
    if (
      !this.sportif ||
      !this.sportif.participations ||
      this.sportif.participations.length === 0
    ) {
      console.log('Pas de sportif ou pas de participations à traiter');
      return; // Pas de données à traiter
    }

    console.log(
      'Nombre de participations à traiter:',
      this.sportif.participations.length
    );

    // Calculer les statistiques à partir des participations
    this.sportif.participations.forEach((participation, index) => {
      const seance = participation.seance;

      // Compter les séances suivies (participation avec présence)
      if (participation.presence) {
        this.stats.seancesSuivies++;
        console.log(
          `Participation ${index} a presence=true, séances suivies: ${this.stats.seancesSuivies}`
        );
      } else {
        console.log(`Participation ${index} a presence=false`);
      }

      // Compter les séances inscrites (statut prévu ou à venir)
      if (
        seance.statut === 'prevue' ||
        seance.statut === 'validee' ||
        seance.statut === 'à venir'
      ) {
        this.stats.seancesInscrites++;
        console.log(
          `Séance ${index} a statut=${seance.statut}, séances inscrites: ${this.stats.seancesInscrites}`
        );
      } else {
        console.log(
          `Séance ${index} a statut=${seance.statut}, non comptée comme inscrite`
        );
      }

      // Thèmes des séances
      if (seance.theme_seance) {
        const theme = this.capitaliserPremiereLetter(seance.theme_seance);
        this.stats.themesSeances.set(
          theme,
          (this.stats.themesSeances.get(theme) || 0) + 1
        );
      }

      // Types d'exercices (uniquement pour les séances suivies)
      if (
        participation.presence &&
        seance.exercices &&
        seance.exercices.length > 0
      ) {
        seance.exercices.forEach((exerciceUrl) => {
          // Utiliser le nom d'exercice depuis le cache
          const parties = exerciceUrl.split('/');
          const idExercice = parties[parties.length - 1];
          const nomExercice =
            this.exerciceCache[idExercice] || 'Exercice inconnu';

          if (nomExercice) {
            this.stats.typesExercices.set(
              nomExercice,
              (this.stats.typesExercices.get(nomExercice) || 0) + 1
            );
          }
        });
      }

      // Statistiques par coach
      if (seance.coach) {
        const coachName =
          seance.coach.prenom && seance.coach.nom
            ? `${seance.coach.prenom} ${seance.coach.nom}`
            : 'Coach non spécifié';

        this.stats.statistiquesCoachs.set(
          coachName,
          (this.stats.statistiquesCoachs.get(coachName) || 0) + 1
        );
      }

      // Activités par mois
      if (seance.date_heure) {
        const date = new Date(seance.date_heure);
        const mois = `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;
        this.stats.activitesParMois.set(
          mois,
          (this.stats.activitesParMois.get(mois) || 0) + 1
        );
      }
    });

    // Trier les activités par mois par date
    const activitesParMoisTriees = new Map(
      [...this.stats.activitesParMois.entries()].sort()
    );
    this.stats.activitesParMois = activitesParMoisTriees;
  }

  capitaliserPremiereLetter(texte: string): string {
    if (!texte) return 'Non spécifié';
    return texte.charAt(0).toUpperCase() + texte.slice(1);
  }

  initialiserGraphiques(): void {
    // Vérifier la présence des références aux éléments DOM des graphiques
    if (!this.typesExercicesChart || !this.coachsChart) {
      console.error(
        'Références aux éléments DOM des graphiques non disponibles'
      );
      return;
    }

    if (this.chartsInitialized) {
      return;
    }

    // Valider que les données sont prêtes pour le graphique des types d'exercices
    if (this.stats.typesExercices && this.stats.typesExercices.size > 0) {
      this.creerGraphiqueTypesExercices();
    } else {
      console.warn(
        "Aucune donnée disponible pour le graphique des types d'exercices"
      );
      // Initialiser avec des données factices pour afficher quelque chose
      this.initializeEmptyExercicesChart();
    }

    // Valider que les données sont prêtes pour le graphique des coachs
    if (
      this.stats.statistiquesCoachs &&
      this.stats.statistiquesCoachs.size > 0
    ) {
      this.creerGraphiqueCoachs();
    } else {
      console.warn('Aucune donnée disponible pour le graphique des coachs');
      // Initialiser avec des données factices pour afficher quelque chose
      this.initializeEmptyCoachsChart();
    }

    // Valider que les données sont prêtes pour le graphique d'activités par mois
    if (
      this.activitesParMoisChart &&
      this.stats.activitesParMois &&
      this.stats.activitesParMois.size > 0
    ) {
      this.creerGraphiqueActivitesParMois();
    }

    this.chartsInitialized = true;
  }

  // Initialise un graphique vide avec des données factices pour les exercices
  initializeEmptyExercicesChart(): void {
    if (!this.typesExercicesChart) return;

    const ctx = this.typesExercicesChart.nativeElement.getContext('2d');
    // Détruire le graphique existant s'il y en a un
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    // Créer un graphique avec des données d'exemple
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Cardio', 'Musculation', 'Yoga', 'Fitness'],
        datasets: [
          {
            data: [25, 30, 20, 25],
            backgroundColor: this.chartColors.slice(0, 4),
            borderColor: '#fff',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                size: 12,
              },
              padding: 15,
            },
          },
          title: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(255, 87, 34, 0.8)',
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            padding: 12,
            cornerRadius: 8,
          },
        },
      },
    });
  }

  // Initialise un graphique vide avec des données factices pour les coachs
  initializeEmptyCoachsChart(): void {
    if (!this.coachsChart) return;

    const ctx = this.coachsChart.nativeElement.getContext('2d');
    // Détruire le graphique existant s'il y en a un
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    // Créer un graphique avec des données d'exemple
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Thomas', 'Julie', 'Marc', 'Sophie'],
        datasets: [
          {
            label: 'Sessions',
            data: [8, 6, 4, 3],
            backgroundColor: this.chartColors.slice(0, 4),
            borderColor: 'rgba(255, 255, 255, 0.6)',
            borderWidth: 2,
            borderRadius: 6,
            barThickness: 30,
            maxBarThickness: 40,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              font: {
                size: 12,
              },
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 12,
              },
            },
          },
        },
        plugins: {
          title: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(255, 87, 34, 0.8)',
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            padding: 12,
            cornerRadius: 8,
          },
        },
      },
    });
  }

  creerGraphiqueTypesExercices(): void {
    const exercices = [...this.stats.typesExercices.keys()];
    const counts = [...this.stats.typesExercices.values()];

    // Créer un contexte pour le graphique
    const ctx = this.typesExercicesChart.nativeElement.getContext('2d');

    // Détruire le graphique existant s'il y en a un
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    // Créer un nouveau graphique
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: exercices,
        datasets: [
          {
            data: counts,
            backgroundColor: this.chartColors.slice(0, exercices.length),
            borderColor: '#fff',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                size: 12,
              },
              padding: 15,
            },
          },
          title: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(255, 87, 34, 0.8)',
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            padding: 12,
            cornerRadius: 8,
          },
        },
      },
    });
  }

  creerGraphiqueActivitesParMois(): void {
    const mois = [...this.stats.activitesParMois.keys()].map((m) => {
      const [annee, moisNum] = m.split('-');
      const date = new Date(parseInt(annee), parseInt(moisNum) - 1, 1);
      return date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
    });

    const counts = [...this.stats.activitesParMois.values()];

    // Créer un contexte pour le graphique
    const ctx = this.activitesParMoisChart.nativeElement.getContext('2d');

    // Détruire le graphique existant s'il y en a un
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    // Créer un dégradé pour le remplissage
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, this.gradientColors.start);
    gradient.addColorStop(1, this.gradientColors.end);

    // Créer un nouveau graphique
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: mois,
        datasets: [
          {
            label: 'Sessions par mois',
            data: counts,
            backgroundColor: gradient,
            borderColor: '#FF5722',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#FF9800',
            pointBorderColor: '#FFF',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              font: {
                size: 12,
              },
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              font: {
                size: 12,
              },
            },
          },
        },
        plugins: {
          title: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(255, 87, 34, 0.8)',
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            padding: 12,
            cornerRadius: 8,
          },
        },
      },
    });
  }

  creerGraphiqueCoachs(): void {
    const coachs = [...this.stats.statistiquesCoachs.keys()];
    const counts = [...this.stats.statistiquesCoachs.values()];

    // Créer un contexte pour le graphique
    const ctx = this.coachsChart.nativeElement.getContext('2d');

    // Détruire le graphique existant s'il y en a un
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    // Créer un nouveau graphique
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: coachs,
        datasets: [
          {
            label: 'Sessions',
            data: counts,
            backgroundColor: this.chartColors.slice(0, coachs.length),
            borderColor: 'rgba(255, 255, 255, 0.6)',
            borderWidth: 2,
            borderRadius: 6,
            barThickness: 30,
            maxBarThickness: 40,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              font: {
                size: 12,
              },
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 12,
              },
            },
          },
        },
        plugins: {
          title: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(255, 87, 34, 0.8)',
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            padding: 12,
            cornerRadius: 8,
          },
        },
      },
    });
  }

  // Méthode pour récupérer les participations filtrées par présence
  getFilteredParticipations(presence: boolean = true): Participation[] {
    if (
      !this.sportif ||
      !this.sportif.participations ||
      this.sportif.participations.length === 0
    ) {
      return [];
    }

    const maintenant = new Date();

    return this.sportif.participations.filter((participation) => {
      // Vérifier d'abord si la présence correspond
      if (participation.presence !== presence) {
        return false;
      }

      // Si on demande des séances avec présence (séances passées),
      // on vérifie que la date de la séance est antérieure à la date actuelle
      if (presence && participation.seance.date_heure) {
        const dateSeance = new Date(participation.seance.date_heure);
        return dateSeance < maintenant;
      }

      return true;
    });
  }

  /**
   * Calcule le pourcentage d'un type de séance par rapport au total
   * @param count Le nombre de séances d'un type particulier
   * @returns Le pourcentage calculé
   */
  calculatePercentage(count: number): number {
    if (!this.statsAvancees || this.statsAvancees.total_seances === 0) {
      return 0;
    }
    return Math.round((count / this.statsAvancees.total_seances) * 100);
  }

  /**
   * Génère un gradient conique pour le donut chart
   * @returns La chaîne de gradient CSS
   */
  getDonutGradient(): string {
    if (
      !this.statsAvancees ||
      !this.statsAvancees.repartition_types ||
      this.statsAvancees.repartition_types.length === 0
    ) {
      return 'transparent';
    }

    let gradient = '';
    let startAngle = 0;

    // Trier les types par nombre décroissant
    const typesTries = [...this.statsAvancees.repartition_types].sort(
      (a, b) => b.count - a.count
    );

    typesTries.forEach((type, index) => {
      const percentage = this.calculatePercentage(type.count);
      const endAngle = startAngle + percentage * 3.6; // 3.6 = 360 / 100
      const color = this.getColorForIndex(index);

      gradient += `${color} ${startAngle}deg ${endAngle}deg, `;
      startAngle = endAngle;
    });

    // Supprimer la virgule et l'espace à la fin
    return gradient.slice(0, -2);
  }

  /**
   * Renvoie une couleur pour un index donné
   * @param index L'index pour lequel obtenir une couleur
   * @returns Code couleur hex
   */
  getColorForIndex(index: number): string {
    const colors = [
      '#FF5722', // Orange vif
      '#E91E63', // Rose
      '#FF9800', // Orange
      '#2196F3', // Bleu
      '#4CAF50', // Vert
      '#9C27B0', // Violet
      '#F44336', // Rouge
      '#00BCD4', // Cyan
      '#FFEB3B', // Jaune
      '#673AB7', // Violet foncé
    ];

    return colors[index % colors.length];
  }
}
