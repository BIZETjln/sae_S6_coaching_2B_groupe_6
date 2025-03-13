import { Component, OnInit } from '@angular/core';
import { SeanceService } from '../services/seance.service';
import { Seance } from '../models/seance.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mes-sceances',
  templateUrl: './mes-sceances.component.html',
  styleUrl: './mes-sceances.component.css',
  standalone: false
})
export class MesSceancesComponent implements OnInit {
  seances: Seance[] = [];
  seancesAVenir: Seance[] = [];
  seancesDuJour: Seance[] = [];
  seancesPassees: Seance[] = [];
  seancesParJour: { [date: string]: Seance[] } = {};
  
  // Pour le calendrier
  currentDate: Date = new Date();
  currentMonth: number = this.currentDate.getMonth();
  currentYear: number = this.currentDate.getFullYear();
  daysInMonth: number[] = [];
  weekdays: string[] = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  months: string[] = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  
  // Pour l'affichage
  viewMode: 'calendar' | 'list' | 'day' = 'calendar';
  selectedDate: Date | null = null;
  selectedSeance: Seance | null = null;
  activeTab: 'avenir' | 'passees' = 'avenir'; // Onglet actif par défaut
  showCancelConfirmation: boolean = false; // Pour afficher la confirmation d'annulation

  constructor(private seanceService: SeanceService, private router: Router) { }

  ngOnInit(): void {
    this.loadSeances();
    this.generateCalendarDays();
  }

  loadSeances(): void {
    this.seanceService.getMesSeances().subscribe(seances => {
      this.seances = seances;
      this.organizeSeances();
      console.log('Séances chargées:', this.seances);
      console.log('Séances par jour:', this.seancesParJour);
    });
  }

  organizeSeances(): void {
    // Séances à venir et passées
    this.seancesAVenir = this.seances.filter(s => s.statut === 'à venir');
    this.seancesPassees = this.seances.filter(s => s.statut === 'terminée');
    
    // Organiser les séances par jour pour le calendrier
    this.seancesParJour = {};
    this.seances.forEach(seance => {
      // S'assurer que seance.date est bien un objet Date
      const seanceDate = seance.date instanceof Date ? seance.date : new Date(seance.date);
      const dateStr = this.formatDate(seanceDate);
      console.log('Date formatée pour la séance:', dateStr, seance.titre);
      
      if (!this.seancesParJour[dateStr]) {
        this.seancesParJour[dateStr] = [];
      }
      this.seancesParJour[dateStr].push(seance);
    });
  }

  // Méthode pour changer d'onglet dans la vue liste
  switchTab(tab: 'avenir' | 'passees'): void {
    this.activeTab = tab;
    // Recharger les séances appropriées
    if (tab === 'avenir') {
      this.seancesAVenir = this.seances.filter(s => s.statut === 'à venir');
    } else {
      this.seancesPassees = this.seances.filter(s => s.statut === 'terminée');
    }
  }

  generateCalendarDays(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysCount = lastDay.getDate();
    
    this.daysInMonth = [];
    
    // Ajouter des jours vides pour aligner le premier jour du mois
    for (let i = 0; i < firstDay.getDay(); i++) {
      this.daysInMonth.push(0);
    }
    
    // Ajouter les jours du mois
    for (let i = 1; i <= daysCount; i++) {
      this.daysInMonth.push(i);
    }
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendarDays();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendarDays();
  }

  selectDate(day: number): void {
    if (day === 0) return; // Jour vide
    
    this.selectedDate = new Date(this.currentYear, this.currentMonth, day);
    this.viewMode = 'day';
    
    // Charger les séances pour cette date
    this.seanceService.getSeancesByDate(this.selectedDate).subscribe(seances => {
      this.seancesAVenir = seances;
    });
  }

  selectSeance(seance: Seance): void {
    this.selectedSeance = seance;
    this.showCancelConfirmation = false; // Réinitialiser l'état de confirmation
  }

  closeSeanceDetails(): void {
    this.selectedSeance = null;
    this.showCancelConfirmation = false;
  }

  redirectToSeances(): void {
    this.router.navigate(['/seances']);
  }

  backToCalendar(): void {
    this.viewMode = 'calendar';
    this.selectedDate = null;
  }

  switchToListView(): void {
    this.viewMode = 'list';
    this.activeTab = 'avenir'; // Initialiser l'onglet actif à "à venir"
    this.seancesAVenir = this.seances.filter(s => s.statut === 'à venir');
    this.seancesPassees = this.seances.filter(s => s.statut === 'terminée');
    this.selectedDate = null;
  }

  hasSeances(day: number): boolean {
    if (day === 0) return false;
    const date = new Date(this.currentYear, this.currentMonth, day);
    const dateStr = this.formatDate(date);
    const result = !!this.seancesParJour[dateStr] && this.seancesParJour[dateStr].length > 0;
    return result;
  }

  getSeancesCount(day: number): number {
    if (day === 0) return 0;
    const date = new Date(this.currentYear, this.currentMonth, day);
    const dateStr = this.formatDate(date);
    return this.seancesParJour[dateStr] ? this.seancesParJour[dateStr].length : 0;
  }

  // Récupérer les séances pour un jour spécifique
  getSeancesForDay(day: number): Seance[] {
    if (day === 0) return [];
    const date = new Date(this.currentYear, this.currentMonth, day);
    const dateStr = this.formatDate(date);
    return this.seancesParJour[dateStr] || [];
  }

  formatDate(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }

  formatDateFr(date: Date): string {
    return `${date.getDate()} ${this.months[date.getMonth()]} ${date.getFullYear()}`;
  }

  isToday(day: number): boolean {
    const today = new Date();
    return day === today.getDate() && 
           this.currentMonth === today.getMonth() && 
           this.currentYear === today.getFullYear();
  }

  // Afficher la confirmation d'annulation
  showCancelConfirmationDialog(): void {
    this.showCancelConfirmation = true;
  }

  // Annuler la séance (pour l'instant juste fermer la modale)
  cancelSeance(): void {
    // Ici, on ajouterait la logique pour annuler réellement la séance
    console.log('Séance annulée:', this.selectedSeance);
    this.closeSeanceDetails();
  }

  // Fermer la confirmation sans annuler
  closeCancelConfirmation(): void {
    this.showCancelConfirmation = false;
  }
}
