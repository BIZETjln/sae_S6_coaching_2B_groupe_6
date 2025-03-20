import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// Interface pour les statistiques avancées
export interface StatistiquesAvancees {
  progression_niveau: {
    debut: string;
    actuel: string;
    progression: number; // Pourcentage de progression
  };
  assiduite: {
    taux_presence: number; // Pourcentage de présence
    seances_manquees: number;
    seances_assistees: number;
    total_seances: number;
  };
  performance: {
    exercices_par_categorie: { [categorie: string]: number };
    zones_travaillees: { [zone: string]: number };
    taux_completion: number; // Pourcentage des exercices complétés
  };
  recommandations: {
    exercices: string[];
    themes_suggeres: string[];
    coachs_compatibles: {
      id: string;
      nom: string;
      prenom: string;
      specialite: string;
    }[];
  };
}

// Interface pour les options de requête de statistiques
export interface StatistiquesOptions {
  period?: 'weekly' | 'monthly' | 'yearly'; // Période d'analyse
  date_min?: string; // Date minimale au format YYYY-MM-DD
  date_max?: string; // Date maximale au format YYYY-MM-DD
}

@Injectable({
  providedIn: 'root',
})
export class StatistiquesService {
  private apiUrl = environment.apiUrl || 'https://127.0.0.1:8000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Récupère les statistiques avancées pour le sportif connecté
   * @param options Options pour filtrer les statistiques (période, dates)
   * @returns Un Observable contenant les statistiques avancées
   */
  getStatistiquesAvancees(
    options: StatistiquesOptions = {}
  ): Observable<StatistiquesAvancees> {
    const userId = this.authService.currentUserValue?.id;

    if (!userId) {
      return of(this.genererStatistiquesMock());
    }

    // Définir les paramètres de la requête
    let params = new HttpParams();

    if (options.period) {
      params = params.set('period', options.period);
    } else {
      // Par défaut, utiliser la période mensuelle
      params = params.set('period', 'monthly');
    }

    if (options.date_min) {
      params = params.set('date_min', options.date_min);
    }

    if (options.date_max) {
      params = params.set('date_max', options.date_max);
    }

    // Tenter d'utiliser la vraie API avec gestion d'erreur
    try {
      return this.http
        .get<StatistiquesAvancees>(
          `${this.apiUrl}/sportifs/${userId}/statistiques`,
          { params }
        )
        .pipe(
          catchError((error) => {
            console.error(
              'Erreur lors de la récupération des statistiques avancées:',
              error
            );
            // En cas d'erreur, retourner les données mockées
            return of(this.genererStatistiquesMock());
          })
        );
    } catch (error) {
      console.error('Exception lors de la requête API:', error);
      return of(this.genererStatistiquesMock());
    }
  }

  /**
   * Génère des statistiques fictives pour la démonstration
   * @returns Un objet StatistiquesAvancees avec des données simulées
   */
  private genererStatistiquesMock(): StatistiquesAvancees {
    return {
      progression_niveau: {
        debut: 'débutant',
        actuel: 'intermédiaire',
        progression: 65, // Pourcentage de progression vers le niveau suivant
      },
      assiduite: {
        taux_presence: 85, // 85% de présence
        seances_manquees: 3,
        seances_assistees: 17,
        total_seances: 20,
      },
      performance: {
        exercices_par_categorie: {
          Cardio: 25,
          Musculation: 40,
          Yoga: 15,
          Étirements: 20,
        },
        zones_travaillees: {
          Bras: 30,
          Jambes: 25,
          Abdominaux: 20,
          Dos: 15,
          Épaules: 10,
        },
        taux_completion: 92, // 92% des exercices ont été complétés
      },
      recommandations: {
        exercices: [
          'Pompes inclinées',
          'Squats bulgares',
          'Planche latérale',
          'Extension lombaire',
        ],
        themes_suggeres: [
          'Renforcement musculaire',
          'Mobilité articulaire',
          'Endurance',
        ],
        coachs_compatibles: [
          {
            id: '1',
            nom: 'Dupont',
            prenom: 'Jean',
            specialite: 'Musculation',
          },
          {
            id: '3',
            nom: 'Martin',
            prenom: 'Sophie',
            specialite: 'Cardio',
          },
        ],
      },
    };
  }
}
