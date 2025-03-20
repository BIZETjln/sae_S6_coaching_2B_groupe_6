import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../services/auth.service';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {
  currentUser: User | null = null;
  userAvatarUrl: string = '';

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    // Récupérer l'utilisateur actuel
    this.currentUser = this.authService.currentUserValue;
    console.log('currentUser', this.currentUser);
    // Récupérer l'URL de l'avatar
    this.userAvatarUrl = this.authService.getUserAvatarUrl();
  }

  // Méthode pour obtenir le niveau sportif avec valeur par défaut
  get niveauSportif(): string {
    return this.currentUser?.niveau_sportif || 'Non spécifié';
  }

  // Méthode pour obtenir la spécialité du coach avec valeur par défaut
  get specialiteCoach(): string {
    return (this.currentUser as any)?.specialite || 'Non spécifiée';
  }

  // Méthode pour formater la date d'inscription
  get dateInscription(): string {
    if (!this.currentUser?.date_inscription) {
      return 'Non spécifiée';
    }
    
    // Formater la date
    const date = new Date(this.currentUser.date_inscription);
    return date.toLocaleDateString('fr-FR');
  }
} 