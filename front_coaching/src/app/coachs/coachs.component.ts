import { Component, OnInit } from '@angular/core';
import { CoachService, Coach } from '../services/coach.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-coachs',
  templateUrl: './coachs.component.html',
  styleUrl: './coachs.component.css',
  standalone: false,
})
export class CoachsComponent implements OnInit {
  // Liste des coachs
  coachs: Coach[] = [];
  loading: boolean = true;
  error: string | null = null;
  // Map pour suivre quelles descriptions sont développées
  descriptionsDevelloppees = new Map<string, boolean>();

  constructor(private coachService: CoachService, private router: Router) {}

  ngOnInit(): void {
    this.loadCoaches();
  }

  loadCoaches(): void {
    this.loading = true;
    this.error = null;

    this.coachService.getCoaches().subscribe({
      next: (data) => {
        this.coachs = data;
        console.log('Coachs chargés avec succès:', this.coachs.length);
        this.loading = false;

        // Initialiser les descriptions comme étant repliées
        this.coachs.forEach((coach) => {
          this.descriptionsDevelloppees.set(coach.id.toString(), false);
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement des coachs', err);
        this.error =
          'Impossible de charger les coachs. Veuillez réessayer plus tard.';
        this.loading = false;
      },
    });
  }

  // Méthode pour déterminer la position optimale de l'image en fonction du coach
  getImagePosition(coach: Coach): string {
    // Par défaut, on centre l'image et on privilégie le haut (pour voir le visage)
    return 'center 20%';
  }

  // Méthode pour rediriger vers la page des séances avec le filtre du coach
  voirSeancesCoach(coach: Coach): void {
    // Naviguer vers la page des séances avec le paramètre 'coach'
    this.router.navigate(['/seances'], {
      queryParams: {
        coach: coach.id,
      },
    });
    console.log(
      `Redirection vers les séances du coach ${coach.nom} (ID: ${coach.id})`
    );
  }

  // Méthode pour basculer l'affichage de la description
  toggleDescription(coachId: string): void {
    const etatActuel = this.descriptionsDevelloppees.get(coachId) || false;
    this.descriptionsDevelloppees.set(coachId, !etatActuel);
  }

  // Méthode pour vérifier si une description est développée
  isDescriptionDevelloppee(coachId: string): boolean {
    return this.descriptionsDevelloppees.get(coachId) || false;
  }
}
