import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, delay, tap } from 'rxjs/operators';
import { Seance } from '../models/seance.model';

export enum UserRole {
  RESPONSABLE = 'RESPONSABLE',
  COACH = 'COACH',
  AGENT = 'AGENT',
  CLIENT = 'CLIENT'
}

export interface User {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  id: string;
  name?: string;
  nom?: string;
  prenom?: string;
  email: string;
  role: UserRole;
  token?: string;
  avatar?: string;
  date_inscription?: string;
  niveau_sportif?: string;
  seances?: Seance[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  // Utilisateurs fictifs pour les tests
  private mockUsers: User[] = [
    {
      '@context': '/api/contexts/Sportif',
      '@id': '/api/sportifs/01959416-b8e3-70d3-9a18-6c69a270c0bc',
      '@type': 'Sportif',
      id: '01959416-b8e3-70d3-9a18-6c69a270c0bc',
      nom: 'Marin',
      prenom: 'Franck',
      email: 'sportif1@example.com',
      role: UserRole.CLIENT,
      avatar: '/assets/images/coach1.jpg',
      date_inscription: '2025-03-11T02:27:40+00:00',
      niveau_sportif: 'debutant',
      seances: [
        {
          '@id': '/api/seances/01959416-f1b2-7d9b-b6d3-5e54c30b7593',
          '@type': 'Seance',
          id: '01959416-f1b2-7d9b-b6d3-5e54c30b7593',
          date_heure: '2025-04-05T22:54:31+00:00',
          type_seance: 'trio',
          theme_seance: 'crossfit',
          coach: {
            '@id': '/api/coaches/01959416-b07c-77c2-9c21-b9ca8760f05a',
            '@type': 'Coach',
            id: '01959416-b07c-77c2-9c21-b9ca8760f05a',
            email: 'coach3@example.com',
            nom: 'Mace',
            prenom: 'Alex'
          },
          statut: 'validee',
          niveau_seance: 'intermediaire',
          exercices: [
            '/api/exercices/01959416-a55a-71de-acd5-2b5895ab30e8',
            '/api/exercices/01959416-a55a-71de-acd5-2b5896080cb9',
            '/api/exercices/01959416-a55a-71de-acd5-2b589806263e',
            '/api/exercices/01959416-a55b-7338-8dad-030d2c331988'
          ]
        },
        {
          '@id': '/api/seances/01959416-f1b3-7163-8770-efc50d40f6d9',
          '@type': 'Seance',
          id: '01959416-f1b3-7163-8770-efc50d40f6d9',
          date_heure: '2025-04-19T11:09:01+00:00',
          type_seance: 'trio',
          theme_seance: 'musculation',
          coach: {
            '@id': '/api/coaches/01959416-b07c-77c2-9c21-b9ca8760f05a',
            '@type': 'Coach',
            id: '01959416-b07c-77c2-9c21-b9ca8760f05a',
            email: 'coach3@example.com',
            nom: 'Mace',
            prenom: 'Alex'
          },
          statut: 'validee',
          niveau_seance: 'avance',
          exercices: [
            '/api/exercices/01959416-a55a-71de-acd5-2b58910a2d60',
            '/api/exercices/01959416-a55a-71de-acd5-2b5894b064e6',
            '/api/exercices/01959416-a55b-7338-8dad-030d2c331988'
          ]
        },
        {
          '@id': '/api/seances/01959416-f1b4-7eda-8c17-29821734c3ea',
          '@type': 'Seance',
          id: '01959416-f1b4-7eda-8c17-29821734c3ea',
          date_heure: '2025-04-06T07:08:05+00:00',
          type_seance: 'trio',
          theme_seance: 'crossfit',
          coach: {
            '@id': '/api/coaches/01959416-b35f-732d-bb24-ca77d2a3f7c8',
            '@type': 'Coach',
            id: '01959416-b35f-732d-bb24-ca77d2a3f7c8',
            email: 'coach4@example.com',
            nom: 'Monnier',
            prenom: 'Charles'
          },
          statut: 'annulee',
          niveau_seance: 'avance',
          exercices: [
            '/api/exercices/01959416-a55a-71de-acd5-2b58941e9cc9',
            '/api/exercices/01959416-a55a-71de-acd5-2b5894b064e6',
            '/api/exercices/01959416-a55a-71de-acd5-2b5895ab30e8',
            '/api/exercices/01959416-a55a-71de-acd5-2b5897222699',
            '/api/exercices/01959416-a55b-7338-8dad-030d2c331988'
          ]
        },
        {
          '@id': '/api/seances/01959416-f1b4-7eda-8c17-29821a844a11',
          '@type': 'Seance',
          id: '01959416-f1b4-7eda-8c17-29821a844a11',
          date_heure: '2025-04-19T15:47:03+00:00',
          type_seance: 'duo',
          theme_seance: 'musculation',
          coach: {
            '@id': '/api/coaches/01959416-adbd-78b3-9de0-ae14588f85d5',
            '@type': 'Coach',
            id: '01959416-adbd-78b3-9de0-ae14588f85d5',
            email: 'coach2@example.com',
            nom: 'Pineau',
            prenom: 'Robert'
          },
          statut: 'annulee',
          niveau_seance: 'intermediaire',
          exercices: [
            '/api/exercices/01959416-a55a-71de-acd5-2b5892eb0b96',
            '/api/exercices/01959416-a55a-71de-acd5-2b589513c963'
          ]
        }
      ]
    },
    {
      id: '/api/sportifs/01959416-d52e-704b-9cbc-18dac5c26aa7',
      name: 'Marie Coach',
      email: 'coach@example.com',
      role: UserRole.COACH,
      avatar: 'assets/images/default-avatar.png'
    },
    {
      id: '/api/sportifs/01959416-d52e-704b-9cbc-18dac5c26aa7',
      name: 'Sophie Responsable',
      email: 'responsable@example.com',
      role: UserRole.RESPONSABLE,
      avatar: 'assets/images/default-avatar.png'
    }
  ];

  constructor(private http: HttpClient, private router: Router) {
    // Récupérer l'utilisateur du localStorage au démarrage
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  public hasRole(role: UserRole): boolean {
    return this.currentUserValue?.role === role;
  }

  public hasAnyRole(roles: UserRole[]): boolean {
    return this.currentUserValue ? roles.includes(this.currentUserValue.role) : false;
  }

  /**
   * Récupère les séances de l'utilisateur actuellement connecté
   * @returns Un Observable contenant la liste des séances ou un tableau vide si l'utilisateur n'est pas connecté
   */
  public getUserSeances(): Observable<Seance[]> {
    const user = this.currentUserValue;
    
    if (!user) {
      return of([]);
    }
    
    // Si l'utilisateur a des séances, on les retourne
    if (user.seances && user.seances.length > 0) {
      return of(user.seances);
    }
    
    // Si l'utilisateur est un client mais n'a pas de séances chargées
    // Dans un environnement réel, on pourrait faire un appel API ici
    if (user.role === UserRole.CLIENT) {
      // Simuler un délai réseau
      return of([]).pipe(
        delay(500),
        map(() => {
          // Rechercher l'utilisateur dans les mockUsers pour obtenir ses séances
          const mockUser = this.mockUsers.find(u => u.id === user.id);
          return mockUser?.seances || [];
        })
      );
    }
    
    // Pour les autres rôles, retourner un tableau vide
    return of([]);
  }

  // Méthode de connexion simulée pour les tests
  login(email: string, password: string): Observable<User> {
    // Pour les tests, on accepte n'importe quel mot de passe
    const user = this.mockUsers.find(u => u.email === email);
    
    if (!user) {
      return throwError(() => new Error('Email ou mot de passe incorrect'));
    }

    // Simuler un délai réseau
    return of({
      ...user,
      token: 'fake-jwt-token.' + Math.random().toString(36).substring(2, 15)
    }).pipe(
      delay(800),
      tap(userData => {
        // Stocker les détails de l'utilisateur et le token JWT dans le localStorage
        localStorage.setItem('currentUser', JSON.stringify(userData));
        this.currentUserSubject.next(userData);
      })
    );
  }

  // Méthode pour se connecter directement avec un rôle spécifique (pour les tests)
  loginAs(role: UserRole): Observable<User> {
    const user = this.mockUsers.find(u => u.role === role);
    
    if (!user) {
      return throwError(() => new Error(`Aucun utilisateur avec le rôle ${role} trouvé`));
    }

    // Simuler un délai réseau
    return of({
      ...user,
      token: 'fake-jwt-token.' + Math.random().toString(36).substring(2, 15)
    }).pipe(
      delay(500),
      tap(userData => {
        // Stocker les détails de l'utilisateur
        localStorage.setItem('currentUser', JSON.stringify(userData));
        this.currentUserSubject.next(userData);
      })
    );
  }

  // Méthode de connexion réelle (à implémenter avec l'API)
  loginReal(email: string, password: string): Observable<User> {
    // À remplacer par un appel HTTP réel à l'API
    // return this.http.post<any>(`${environment.apiUrl}/auth/login`, { email, password })
    //   .pipe(
    //     map(response => {
    //       // Stocker les détails de l'utilisateur et le token JWT dans le localStorage
    //       localStorage.setItem('currentUser', JSON.stringify(response));
    //       this.currentUserSubject.next(response);
    //       return response;
    //     })
    //   );
    
    // Pour l'instant, on utilise la méthode simulée
    return this.login(email, password);
  }

  logout(): void {
    // Supprimer l'utilisateur du localStorage
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }
} 