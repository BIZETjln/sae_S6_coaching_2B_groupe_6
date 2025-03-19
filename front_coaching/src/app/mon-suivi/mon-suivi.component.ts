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
import { Observable, of } from 'rxjs';
import { Chart, registerables } from 'chart.js';

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

    if (userData) {
      // Construire l'objet sportif à partir des données du localStorage
      this.sportif = {
        id: userData.id,
        nom: userData.nom || 'Nom par défaut',
        prenom: userData.prenom || 'Prénom par défaut',
        email: userData.email,
        niveau_sportif: userData.niveau_sportif || 'débutant',
        participations: [], // Sera rempli avec les séances de l'utilisateur
      };

      // Si l'utilisateur a des séances, les convertir en participations
      if (userData.seances && userData.seances.length > 0) {
        // Convertir les séances en participations
        this.sportif.participations = this.convertirSeancesEnParticipations(
          userData.seances
        );
      } else {
        // Si pas de séances, utiliser des données fictives pour la démonstration
        this.sportif = this.creerSportifFictif();
      }

      this.calculerStatistiques();
      this.isLoading = false;
      setTimeout(() => this.initialiserGraphiques(), 300);
    } else {
      // Si pas d'utilisateur connecté, utiliser des données fictives
      this.sportif = this.creerSportifFictif();
      this.calculerStatistiques();
      this.isLoading = false;
      setTimeout(() => this.initialiserGraphiques(), 300);
    }
  }

  // Convertir les séances du format stocké dans userData en participations pour l'affichage
  convertirSeancesEnParticipations(seances: any[]): Participation[] {
    return seances.map((seance, index) => {
      const maintenant = new Date();
      const dateSeance = new Date(seance.date_heure || seance.dateHeure);
      const estPassee = dateSeance < maintenant;

      // Convertir le format des exercices si nécessaire
      let exercices = seance.exercices || [];
      // Si les exercices ne sont pas dans le format d'URL attendu, les convertir
      if (exercices.length > 0 && typeof exercices[0] !== 'string') {
        exercices = exercices.map(
          (ex: any) =>
            `https://example.com/exercices/${
              ex.nom ? ex.nom.toLowerCase() : 'exercice'
            }`
        );
      }

      return {
        id: index,
        seance: {
          id: seance.id,
          date_heure: seance.date_heure || seance.dateHeure,
          type_seance: seance.type_seance || seance.typeSeance || 'solo',
          theme_seance: seance.theme_seance || seance.themeSeance || 'fitness',
          statut: estPassee ? 'terminee' : 'prevue',
          niveau_seance:
            seance.niveau_seance || seance.niveauSeance || 'debutant',
          exercices: exercices,
          coach: seance.coach || {
            id: 'coach-default',
            nom: 'Nom Coach',
            prenom: 'Prénom Coach',
          },
        },
        presence: estPassee, // On considère que l'utilisateur a participé aux séances passées
      };
    });
  }

  creerSportifFictif(): Sportif {
    // Types d'exercices possibles
    const themes = ['Fitness', 'Musculation', 'Cardio', 'Yoga', 'CrossFit'];
    const coachs = [
      { id: 'coach-1', nom: 'Martin', prenom: 'Sophie' },
      { id: 'coach-2', nom: 'Durand', prenom: 'Thomas' },
      { id: 'coach-3', nom: 'Coach', prenom: 'Marie' },
    ];
    const exercices = [
      'Burpees',
      'Squats',
      'Pompes',
      'Abdominaux',
      'Course',
      'Tractions',
      'Gainage',
      'Fentes',
      'Jumping Jacks',
      'Mountain Climbers',
    ];

    const participations: Participation[] = [];

    // Créer des participations fictives
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7); // Répartir sur les dernières semaines

      const theme = themes[Math.floor(Math.random() * themes.length)];
      const coach = coachs[Math.floor(Math.random() * coachs.length)];

      // Ajouter des exercices aléatoires
      const seanceExercices = [];
      const numExercices = Math.floor(Math.random() * 4) + 1; // 1 à 4 exercices
      for (let j = 0; j < numExercices; j++) {
        const exercice =
          exercices[Math.floor(Math.random() * exercices.length)];
        seanceExercices.push(
          `https://example.com/exercices/${exercice.toLowerCase()}`
        );
      }

      // Créer la séance
      const seance: SeanceParticipation = {
        id: `seance-${i}`,
        date_heure: date.toISOString(),
        type_seance: i % 3 === 0 ? 'solo' : i % 3 === 1 ? 'duo' : 'groupe',
        theme_seance: theme.toLowerCase(),
        niveau_seance: i % 2 === 0 ? 'debutant' : 'intermediaire',
        statut: i < 5 ? 'terminee' : 'prevue',
        exercices: seanceExercices,
        coach: {
          id: coach.id,
          nom: coach.nom,
          prenom: coach.prenom,
        },
      };

      participations.push({
        id: i,
        seance: seance,
        presence: i < 5, // Les 5 premières sont des séances passées avec présence
      });
    }

    return {
      id: 'sportif-demo',
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@example.com',
      niveau_sportif: 'intermediaire',
      participations: participations,
    };
  }

  calculerStatistiques(): void {
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
      this.sportif = this.creerSportifFictif();
    }

    // Calculer les statistiques à partir des participations
    this.sportif.participations?.forEach((participation) => {
      const seance = participation.seance;

      // Compter les séances suivies (participation avec présence) et inscrites (à venir)
      if (participation.presence) {
        this.stats.seancesSuivies++;
      }

      if (
        seance.statut === 'prevue' ||
        seance.statut === 'validee' ||
        seance.statut === 'à venir'
      ) {
        this.stats.seancesInscrites++;
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
          // Extraire le nom de l'exercice de l'URL
          const exercice = this.extraireNomExercice(exerciceUrl);
          if (exercice) {
            this.stats.typesExercices.set(
              exercice,
              (this.stats.typesExercices.get(exercice) || 0) + 1
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

    // S'assurer d'avoir des données minimales pour l'affichage
    this.garantirDonneesMinimales();
  }

  extraireNomExercice(exerciceUrl: string): string {
    try {
      // Exemple: "https://example.com/exercices/burpees" -> "Burpees"
      const parties = exerciceUrl.split('/');
      const nom = parties[parties.length - 1];
      return this.capitaliserPremiereLetter(nom);
    } catch (error) {
      return 'Exercice non identifié';
    }
  }

  // Méthode pour extraire le nom de l'exercice pour l'affichage dans le template
  extractExerciseName(exerciceUrl: string): string {
    return this.extraireNomExercice(exerciceUrl);
  }

  capitaliserPremiereLetter(texte: string): string {
    if (!texte) return 'Non spécifié';
    return texte.charAt(0).toUpperCase() + texte.slice(1);
  }

  garantirDonneesMinimales(): void {
    // Si aucun exercice, en ajouter des fictifs
    if (this.stats.typesExercices.size === 0) {
      this.stats.typesExercices.set('Burpees', 3);
      this.stats.typesExercices.set('Squats', 5);
      this.stats.typesExercices.set('Pompes', 4);
      this.stats.typesExercices.set('Abdominaux', 2);
    }

    // Si aucun thème de séance, en ajouter des fictifs
    if (this.stats.themesSeances.size === 0) {
      this.stats.themesSeances.set('Fitness', 3);
      this.stats.themesSeances.set('Musculation', 2);
      this.stats.themesSeances.set('Cardio', 1);
    }

    // Si aucun coach, en ajouter un fictif
    if (this.stats.statistiquesCoachs.size === 0) {
      this.stats.statistiquesCoachs.set('Sophie Martin', 3);
      this.stats.statistiquesCoachs.set('Thomas Durand', 2);
      this.stats.statistiquesCoachs.set('Marie Coach', 1);
    }

    // Si aucune activité par mois, ajouter des mois fictifs
    if (this.stats.activitesParMois.size === 0) {
      const currentDate = new Date();
      for (let i = 2; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        const moisStr = `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;
        this.stats.activitesParMois.set(
          moisStr,
          Math.floor(Math.random() * 5) + 1
        );
      }
    }
  }

  initialiserGraphiques(): void {
    if (
      this.typesExercicesChart &&
      this.activitesParMoisChart &&
      this.coachsChart
    ) {
      this.creerGraphiqueTypesExercices();
      this.creerGraphiqueActivitesParMois();
      this.creerGraphiqueCoachs();
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
}
