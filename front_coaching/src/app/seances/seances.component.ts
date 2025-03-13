import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthService, UserRole } from '../services/auth.service';
import { Router } from '@angular/router';

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

// Interface pour les séances
interface Seance {
  id: number;
  titre: string;
  description: string;
  duree: string;
  niveau: 'Débutant' | 'Intermédiaire' | 'Avancé';
  type: 'Cardio' | 'Musculation' | 'HIIT' | 'Mixte';
  objectif:
    | 'Perte de poids'
    | 'Hypertrophie'
    | 'Endurance'
    | 'Force'
    | 'Tonification';
  groupesMusculaires: string[];
  nombreExercices: number;
  image: string;
  coach: string;
  exercices: Exercice[];
  selected?: boolean;
}

@Component({
  selector: 'app-seances',
  templateUrl: './seances.component.html',
  styleUrl: './seances.component.css',
})
export class SeancesComponent implements OnInit {
  // Référence à la section de détails pour le défilement
  @ViewChild('seanceDetails') seanceDetailsElement: ElementRef | undefined;

  // Liste des séances
  seances: Seance[] = [
    {
      id: 1,
      titre: 'Full Body Express',
      description:
        'Une séance complète qui cible tous les groupes musculaires principaux pour un entraînement efficace en un minimum de temps.',
      duree: '45 min',
      niveau: 'Intermédiaire',
      type: 'Musculation',
      objectif: 'Tonification',
      groupesMusculaires: ['Jambes', 'Dos', 'Poitrine', 'Épaules', 'Bras'],
      nombreExercices: 8,
      image: 'assets/images/seance-fullbody.jpg',
      coach: 'Thomas Martin',
      exercices: [
        {
          nom: 'Squats',
          series: 4,
          repetitions: '12-15',
          repos: '60s',
          description:
            'Tenez-vous debout, pieds écartés à la largeur des épaules. Descendez comme pour vous asseoir, en gardant le dos droit et les genoux alignés avec les orteils.',
        },
        {
          nom: 'Pompes',
          series: 3,
          repetitions: '10-12',
          repos: '60s',
          description:
            'En position de planche, descendez en pliant les coudes puis remontez en les tendant. Gardez le corps aligné tout au long du mouvement.',
        },
        {
          nom: 'Rowing haltère',
          series: 3,
          repetitions: '12 par bras',
          repos: '45s',
          description:
            "Penchez-vous en avant, un genou et une main en appui sur un banc. Tirez l'haltère vers votre hanche en serrant l'omoplate.",
        },
        {
          nom: 'Développé épaules',
          series: 3,
          repetitions: '10-12',
          repos: '60s',
          description:
            'Assis ou debout, poussez les haltères au-dessus de votre tête en gardant les coudes légèrement devant vous.',
        },
        {
          nom: 'Fentes avant',
          series: 3,
          repetitions: '10 par jambe',
          repos: '45s',
          description:
            "Faites un grand pas en avant et fléchissez les genoux pour descendre, puis remontez et alternez avec l'autre jambe.",
        },
        {
          nom: 'Curl biceps',
          series: 3,
          repetitions: '12',
          repos: '45s',
          description:
            'Debout, coudes près du corps, remontez les haltères en pliant les coudes sans bouger les épaules.',
        },
        {
          nom: 'Extensions triceps',
          series: 3,
          repetitions: '12',
          repos: '45s',
          description:
            "Debout ou assis, tenez un haltère à deux mains au-dessus de votre tête, puis pliez les coudes pour descendre l'haltère derrière votre tête.",
        },
        {
          nom: 'Planche',
          series: 3,
          repetitions: '30-45s',
          repos: '30s',
          description:
            'Maintenez une position de planche sur les avant-bras, corps aligné des épaules aux chevilles, en contractant les abdominaux.',
        },
      ],
    },
    {
      id: 2,
      titre: 'Cardio Brûle-Graisses',
      description:
        'Une séance intense combinant des exercices cardio et de résistance pour maximiser la dépense calorique et favoriser la perte de poids.',
      duree: '40 min',
      niveau: 'Intermédiaire',
      type: 'HIIT',
      objectif: 'Perte de poids',
      groupesMusculaires: ['Full Body', 'Cardio'],
      nombreExercices: 6,
      image: 'assets/images/seance-cardio.jpg',
      coach: 'Sophie Dubois',
      exercices: [
        {
          nom: 'Jumping Jacks',
          series: 4,
          repetitions: '45s',
          repos: '15s',
          description:
            'Debout, sautez en écartant les jambes et en levant les bras au-dessus de la tête, puis revenez à la position initiale.',
        },
        {
          nom: 'Mountain Climbers',
          series: 4,
          repetitions: '45s',
          repos: '15s',
          description:
            'En position de planche, ramenez alternativement les genoux vers la poitrine dans un mouvement rapide et continu.',
        },
        {
          nom: 'Burpees',
          series: 4,
          repetitions: '30s',
          repos: '30s',
          description:
            'Commencez debout, accroupissez-vous, placez les mains au sol, lancez les pieds en arrière en position de planche, faites une pompe, ramenez les pieds, sautez.',
        },
        {
          nom: 'Squat jumps',
          series: 4,
          repetitions: '40s',
          repos: '20s',
          description:
            'Réalisez un squat puis explosez vers le haut en sautant, atterrissez doucement et enchaînez avec le squat suivant.',
        },
        {
          nom: 'Planche latérale avec rotation',
          series: 3,
          repetitions: '30s par côté',
          repos: '15s',
          description:
            'En planche latérale, tournez votre torse en passant votre bras libre sous votre corps puis vers le plafond dans un mouvement continu.',
        },
        {
          nom: 'High knees',
          series: 4,
          repetitions: '40s',
          repos: '20s',
          description:
            "Courez sur place en montant les genoux à hauteur des hanches, en gardant un rythme rapide et en utilisant vos bras pour maintenir l'équilibre.",
        },
      ],
    },
    {
      id: 3,
      titre: 'Upper Body Focus',
      description:
        'Une séance ciblée sur le haut du corps pour développer la force et la masse musculaire des bras, des épaules, du dos et de la poitrine.',
      duree: '60 min',
      niveau: 'Avancé',
      type: 'Musculation',
      objectif: 'Hypertrophie',
      groupesMusculaires: ['Poitrine', 'Dos', 'Épaules', 'Bras'],
      nombreExercices: 7,
      image: 'assets/images/seance-upperbody.jpg',
      coach: 'Alexandre Dupont',
      exercices: [
        {
          nom: 'Développé couché haltères',
          series: 4,
          repetitions: '8-10',
          repos: '90s',
          description:
            'Allongé sur un banc, descendez les haltères au niveau de la poitrine puis poussez-les vers le haut en tendant les bras.',
        },
        {
          nom: 'Tractions',
          series: 4,
          repetitions: '6-8',
          repos: '90s',
          description:
            "Suspendez-vous à une barre, paumes vers l'avant, et tirez votre corps vers le haut jusqu'à ce que votre menton dépasse la barre.",
        },
        {
          nom: 'Développé militaire',
          series: 4,
          repetitions: '8-10',
          repos: '90s',
          description:
            'Assis, dos droit, poussez la barre ou les haltères au-dessus de votre tête en tendant complètement les bras.',
        },
        {
          nom: 'Rowing barre T',
          series: 4,
          repetitions: '10-12',
          repos: '75s',
          description:
            'Penché en avant, tirez la barre vers votre abdomen en serrant les omoplates et en gardant le dos droit.',
        },
        {
          nom: 'Dips',
          series: 3,
          repetitions: '8-12',
          repos: '75s',
          description:
            'Sur des barres parallèles, fléchissez les coudes pour descendre votre corps puis poussez pour remonter.',
        },
        {
          nom: 'Curl biceps barre EZ',
          series: 3,
          repetitions: '10-12',
          repos: '60s',
          description:
            'Debout, remontez la barre en pliant les coudes sans bouger les épaules, puis redescendez lentement.',
        },
        {
          nom: 'Extensions triceps poulie haute',
          series: 3,
          repetitions: '12-15',
          repos: '60s',
          description:
            'Face à la poulie haute, coudes près de la tête, étendez les avant-bras vers le bas en gardant les coudes fixes.',
        },
      ],
    },
    {
      id: 4,
      titre: 'Yoga Fitness Fusion',
      description:
        "Un mélange harmonieux de yoga et de fitness qui améliore la flexibilité, la force et l'équilibre tout en réduisant le stress.",
      duree: '50 min',
      niveau: 'Débutant',
      type: 'Mixte',
      objectif: 'Tonification',
      groupesMusculaires: ['Full Body', 'Core'],
      nombreExercices: 6,
      image: 'assets/images/seance-yoga.jpg',
      coach: 'Julie Moreau',
      exercices: [
        {
          nom: 'Salutation au soleil',
          series: 3,
          repetitions: '5 cycles',
          repos: '30s',
          description:
            "Enchaînement fluide de postures qui étirent et renforcent tout le corps, excellent pour s'échauffer.",
        },
        {
          nom: 'Posture du guerrier',
          series: 3,
          repetitions: '30s par côté',
          repos: '15s',
          description:
            'Jambes écartées, un pied tourné à 90°, pliez le genou avant tout en étendant les bras et en gardant le torse droit.',
        },
        {
          nom: 'Planche à chien tête en bas',
          series: 3,
          repetitions: '45s',
          repos: '30s',
          description:
            'Formez un V inversé avec votre corps, en poussant les talons vers le sol et les mains dans le tapis, tête relâchée.',
        },
        {
          nom: 'Posture de la chaise',
          series: 3,
          repetitions: '40s',
          repos: '20s',
          description:
            'Debout, pieds joints, pliez les genoux comme pour vous asseoir, en gardant le poids sur les talons et en levant les bras.',
        },
        {
          nom: 'Planche latérale',
          series: 3,
          repetitions: '30s par côté',
          repos: '15s',
          description:
            "En appui sur un avant-bras et le bord externe d'un pied, alignez votre corps et levez la hanche du sol.",
        },
        {
          nom: 'Posture du pont',
          series: 3,
          repetitions: '45s',
          repos: '30s',
          description:
            'Allongé sur le dos, pieds à plat près des fesses, soulevez les hanches en contractant les fessiers et en gardant les épaules au sol.',
        },
      ],
    },
  ];

