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
  seancesAnnulees: Seance[] = [];
  seancesParJour: { [date: string]: Seance[] } = {};
  
  // État de chargement
  isLoading: boolean = false;
  
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
  activeTab: 'avenir' | 'passees' | 'annulees' = 'avenir';
  showCancelConfirmation: boolean = false;
  
  // Pour les notifications
  notification: { message: string, type: 'success' | 'error' | 'info' } | null = null;
  showNotification: boolean = false;

  constructor(private seanceService: SeanceService, private router: Router) { }

  ngOnInit(): void {
    this.loadSeances();
    this.generateCalendarDays();
  }

  loadSeances(): void {
    this.isLoading = true;
    this.seanceService.getMesSeances().subscribe({
      next: seances => {
        this.seances = seances;
        this.organizeSeances();
        
        // Afficher des logs pour le débogage
        console.log('Nombre total de séances chargées:', this.seances.length);
        console.log('Nombre de séances à venir:', this.seancesAVenir.length);
        console.log('Nombre de séances passées:', this.seancesPassees.length);
        console.log('Nombre de séances annulées:', this.seancesAnnulees.length);
        
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement des séances:', error);
        this.isLoading = false;
        this.showErrorMessage('Une erreur est survenue lors du chargement des séances');
      }
    });
  }

  organizeSeances(): void {
    // Séances à venir et passées
    console.log('Séances récupérées:', this.seances);
    this.seancesAVenir = this.seances.filter(s => 
      s.statut === 'à venir' || 
      s.statut === 'validee' || 
      s.statut === 'prevue'
    );
    
    this.seancesPassees = this.seances.filter(s => 
      s.statut === 'passee'
    );
    
    // Séances annulées
    this.seancesAnnulees = this.seances.filter(s => 
      s.statut === 'annulee'
    );
    
    console.log('Séances à venir:', this.seancesAVenir);
    console.log('Séances passées:', this.seancesPassees);
    console.log('Séances annulées:', this.seancesAnnulees);
    
    // Organiser les séances par jour pour le calendrier
    this.seancesParJour = {};
    this.seances.forEach(seance => {
      // S'assurer que seance.date est bien un objet Date
      let seanceDate: Date;
      
      if (seance.date) {
        seanceDate = seance.date instanceof Date ? seance.date : new Date(seance.date);
      } else if (seance.date_heure) {
        seanceDate = new Date(seance.date_heure);
      } else if (seance.dateHeure) {
        seanceDate = new Date(seance.dateHeure);
      } else {
        // Si aucune date n'est disponible, ignorer cette séance
        return;
      }
      
      const dateStr = this.formatDate(seanceDate);
      
      if (!this.seancesParJour[dateStr]) {
        this.seancesParJour[dateStr] = [];
      }
      this.seancesParJour[dateStr].push(seance);
    });
  }

  // Méthode pour changer d'onglet dans la vue liste
  switchTab(tab: 'avenir' | 'passees' | 'annulees'): void {
    this.activeTab = tab;
    
    // Vérifier si nous avons une date sélectionnée (si nous venons de la vue jour)
    // ou si les séances ne contiennent que les séances d'un jour spécifique
    if (this.selectedDate) {
      // Recharger toutes les séances avant de filtrer
      this.isLoading = true;
      this.seanceService.getMesSeances().subscribe({
        next: seances => {
          this.seances = seances;
          this.filterSeancesByTab(tab);
          this.selectedDate = null;
          this.isLoading = false;
        },
        error: error => {
          console.error('Erreur lors du chargement des séances:', error);
          this.isLoading = false;
          this.showErrorMessage('Une erreur est survenue lors du chargement des séances');
        }
      });
    } else {
      // Sinon, filtrer les séances déjà chargées
      this.filterSeancesByTab(tab);
    }
  }

  // Méthode utilitaire pour filtrer les séances selon l'onglet actif
  private filterSeancesByTab(tab: 'avenir' | 'passees' | 'annulees'): void {
    if (tab === 'avenir') {
      this.seancesAVenir = this.seances.filter(s => 
        s.statut === 'à venir' || 
        s.statut === 'validee' || 
        s.statut === 'prevue'
      );
    } else if (tab === 'passees') {
      this.seancesPassees = this.seances.filter(s => 
        s.statut === 'passee'
      );
    } else if (tab === 'annulees') {
      this.seancesAnnulees = this.seances.filter(s => 
        s.statut === 'annulee'
      );
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
    this.isLoading = true;
    this.seanceService.getSeancesByDate(this.selectedDate).subscribe({
      next: seances => {
        this.seances = seances;
        
        // Filtrer les séances selon leur statut
        this.seancesAVenir = this.seances.filter(s => 
          s.statut === 'à venir' || 
          s.statut === 'validee' || 
          s.statut === 'prevue'
        );
        this.seancesPassees = this.seances.filter(s => 
          s.statut === 'passee'
        );
        this.seancesAnnulees = this.seances.filter(s => 
          s.statut === 'annulee'
        );
        
        console.log(`Séances chargées pour le ${this.formatDateFr(this.selectedDate!)}:`, this.seances.length);
        this.isLoading = false;
      },
      error: error => {
        console.error(`Erreur lors du chargement des séances pour le ${this.formatDateFr(this.selectedDate!)}:`, error);
        this.isLoading = false;
        this.showErrorMessage('Une erreur est survenue lors du chargement des séances');
      }
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
    
    // Recharger toutes les séances pour la vue calendrier
    this.isLoading = true;
    this.seanceService.getMesSeances().subscribe({
      next: seances => {
        this.seances = seances;
        this.organizeSeances();
        this.selectedDate = null;
        this.isLoading = false;
      },
      error: error => {
        console.error('Erreur lors du chargement des séances:', error);
        this.isLoading = false;
        this.showErrorMessage('Une erreur est survenue lors du chargement des séances');
      }
    });
  }

  switchToCalendarView(): void {
    // Si nous venons de la vue jour ou liste, nous devons recharger toutes les séances
    if (this.viewMode === 'day' || (this.viewMode === 'list' && this.selectedDate)) {
      this.isLoading = true;
      this.seanceService.getMesSeances().subscribe({
        next: seances => {
          this.seances = seances;
          this.organizeSeances();
          this.selectedDate = null;
          this.viewMode = 'calendar';
          this.isLoading = false;
        },
        error: error => {
          console.error('Erreur lors du chargement des séances:', error);
          this.isLoading = false;
          this.showErrorMessage('Une erreur est survenue lors du chargement des séances');
        }
      });
    } else {
      // Sinon, changer simplement la vue
      this.viewMode = 'calendar';
    }
  }

  switchToListView(): void {
    this.viewMode = 'list';
    this.activeTab = 'avenir'; // Initialiser l'onglet actif à "à venir"
    
    // Si on vient de la vue jour (on a sélectionné une date spécifique),
    // on recharge toutes les séances pour avoir la liste complète
    if (this.selectedDate) {
      this.isLoading = true;
      this.seanceService.getMesSeances().subscribe({
        next: seances => {
          this.seances = seances;
          this.organizeSeances();
          this.selectedDate = null;
          this.isLoading = false;
        },
        error: error => {
          console.error('Erreur lors du chargement des séances:', error);
          this.isLoading = false;
          this.showErrorMessage('Une erreur est survenue lors du chargement des séances');
        }
      });
    } else {
      // Sinon, on filtre simplement les séances déjà chargées
      this.seancesAVenir = this.seances.filter(s => 
        s.statut === 'à venir' || 
        s.statut === 'validee' || 
        s.statut === 'prevue'
      );
      this.seancesPassees = this.seances.filter(s => 
        s.statut === 'passee'
      );
      this.seancesAnnulees = this.seances.filter(s => 
        s.statut === 'annulee'
      );
      this.selectedDate = null;
    }
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

  // Annuler la séance
  cancelSeance(): void {
    if (!this.selectedSeance) return;
    
    // Afficher un indicateur de chargement si nécessaire
    
    this.seanceService.cancelSeance(this.selectedSeance.id).subscribe({
      next: (response) => {
        console.log('Séance annulée avec succès:', response);
        
        // Mettre à jour la liste des séances
        this.loadSeances();
        
        // Fermer la modale
        this.closeSeanceDetails();
        
        // Afficher un message de succès
        this.showSuccessMessage('Votre séance a été annulée avec succès');
      },
      error: (error) => {
        console.error('Erreur lors de l\'annulation de la séance:', error);
        
        // Afficher un message d'erreur
        this.showErrorMessage('Une erreur est survenue lors de l\'annulation de la séance');
        
        // Fermer quand même la modale
        this.closeSeanceDetails();
      }
    });
  }

  // Fermer la confirmation sans annuler
  closeCancelConfirmation(): void {
    this.showCancelConfirmation = false;
  }

  // Afficher un message de succès
  showSuccessMessage(message: string): void {
    this.notification = { message, type: 'success' };
    this.showNotification = true;
    setTimeout(() => this.hideNotification(), 5000); // Masquer après 5 secondes
  }
  
  // Afficher un message d'erreur
  showErrorMessage(message: string): void {
    this.notification = { message, type: 'error' };
    this.showNotification = true;
    setTimeout(() => this.hideNotification(), 5000); // Masquer après 5 secondes
  }
  
  // Afficher un message d'information
  showInfoMessage(message: string): void {
    this.notification = { message, type: 'info' };
    this.showNotification = true;
    setTimeout(() => this.hideNotification(), 5000); // Masquer après 5 secondes
  }
  
  // Masquer la notification
  hideNotification(): void {
    if (!this.notification) return;
    
    // Ajouter la classe pour l'animation de sortie
    const notificationElement = document.querySelector('.notification');
    if (notificationElement) {
      notificationElement.classList.add('hiding');
    }
    
    // Attendre la fin de l'animation avant de masquer
    setTimeout(() => {
      this.showNotification = false;
      setTimeout(() => this.notification = null, 100);
    }, 300);
  }

  // Formater le nom du coach
  formatCoachName(coach: any): string {
    if (!coach) return 'Coach';
    
    if (coach.name) return coach.name;
    
    if (coach.prenom && coach.nom) {
      return `${coach.prenom} ${coach.nom}`;
    } else if (coach.nom) {
      return coach.nom;
    } else if (coach.prenom) {
      return coach.prenom;
    }
    
    return 'Coach';
  }

  // Formater l'URL de l'image du coach
  getCoachImage(coach: any): string {
    if (!coach) return 'assets/images/default-coach.png';
    
    // Image par défaut
    const defaultImage = 'assets/images/default-coach.png';
    const baseImageUrl = 'https://127.0.0.1:8000/images/coaches/';
    
    // Si le coach a une image via la propriété avatar
    if (coach.avatar) {
      // Si l'avatar est déjà une URL complète ou chemin relatif des assets
      if (coach.avatar.startsWith('http') || coach.avatar.startsWith('assets/')) {
        return coach.avatar;
      }
      // Sinon, c'est juste le nom du fichier, on ajoute le chemin complet
      return `${baseImageUrl}${coach.avatar}`;
    }
    
    // Si le coach a une image via la propriété image
    if (coach.image) {
      // Si l'image est déjà une URL complète ou chemin relatif des assets
      if (coach.image.startsWith('http') || coach.image.startsWith('assets/')) {
        return coach.image;
      }
      // Sinon, c'est juste le nom du fichier, on ajoute le chemin complet
      return `${baseImageUrl}${coach.image}`;
    }
    
    // Fallback: image par défaut
    return defaultImage;
  }

  // Créer un lien mailto pour contacter le coach
  createMailtoLink(coach: any, seance: any): string {
    if (!coach || !coach.email) return '';
    
    const coachName = this.formatCoachName(coach);
    const seanceTitre = seance.titre || 'la séance';
    
    // Construction du corps du mail
    let bodyText = `Bonjour ${coachName},\n\n`;
    bodyText += `Je vous contacte au sujet de "${seanceTitre}"`;
    
    // Ajout des informations de date si disponibles
    if (seance.date) {
      const dateFormatted = this.formatDateFr(new Date(seance.date));
      bodyText += ` prévue le ${dateFormatted}`;
      
      // Ajout de l'heure si disponible
      if (seance.heureDebut) {
        bodyText += ` à ${seance.heureDebut}`;
      }
    }
    
    bodyText += `.\n\n`;
    bodyText += `Cordialement,\n`;
    
    const subject = encodeURIComponent(`À propos de : ${seanceTitre}`);
    const body = encodeURIComponent(bodyText);
    
    return `mailto:${coach.email}?subject=${subject}&body=${body}`;
  }
}
