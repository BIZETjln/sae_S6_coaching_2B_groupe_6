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

    // Ajouter la période si définie (mode simple)
    if (options.period) {
      params = params.set('period', options.period);
    }

    // Ajouter date_min et date_max si définies (prioritaires en mode avancé)
    if (options.date_min) {
      params = params.set('date_min', options.date_min);
    }

    if (options.date_max) {
      params = params.set('date_max', options.date_max);
    }

    // Si aucun paramètre n'est défini, utiliser la période mensuelle par défaut
    if (!options.period && !options.date_min && !options.date_max) {
      params = params.set('period', 'monthly');
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

    // Construire l'URL complète
    const url = `${this.apiUrl}/sportifs/${sportifId}/statistiques`;

    // Logger l'URL complète pour le débogage
    console.log(`Requête GET: ${url} avec params:`, params.toString());

    // Faire la requête à l'API
    return this.http.get<StatistiquesAvancees>(url, { params, headers }).pipe(
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

  /**
   * Récupère les statistiques avancées pour un sportif pour la période précédente
   * @param sportifId L'identifiant du sportif
   * @param options Options pour filtrer les statistiques (période, dates)
   * @returns Un Observable contenant les statistiques avancées de la période précédente
   */
  getStatistiquesPeriodePrecedente(
    sportifId: string,
    options: StatistiquesOptions = {}
  ): Observable<StatistiquesAvancees> {
    const currentUser = this.authService.currentUserValue;

    if (!currentUser) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }

    // Calculer la période précédente en fonction de la période actuelle
    const periodeOptions = this.calculerPeriodePrecedente(options);

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
        { params: periodeOptions, headers }
      )
      .pipe(
        catchError((error) => {
          console.error(
            'Erreur lors de la récupération des statistiques de la période précédente:',
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

  /**
   * Calcule les paramètres pour la période précédente en fonction de la période actuelle
   * @param options Options de la période actuelle
   * @returns HttpParams pour la période précédente
   */
  private calculerPeriodePrecedente(options: StatistiquesOptions): HttpParams {
    let params = new HttpParams();

    // Si on utilise des dates personnalisées
    if (options.date_min && options.date_max) {
      const debut = new Date(options.date_min);
      const fin = new Date(options.date_max);
      const duree = fin.getTime() - debut.getTime();

      // Calculer la période précédente avec la même durée
      const finPrecedente = new Date(debut);
      finPrecedente.setTime(finPrecedente.getTime() - 1); // Jour précédent

      const debutPrecedente = new Date(finPrecedente);
      debutPrecedente.setTime(debutPrecedente.getTime() - duree);

      params = params.set('date_min', this.formatDate(debutPrecedente));
      params = params.set('date_max', this.formatDate(finPrecedente));
    }
    // Si on utilise une période standard
    else if (options.period) {
      params = params.set('period', options.period);

      // Ajouter un paramètre indiquant qu'on veut la période précédente
      params = params.set('previous', 'true');

      // En fonction de la période actuelle, calculer la période précédente
      const now = new Date();
      let debutPeriodePrecedente: Date;
      let finPeriodePrecedente: Date;

      switch (options.period) {
        case 'weekly':
          // Semaine précédente
          debutPeriodePrecedente = new Date(now);
          debutPeriodePrecedente.setDate(debutPeriodePrecedente.getDate() - 14); // 2 semaines avant aujourd'hui
          finPeriodePrecedente = new Date(now);
          finPeriodePrecedente.setDate(finPeriodePrecedente.getDate() - 7); // 1 semaine avant aujourd'hui
          break;

        case 'monthly':
          // Mois précédent
          debutPeriodePrecedente = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
          );
          finPeriodePrecedente = new Date(now.getFullYear(), now.getMonth(), 0);
          break;

        case 'quarterly':
          // Trimestre précédent
          const trimestre = Math.floor(now.getMonth() / 3);
          debutPeriodePrecedente = new Date(
            now.getFullYear(),
            (trimestre - 1) * 3,
            1
          );
          finPeriodePrecedente = new Date(now.getFullYear(), trimestre * 3, 0);
          break;

        case 'yearly':
          // Année précédente
          debutPeriodePrecedente = new Date(now.getFullYear() - 1, 0, 1);
          finPeriodePrecedente = new Date(now.getFullYear() - 1, 11, 31);
          break;

        default:
          // Par défaut, mois précédent
          debutPeriodePrecedente = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
          );
          finPeriodePrecedente = new Date(now.getFullYear(), now.getMonth(), 0);
      }

      params = params.set('date_min', this.formatDate(debutPeriodePrecedente));
      params = params.set('date_max', this.formatDate(finPeriodePrecedente));
    } else {
      // Par défaut, utiliser la période mensuelle et définir le mois précédent
      params = params.set('period', 'monthly');

      const now = new Date();
      const debutMoisPrecedent = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const finMoisPrecedent = new Date(now.getFullYear(), now.getMonth(), 0);

      params = params.set('date_min', this.formatDate(debutMoisPrecedent));
      params = params.set('date_max', this.formatDate(finMoisPrecedent));
    }

    return params;
  }

  /**
   * Formate une date au format YYYY-MM-DD
   * @param date La date à formater
   * @returns La date au format YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