  // Séance sélectionnée pour afficher les détails
  seanceSelectionnee: Seance | null = null;

  // Filtres
  filtreTypeActif: string = 'Tous';
  filtreNiveauActif: string = 'Tous';

  // Séances filtrées à afficher
  seancesFiltrees: Seance[] = [];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Initialiser les séances filtrées avec toutes les séances
    this.seancesFiltrees = [...this.seances];
  }

  // Méthode pour vérifier si l'utilisateur est un client connecté
  isClient(): boolean {
    return this.authService.hasRole(UserRole.CLIENT);
  }

  // Méthode pour sélectionner une séance et afficher ses détails
  selectionnerSeance(seance: Seance): void {
    // Désélectionner toutes les séances
    this.seances.forEach((s) => (s.selected = false));

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
      seance.selected = true;

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

  // Méthode pour appliquer les filtres
  private appliquerFiltres(): void {
    // Réinitialiser la séance sélectionnée
    this.seanceSelectionnee = null;

    // Filtrer les séances selon les critères actifs
    this.seancesFiltrees = this.seances.filter((seance) => {
      // Vérifier le filtre de type
      const typeMatch =
        this.filtreTypeActif === 'Tous' || seance.type === this.filtreTypeActif;

      // Vérifier le filtre de niveau
      const niveauMatch =
        this.filtreNiveauActif === 'Tous' ||
        seance.niveau === this.filtreNiveauActif;

      // Retourner true si les deux filtres correspondent
      return typeMatch && niveauMatch;
    });
  }
}
