import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Seance, Coach } from '../models/seance.model';

@Injectable({
  providedIn: 'root'
})
export class SeanceService {
  // Données fictives pour les tests
  private coachs: Coach[] = [
    {
      id: 1,
      name: 'Marie Coach',
      specialite: 'Fitness',
      avatar: 'assets/images/coach1.jpg'
    },
    {
      id: 2,
      name: 'Thomas Durand',
      specialite: 'Musculation',
      avatar: 'assets/images/coach2.jpg'
    },
    {
      id: 3,
      name: 'Sophie Martin',
      specialite: 'Yoga',
      avatar: 'assets/images/coach3.png'
    }
  ];

  private seances: Seance[] = [
    {
      id: 1,
      titre: 'Séance de Fitness',
      description: 'Séance de fitness pour débutants',
      date: new Date(2025, 2, 15, 10, 0), // 15 mars 2024 à 10h00
      heureDebut: '10:00',
      heureFin: '11:00',
      duree: 60,
      coach: this.coachs[0],
      lieu: 'Salle A',
      type: 'groupe',
      capaciteMax: 15,
      participantsActuels: 8,
      statut: 'à venir',
      couleur: '#4CAF50' // vert
    },
    {
      id: 2,
      titre: 'Coaching Musculation',
      description: 'Séance personnalisée de musculation',
      date: new Date(2025, 2, 16, 14, 30), // 16 mars 2024 à 14h30
      heureDebut: '14:30',
      heureFin: '15:30',
      duree: 60,
      coach: this.coachs[1],
      lieu: 'Salle de musculation',
      type: 'individuelle',
      statut: 'à venir',
      couleur: '#2196F3' // bleu
    },
    {
      id: 3,
      titre: 'Yoga relaxant',
      description: 'Séance de yoga pour déstresser',
      date: new Date(2025, 2, 17, 18, 0), // 17 mars 2024 à 18h00
      heureDebut: '18:00',
      heureFin: '19:00',
      duree: 60,
      coach: this.coachs[2],
      lieu: 'Salle Zen',
      type: 'groupe',
      capaciteMax: 10,
      participantsActuels: 6,
      statut: 'à venir',
      couleur: '#FF9800' // orange
    },
    {
      id: 4,
      titre: 'Cardio intensif',
      description: 'Séance de cardio à haute intensité',
      date: new Date(2025, 2, 18, 9, 0), // 18 mars 2024 à 9h00
      heureDebut: '09:00',
      heureFin: '10:00',
      duree: 60,
      coach: this.coachs[0],
      lieu: 'Salle B',
      type: 'groupe',
      capaciteMax: 12,
      participantsActuels: 10,
      statut: 'à venir',
      couleur: '#F44336' // rouge
    },
    {
      id: 5,
      titre: 'Stretching',
      description: 'Séance d\'étirements et de relaxation',
      date: new Date(2025, 2, 14, 17, 0), // 14 mars 2024 à 17h00
      heureDebut: '17:00',
      heureFin: '18:00',
      duree: 60,
      coach: this.coachs[2],
      lieu: 'Salle Zen',
      type: 'groupe',
      capaciteMax: 15,
      participantsActuels: 7,
      statut: 'terminée',
      couleur: '#9C27B0' // violet
    }
  ];

  constructor() { }

  // Récupérer toutes les séances de l'utilisateur
  getMesSeances(): Observable<Seance[]> {
    // Dans une application réelle, on filtrerait les séances de l'utilisateur connecté
    // et on ferait un appel HTTP à l'API
    return of(this.seances);
  }

  // Récupérer une séance par son ID
  getSeanceById(id: number): Observable<Seance | undefined> {
    const seance = this.seances.find(s => s.id === id);
    return of(seance);
  }

  // Récupérer les séances à venir
  getSeancesAVenir(): Observable<Seance[]> {
    const seancesAVenir = this.seances.filter(s => s.statut === 'à venir');
    return of(seancesAVenir);
  }

  // Récupérer les séances passées
  getSeancesPassees(): Observable<Seance[]> {
    const seancesPassees = this.seances.filter(s => s.statut === 'terminée');
    return of(seancesPassees);
  }

  // Récupérer les séances par date
  getSeancesByDate(date: Date): Observable<Seance[]> {
    const seancesDuJour = this.seances.filter(s => {
      const seanceDate = new Date(s.date);
      return seanceDate.getDate() === date.getDate() &&
             seanceDate.getMonth() === date.getMonth() &&
             seanceDate.getFullYear() === date.getFullYear();
    });
    return of(seancesDuJour);
  }
} 