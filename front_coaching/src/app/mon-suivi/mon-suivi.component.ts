import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { SeanceService } from '../services/seance.service';
import { AuthService } from '../services/auth.service';
import { Seance } from '../models/seance.model';
import { Observable, of, forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { map, catchError } from 'rxjs/operators';

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
  [id: string]: string;
}

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

  // Cache pour stocker les noms des exercices déjà récupérés
  exerciceCache: ExerciceCache = {};

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

  constructor(
    private seanceService: SeanceService,
    private authService: AuthService
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
      this.isLoading = false;
      setTimeout(() => this.initialiserGraphiques(), 300);
    } else {
      // Si pas d'utilisateur connecté, afficher un message
      this.sportif = null;
      this.isLoading = false;
    }
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
    if (
      !this.sportif ||
      !this.sportif.participations ||
      this.sportif.participations.length === 0
    ) {
      return; // Ne pas initialiser les graphiques s'il n'y a pas de données
    }

    if (
      this.typesExercicesChart &&
      this.activitesParMoisChart &&
      this.coachsChart
    ) {
      // Vérifier si nous avons des données pour chaque graphique
      if (this.stats.typesExercices.size > 0) {
        this.creerGraphiqueTypesExercices();
      }

      if (this.stats.statistiquesCoachs.size > 0) {
        this.creerGraphiqueCoachs();
      }

      if (this.stats.activitesParMois.size > 0) {
        this.creerGraphiqueActivitesParMois();
      }

      this.chartsInitialized = true;
    }
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
}
