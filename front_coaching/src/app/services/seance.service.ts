import { Injectable } from '@angular/core';
import {
  Observable,
  of,
  map,
  catchError,
  forkJoin,
  switchMap,
  throwError,
  Subject,
  tap,
} from 'rxjs';
import { Seance, Coach } from '../models/seance.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { CoachService } from './coach.service';

@Injectable({
  providedIn: 'root',
})
export class SeanceService {
  private apiUrl = environment.apiUrl || 'https://127.0.0.1:8000/api';
  private baseImageUrl = 'https://127.0.0.1:8000/images/seances/';

  // Subject pour notifier les composants des changements de réservations
  private seanceChangedSubject = new Subject<{action: 'reserve' | 'annule', seanceId: string}>();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private coachService: CoachService
  ) {}

  // Observable pour que les composants puissent s'abonner aux changements
  get seanceChanged$(): Observable<{action: 'reserve' | 'annule', seanceId: string}> {
    return this.seanceChangedSubject.asObservable();
  }

  // Méthode pour notifier les composants d'un changement
  notifySeanceChanged(action: 'reserve' | 'annule', seanceId: string): void {
    this.seanceChangedSubject.next({action, seanceId});
  }

  // Récupérer toutes les séances de l'utilisateur connecté
  getMesSeances(forceRefresh: boolean = false): Observable<Seance[]> {
    // Utiliser la méthode getUserSeances du service d'authentification avec le paramètre forceRefresh
    return this.authService.getUserSeances(forceRefresh).pipe(
      map((seances) => {
        if (seances && seances.length > 0) {
          console.log('Séances récupérées depuis AuthService:', seances.length);

          // Transformer coach en coach.id si nécessaire
          seances = seances.map((seance) => {
            if (
              seance.coach &&
              typeof seance.coach !== 'string' &&
              seance.coach['id']
            ) {
              // Extraction de l'id à partir de l'@id
              const coachIdPath = seance.coach['id'].split('/');
              const coachId = coachIdPath.pop() || '';
              // Conserver uniquement l'ID tout en préservant les autres propriétés
              console.log(
                `Transformation du coach: ${JSON.stringify(
                  seance.coach
                )} -> ID: ${coachId}`
              );
              seance.coach = { id: coachId };
            }
            return seance;
          });

          // Transformer les données de l'API en objets Seance
          const mappedSeances = seances.map((seance) =>
            this.mapApiSeanceToModel(seance)
          );
          return mappedSeances;
        } else {
          console.warn('Aucune séance trouvée');
          return [];
        }
      }),
      // Enrichir les séances avec les informations complètes des coachs
      switchMap((seances) => this.enrichSeancesWithCoachData(seances)),
      catchError((error) => {
        console.error('Erreur lors de la récupération des séances:', error);
        return of([]);
      })
    );
  }

  // Récupérer une séance par son ID
  getSeanceById(id: string): Observable<Seance | undefined> {
    const headers = new HttpHeaders({
      Accept: 'application/ld+json',
    });

    return this.http.get<any>(`${this.apiUrl}/seances/${id}`, { headers }).pipe(
      map((response) => {
        // Transformer coach en coach.id si nécessaire
        if (
          response.coach &&
          typeof response.coach !== 'string' &&
          response.coach['@id']
        ) {
          const coachIdPath = response.coach['@id'].split('/');
          const coachId = coachIdPath.pop() || '';
          console.log(
            `Transformation du coach: ${JSON.stringify(
              response.coach
            )} -> ID: ${coachId}`
          );
          response.coach = { id: coachId };
        }
        return this.mapApiSeanceToModel(response);
      }),
      // Utiliser switchMap pour enrichir la séance unique avec les données du coach
      switchMap((seance) => {
        if (!seance) return of(undefined);

        // Créer un tableau d'une seule séance pour réutiliser enrichSeancesWithCoachData
        return this.enrichSeancesWithCoachData([seance]).pipe(
          map((seances) => seances[0]) // Récupérer la première (et unique) séance du tableau
        );
      }),
      catchError((error) => {
        console.error(
          `Erreur lors de la récupération de la séance ${id}:`,
          error
        );
        return of(undefined);
      })
    );
  }

  // Récupérer les séances à venir
  getSeancesAVenir(): Observable<Seance[]> {
    const maintenant = new Date();

    return this.getMesSeances().pipe(
      map((seances) =>
        seances.filter((s) => {
          // Vérifier le statut de la séance
          const statutValide =
            s.statut === 'à venir' ||
            s.statut === 'prevue' ||
            s.statut === 'validee';

          // Vérifier si la date de la séance est dans le futur
          let seanceDate: Date;
          if (s.date) {
            seanceDate = s.date instanceof Date ? s.date : new Date(s.date);
          } else if (s.date_heure) {
            seanceDate = new Date(s.date_heure);
          } else if (s.dateHeure) {
            seanceDate = new Date(s.dateHeure);
          } else {
            // Si aucune date n'est disponible, on considère uniquement le statut
            return statutValide;
          }

          // La séance est à venir si sa date est supérieure ou égale à maintenant
          // OU si elle a un statut valide pour les séances à venir
          return statutValide && seanceDate >= maintenant;
        })
      )
    );
  }

  // Récupérer les séances passées
  getSeancesPassees(): Observable<Seance[]> {
    const maintenant = new Date();

    return this.getMesSeances().pipe(
      map((seances) =>
        seances.filter((s) => {
          // Vérifier le statut de la séance
          const statutValide =
            s.statut === 'terminée' || s.statut === 'annulee';

          // Vérifier si la date de la séance est dans le passé
          let seanceDate: Date;
          if (s.date) {
            seanceDate = s.date instanceof Date ? s.date : new Date(s.date);
          } else if (s.date_heure) {
            seanceDate = new Date(s.date_heure);
          } else if (s.dateHeure) {
            seanceDate = new Date(s.dateHeure);
          } else {
            // Si aucune date n'est disponible, on considère uniquement le statut
            return statutValide;
          }

          // La séance est passée si sa date est inférieure à maintenant
          // OU si elle a un statut qui indique qu'elle est terminée ou annulée
          return statutValide || seanceDate < maintenant;
        })
      )
    );
  }

  // Récupérer les séances par date
  getSeancesByDate(date: Date): Observable<Seance[]> {
    return this.getMesSeances().pipe(
      map((seances) => {
        return seances.filter((s) => {
          if (!s.date) {
            // Si s.date est undefined, utiliser date_heure ou dateHeure
            const dateStr = s.date_heure || s.dateHeure;
            if (!dateStr) return false;
            const seanceDate = new Date(dateStr);
            return (
              seanceDate.getDate() === date.getDate() &&
              seanceDate.getMonth() === date.getMonth() &&
              seanceDate.getFullYear() === date.getFullYear()
            );
          }

          const seanceDate = new Date(s.date);
          return (
            seanceDate.getDate() === date.getDate() &&
            seanceDate.getMonth() === date.getMonth() &&
            seanceDate.getFullYear() === date.getFullYear()
          );
        });
      })
    );
  }

  // Récupérer toutes les séances disponibles
  getAllSeances(): Observable<Seance[]> {
    const headers = new HttpHeaders({
      Accept: 'application/ld+json',
    });

    return this.http.get<any>(`${this.apiUrl}/seances`, { headers }).pipe(
      map((response) => {
        if (response && response['member'] && response['member'].length > 0) {
          console.log(
            "Toutes les séances récupérées depuis l'API:",
            response['member']
          );
          const seances = response['member'].map((seance: any) =>
            this.mapApiSeanceToModel(seance)
          );
          // Enrichir les séances avec les informations complètes des coachs
          return seances;
        } else {
          console.warn("Aucune séance trouvée dans l'API");
          return [];
        }
      }),
      // On utilise switchMap pour transformer l'Observable de tableau en Observable de tableau enrichi
      switchMap((seances) => this.enrichSeancesWithCoachData(seances)),
      catchError((error) => {
        console.error('Erreur lors de la récupération des séances:', error);
        return of([]);
      })
    );
  }

  // Enrichir les séances avec les informations complètes des coachs
  private enrichSeancesWithCoachData(seances: Seance[]): Observable<Seance[]> {
    if (!seances || seances.length === 0) {
      return of(seances);
    }

    // Collecter tous les IDs de coachs uniques
    const coachIds = new Set<string>();
    seances.forEach((seance) => {
      if (seance.coach && seance.coach.id) {
        coachIds.add(seance.coach.id);
      }
    });

    // Si aucun coach à récupérer, retourner les séances telles quelles
    if (coachIds.size === 0) {
      return of(seances);
    }

    // Créer un tableau d'observables pour chaque requête de coach
    const coachRequests: Observable<any>[] = [];
    coachIds.forEach((id) => {
      coachRequests.push(
        this.coachService.getCoachById(id).pipe(
          catchError((error) => {
            console.error(
              `Erreur lors de la récupération du coach ${id}:`,
              error
            );
            return of(null);
          })
        )
      );
    });

    // Exécuter toutes les requêtes en parallèle
    return forkJoin(coachRequests).pipe(
      map((coaches) => {
        // Créer un dictionnaire des coachs par ID
        const coachMap = new Map<string, any>();
        coaches.forEach((coach) => {
          if (coach && coach.id) {
            coachMap.set(coach.id, coach);
          }
        });

        // Mettre à jour les informations des coachs dans les séances
        return seances.map((seance) => {
          if (
            seance.coach &&
            seance.coach.id &&
            coachMap.has(seance.coach.id)
          ) {
            const coach = coachMap.get(seance.coach.id);
            // Utiliser uniquement les données venant de getCoachById
            seance.coach = {
              id: coach.id,
              name: coach.nom,
              email: coach.email, // Ajout de l'email qui est maintenant disponible
              specialite: coach.specialite,
              avatar: coach.image,
            };
          }
          return seance;
        });
      })
    );
  }

  // Transformer les données de l'API en objet Seance
  private mapApiSeanceToModel(apiSeance: any): Seance {
    // Récupérer les informations du coach
    let coachData: Coach = { id: '' };
    console.log('apiSeance', apiSeance);

    if (apiSeance.coach) {
      if (typeof apiSeance.coach === 'string') {
        // Cas où on a juste une référence à l'URL du coach
        const coachId = apiSeance.coach.split('/').pop() || '';
        coachData = { id: coachId };
      } else if (apiSeance.coach['@id']) {
        // Cas où le coach est un objet avec un @id (format API)
        const coachId = apiSeance.coach['@id'].split('/').pop() || '';
        coachData = {
          id: coachId,
          '@id': apiSeance.coach['@id'],
          '@type': apiSeance.coach['@type'] || 'Coach',
          name: `${apiSeance.coach.prenom || ''} ${
            apiSeance.coach.nom || ''
          }`.trim(),
          nom: apiSeance.coach.nom,
          prenom: apiSeance.coach.prenom,
          email: apiSeance.coach.email,
        };
      } else {
        // Cas où on a déjà les données complètes du coach
        coachData = {
          id: apiSeance.coach.id || '',
          name: `${apiSeance.coach.prenom || ''} ${
            apiSeance.coach.nom || ''
          }`.trim(),
          nom: apiSeance.coach.nom,
          email: apiSeance.coach.email,
          prenom: apiSeance.coach.prenom,
          specialite:
            apiSeance.themeSeance || apiSeance.theme_seance || 'Général',
          avatar: 'assets/images/default-coach.jpg',
        };
      }
    }

    // Extraire les IDs des sportifs
    const sportifs = Array.isArray(apiSeance.sportifsIds)
      ? apiSeance.sportifsIds.map((id: string) => id)
      : [];

    // Déterminer le statut de la séance
    const apiStatut = apiSeance.statut || '';
    let statut = 'à venir';

    if (apiStatut === 'annulee') {
      statut = 'annulee';
    } else if (apiStatut === 'terminée') {
      statut = 'passee';
    } else if (apiStatut === 'validee') {
      statut = 'passee';
    } else if (apiStatut === 'prevue') {
      statut = 'à venir';
    }

    // Convertir la date
    const dateStr = apiSeance.dateHeure || apiSeance.date_heure;
    const seanceDate = dateStr
      ? new Date(dateStr)
      : apiSeance.date || new Date();

    // Calculer l'heure de fin (par défaut, 1 heure après le début)
    const heureFinDate = new Date(seanceDate);
    heureFinDate.setHours(heureFinDate.getHours() + 1);

    // Déterminer le type de séance
    const typeSeance =
      apiSeance.typeSeance ||
      apiSeance.type_seance ||
      apiSeance.type ||
      'individuelle';

    // Déterminer le thème de séance
    const themeSeance =
      apiSeance.themeSeance ||
      apiSeance.theme_seance ||
      apiSeance.theme ||
      'fitness';

    // Déterminer le niveau de séance
    const niveauSeance =
      apiSeance.niveauSeance ||
      apiSeance.niveau_seance ||
      apiSeance.niveau ||
      'intermediaire';

    // Créer l'objet Seance
    const seance: Seance = {
      id: apiSeance.id || '',
      '@id': apiSeance['@id'] || '',
      '@type': apiSeance['@type'] || '',
      titre: apiSeance.titre || `Séance de ${themeSeance}`,
      description:
        apiSeance.description ||
        `Séance de ${themeSeance} de niveau ${niveauSeance}`,
      date: seanceDate,
      date_heure: apiSeance.date_heure,
      dateHeure: apiSeance.dateHeure,
      heureDebut: apiSeance.heureDebut || this.formatTime(seanceDate),
      heureFin: apiSeance.heureFin || this.formatTime(heureFinDate),
      duree: apiSeance.duree || 60, // Durée par défaut en minutes
      coach: coachData,
      lieu: apiSeance.lieu || 'Salle principale',
      type: typeSeance,
      type_seance: apiSeance.type_seance,
      typeSeance: apiSeance.typeSeance,
      capaciteMax: apiSeance.capaciteMax || this.getCapaciteMax(typeSeance),
      participantsActuels: apiSeance.participantsActuels || sportifs.length,
      statut: statut,
      couleur: apiSeance.couleur || this.getColorByType(themeSeance),
      theme: themeSeance,
      theme_seance: apiSeance.theme_seance,
      themeSeance: apiSeance.themeSeance,
      niveau: niveauSeance,
      niveau_seance: apiSeance.niveau_seance,
      niveauSeance: apiSeance.niveauSeance,
      exercices: apiSeance.exercices || [],
      sportifs: sportifs,
      photo: `${this.baseImageUrl}${apiSeance.photo}` || '',
    };

    return seance;
  }

  // Formater l'heure au format HH:MM
  private formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }

  // Obtenir une couleur en fonction du thème de séance
  private getColorByType(theme: string): string {
    switch (theme.toLowerCase()) {
      case 'fitness':
        return '#4CAF50'; // vert
      case 'musculation':
        return '#2196F3'; // bleu
      case 'cardio':
        return '#F44336'; // rouge
      case 'crossfit':
        return '#FF9800'; // orange
      case 'yoga':
        return '#9C27B0'; // violet
      default:
        return '#607D8B'; // gris-bleu
    }
  }

  // Obtenir la capacité maximale en fonction du type de séance
  private getCapaciteMax(type: string): number {
    if (!type) return 1;

    switch (type.toLowerCase()) {
      case 'solo':
        return 1;
      case 'duo':
        return 2;
      case 'trio':
        return 3;
      default:
        return 1;
    }
  }

  // Annuler une séance
  cancelSeance(seanceId: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/seances/${seanceId}/annuler`, {})
      .pipe(
        tap(response => {
          if (response.success !== false) {
            // Notifier les autres composants du changement
            this.notifySeanceChanged('annule', seanceId);
          }
        }),
        catchError((error) => {
          console.error(
            `Erreur lors de l'annulation de la séance ${seanceId}:`,
            error
          );
          return of({ success: false, error: error.message });
        })
      );
  }

  /**
   * Réserver ou annuler une réservation pour une séance
   * Si l'utilisateur est déjà inscrit, il sera désinscrit
   * Si l'utilisateur n'est pas inscrit, il sera inscrit
   *
   * @param seanceId L'identifiant de la séance
   * @returns Un Observable contenant la réponse de l'API
   */
  toggleReservationSeance(seanceId: string): Observable<any> {
    // Récupérer l'utilisateur connecté pour vérifier qu'il est authentifié
    const user = this.authService.currentUserValue;

    if (!user) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }

    // Construire l'URL de la requête
    const url = `${this.apiUrl}/seances/${seanceId}/inscription`;

    // Configurer les en-têtes HTTP
    // Note: Le token d'authentification devrait être automatiquement ajouté par un intercepteur HTTP
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/ld+json',
    });

    // Exécuter la requête PATCH au lieu de POST
    // Pas besoin d'envoyer l'ID du sportif car l'API l'identifie via le token JWT
    return this.http.patch<any>(url, {}, { headers }).pipe(
      // Utiliser switchMap pour chaîner avec une mise à jour des séances
      switchMap((response) => {
        console.log("Réponse d'inscription/désinscription:", response);
        
        // Mettre à jour la liste des séances de l'utilisateur dans le AuthService
        // en forçant une requête au serveur pour récupérer les données les plus récentes
        return this.authService.getUserSeances(true).pipe(
          map(() => {
            console.log('Données des séances mises à jour après inscription/désinscription');
            
            // Notifier les autres composants du changement avec l'action appropriée
            this.notifySeanceChanged(
              response.estInscrit ? 'reserve' : 'annule',
              seanceId
            );
            
            return {
              success: true,
              message: response.message,
              estInscrit: response.estInscrit,
            };
          })
        );
      }),
      catchError((error) => {
        console.error(
          `Erreur lors de l'inscription/désinscription à la séance ${seanceId}:`,
          error
        );

        // Gérer le cas où la séance est complète
        if (
          error.status === 400 &&
          error.error &&
          error.error.message === 'Séance complète'
        ) {
          return throwError(
            () => new Error("La séance est complète, impossible de s'inscrire")
          );
        }

        // Gérer le cas où la séance est déjà terminée ou annulée
        if (
          error.status === 400 &&
          error.error &&
          error.error.message === 'Séance non disponible'
        ) {
          return throwError(
            () =>
              new Error("Cette séance n'est plus disponible pour inscription")
          );
        }

        return throwError(
          () => new Error("Une erreur est survenue lors de l'inscription")
        );
      })
    );
  }

  /**
   * Récupère les détails d'un exercice à partir de son ID
   * @param id L'identifiant de l'exercice
   * @returns Un Observable contenant les détails de l'exercice
   */
  getExerciceById(id: string): Observable<any> {
    // Extraire l'ID si c'est une URL
    const exerciceId = id.includes('/') ? id.split('/').pop() : id;
    return this.http.get<any>(`${this.apiUrl}/exercices/${exerciceId}`);
  }
}
