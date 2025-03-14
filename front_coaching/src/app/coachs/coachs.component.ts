import { Component, OnInit } from '@angular/core';
import { CoachService, Coach } from '../services/coach.service';

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

  constructor(private coachService: CoachService) {}

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
      },
      error: (err) => {
        console.error('Erreur lors du chargement des coachs', err);
        this.error =
          'Impossible de charger les coachs. Veuillez réessayer plus tard.';
        this.loading = false;
      },
    });
  }
}
