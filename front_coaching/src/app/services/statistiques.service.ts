import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// Interface pour les statistiques avancées
export interface StatistiquesAvancees {
  periode?: {
    debut: string;
    fin: string;
  };
  total_seances: number;
  repartition_types: Array<{
    type: string;
    count: number;
  }>;
  top_exercices: Array<{
    id: string;
    nom: string;
    count: number;
  }>;
  exercices_frequents?: Array<{
    id: string;
    nom: string;
    frequence: number;
    progression: number;
  }>;
  duree_totale: {
    minutes: number;
    formatee: string;
  };
  progression_niveau?: {
    debut: string;
    actuel: string;
    progression: number;
  };
  assiduite?: {
    taux_presence: number;
    seances_manquees: number;
    seances_assistees: number;
    total_seances: number;
  };
  performance?: {
    exercices_par_categorie: { [categorie: string]: number };
    zones_travaillees: { [zone: string]: number };
    taux_completion: number;
  };
  recommandations?: {
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
  period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  date_min?: string;
  date_max?: string;
}

@Injectable({
  providedIn: 'root',
})
export class StatistiquesService {
  private apiUrl = environment.apiUrl || 'https://127.0.0.1:8000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Récupère les statistiques avancées pour un sportif spécifique
   * @param sportifId L'identifiant du sportif
   * @param options Options pour filtrer les statistiques (période, dates)
   * @returns Un Observable contenant les statistiques avancées
   */
  getStatistiquesAvancees(
    sportifId: string,
    options: StatistiquesOptions = {}
  ): Observable<StatistiquesAvancees> {
    const currentUser = this.authService.currentUserValue;

    if (!currentUser) {
      return throwError(() => new Error('Utilisateur non connecté'));
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

    // Récupérer le token d'authentification depuis l'utilisateur courant
    const token = currentUser.token || localStorage.getItem('jwt_token');

    if (!token) {
      return throwError(
        () => new Error("Erreur d'authentification: token non trouvé")
      );
    }

    // Configurer les headers avec le token d'authentification
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    // Faire la requête à l'API
    return this.http
      .get<StatistiquesAvancees>(
        `${this.apiUrl}/sportifs/${sportifId}/statistiques`,
        { params, headers }
      )
      .pipe(
        catchError((error) => {
          console.error(
            'Erreur lors de la récupération des statistiques avancées:',
            error
          );
          return throwError(
            () =>
              new Error(
                `Erreur lors de la récupération des statistiques: ${error.message}`
              )
          );
        })
      );
  }
}
