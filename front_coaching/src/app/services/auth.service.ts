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
      '@id': '/api/sportifs/0195a89b-1506-7729-a98c-e4f3ec855abf',
      '@type': 'Sportif',
      id: '0195a89b-1506-7729-a98c-e4f3ec855abf',
      nom: 'Marin',
      prenom: 'Franck',
      email: 'sportif1@example.com',
      role: UserRole.CLIENT,
      avatar: '/assets/images/coach1.jpg',
      date_inscription: '2025-03-11T02:27:40+00:00',
      niveau_sportif: 'debutant',
      seances: [
        {
          "@id": "/api/seances/0195a89b-303f-798c-863e-04c10c674a7b",
          "@type": "Seance",
          "id": "0195a89b-303f-798c-863e-04c10c674a7b",
          "date_heure": "2025-05-03T17:05:46+00:00",
          "type_seance": "trio",
          "theme_seance": "cardio",
          "coach": {
            "@id": "/api/coaches/0195a89b-107a-7dba-8ab3-744eab018ed4",
            "@type": "Coach",
            "id": "0195a89b-107a-7dba-8ab3-744eab018ed4",
            "email": "coach4@example.com",
            "nom": "Toussaint",
            "prenom": "Christelle"
          },
          "statut": "annulee",
          "niveau_seance": "avance",
          "exercices": [
            "/api/exercices/0195a89b-08d5-726b-aba6-99fa03a8de5d",
            "/api/exercices/0195a89b-08d5-726b-aba6-99fa05d74dda"
          ]
        },
        {
          "@id": "/api/seances/0195a89b-303f-798c-863e-04c10f4009e7",
          "@type": "Seance",
          "id": "0195a89b-303f-798c-863e-04c10f4009e7",
          "date_heure": "2025-03-25T06:24:49+00:00",
          "type_seance": "solo",
          "theme_seance": "musculation",
          "coach": {
            "@id": "/api/coaches/0195a89b-0ef5-75b7-a286-c53f920fe7af",
            "@type": "Coach",
            "id": "0195a89b-0ef5-75b7-a286-c53f920fe7af",
            "email": "coach3@example.com",
            "nom": "Royer",
            "prenom": "Valentine"
          },
          "statut": "annulee",
          "niveau_seance": "avance",
          "exercices": [
            "/api/exercices/0195a89b-08d5-726b-aba6-99f9ff206c1e",
            "/api/exercices/0195a89b-08d5-726b-aba6-99fa05d74dda",
            "/api/exercices/0195a89b-08d5-726b-aba6-99fa06c35401"
          ]
        },
        {
          "@id": "/api/seances/0195a89b-303f-798c-863e-04c1108dd462",
          "@type": "Seance",
          "id": "0195a89b-303f-798c-863e-04c1108dd462",
          "date_heure": "2025-03-25T22:05:50+00:00",
          "type_seance": "trio",
          "theme_seance": "cardio",
          "coach": {
            "@id": "/api/coaches/0195a89b-0bf1-7454-ae37-390d07bf3c7e",
            "@type": "Coach",
            "id": "0195a89b-0bf1-7454-ae37-390d07bf3c7e",
            "email": "coach1@example.com",
            "nom": "Grenier",
            "prenom": "Nicole"
          },
          "statut": "annulee",
          "niveau_seance": "intermediaire",
          "exercices": [
            "/api/exercices/0195a89b-08d5-726b-aba6-99fa03129382",
            "/api/exercices/0195a89b-08d5-726b-aba6-99fa067212d8"
          ]
        },
        {
          "@id": "/api/seances/0195a89b-303f-798c-863e-04c114126e22",
          "@type": "Seance",
          "id": "0195a89b-303f-798c-863e-04c114126e22",
          "date_heure": "2025-04-10T03:58:17+00:00",
          "type_seance": "trio",
          "theme_seance": "cardio",
          "coach": {
            "@id": "/api/coaches/0195a89b-0ef5-75b7-a286-c53f920fe7af",
            "@type": "Coach",
            "id": "0195a89b-0ef5-75b7-a286-c53f920fe7af",
            "email": "coach3@example.com",
            "nom": "Royer",
            "prenom": "Valentine"
          },
          "statut": "prevue",
          "niveau_seance": "debutant",
          "exercices": [
            "/api/exercices/0195a89b-08d5-726b-aba6-99fa0161745a",
            "/api/exercices/0195a89b-08d5-726b-aba6-99fa0847c408"
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