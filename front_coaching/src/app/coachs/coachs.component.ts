import { Component, OnInit } from '@angular/core';

// Interface pour les coachs
interface Coach {
  id: number;
  nom: string;
  specialite: string;
  disponibilite: string;
  citation?: string;
  image: string;
}

@Component({
  selector: 'app-coachs',
  templateUrl: './coachs.component.html',
  styleUrl: './coachs.component.css',
  standalone: false
})
export class CoachsComponent implements OnInit {
  // Liste des coachs
  coachs: Coach[] = [
    {
      id: 1,
      nom: 'Yann Rouquié',
      specialite: 'Entraînement militaire',
      disponibilite: '7j/7 - 24h/24',
      citation: 'Entrainement sous système fluide',
      image: 'assets/images/coach1.jpg',
    },
    {
      id: 2,
      nom: 'Mael Carrié',
      specialite: 'Entraînement bodybuilding',
      disponibilite: '5j/7 - 2h/24',
      citation: 'Je ne compte pas mes temps de repos, mes muscles me parlent',
      image: 'assets/images/coach2.jpg',
    },
    {
      id: 3,
      nom: 'Julien Bizet',
      specialite: 'Devenir coach',
      disponibilite: '1j/7 - 1h/24',
      citation: 'Moi je suis coach',
      image: 'assets/images/coach3.png',
    },
  ];

  constructor() {}

  ngOnInit(): void {
    // Initialisation du composant
  }
}
