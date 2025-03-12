import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from './guards/role.guard';
import { UserRole } from './services/auth.service';
import { Component } from '@angular/core';
import { HomeComponent } from './home/home.component';
import { InscriptionComponent } from './inscription/inscription.component';
import { ConnexionComponent } from './connexion/connexion.component';
import { CoachsComponent } from './coachs/coachs.component';

// Composant temporaire pour les routes non encore implémentées
@Component({
  template: `<div class="container mt-5">
    <h2>Page en construction</h2>
    <p>Cette fonctionnalité sera bientôt disponible.</p>
  </div>`,
  standalone: false
})
export class PlaceholderComponent {}

const routes: Routes = [
  // Routes publiques
  { path: '', redirectTo: '/accueil', pathMatch: 'full' },
  { path: 'accueil', component: HomeComponent },
  { path: 'coachs', component: CoachsComponent },
  { path: 'seances', component: PlaceholderComponent },
  { path: 'connexion', component: ConnexionComponent },
  { path: 'inscription', component: InscriptionComponent },
  { path: 'a-propos', component: PlaceholderComponent },
  { path: 'confidentialite', component: PlaceholderComponent },
  { path: 'conditions', component: PlaceholderComponent },
  { path: 'acces-refuse', component: PlaceholderComponent },

  // Routes pour les clients
  { 
    path: 'mes-seances', 
    component: PlaceholderComponent, 
    canActivate: [RoleGuard],
    data: { roles: [UserRole.CLIENT] }
  },
  { 
    path: 'mon-suivi', 
    component: PlaceholderComponent, 
    canActivate: [RoleGuard],
    data: { roles: [UserRole.CLIENT] }
  },
  { 
    path: 'profil', 
    component: PlaceholderComponent, 
    canActivate: [RoleGuard],
    data: { roles: [UserRole.CLIENT, UserRole.COACH, UserRole.AGENT, UserRole.RESPONSABLE] }
  },

  // Routes pour les coachs
  { 
    path: 'mes-clients', 
    component: PlaceholderComponent, 
    canActivate: [RoleGuard],
    data: { roles: [UserRole.COACH] }
  },
  { 
    path: 'planning', 
    component: PlaceholderComponent, 
    canActivate: [RoleGuard],
    data: { roles: [UserRole.COACH] }
  },

  // Routes pour les agents
  { 
    path: 'gestion-clients', 
    component: PlaceholderComponent, 
    canActivate: [RoleGuard],
    data: { roles: [UserRole.AGENT, UserRole.RESPONSABLE] }
  },
  { 
    path: 'reservations', 
    component: PlaceholderComponent, 
    canActivate: [RoleGuard],
    data: { roles: [UserRole.AGENT, UserRole.RESPONSABLE] }
  },

  // Routes pour les responsables
  { 
    path: 'dashboard', 
    component: PlaceholderComponent, 
    canActivate: [RoleGuard],
    data: { roles: [UserRole.RESPONSABLE] }
  },
  { 
    path: 'gestion-personnel', 
    component: PlaceholderComponent, 
    canActivate: [RoleGuard],
    data: { roles: [UserRole.RESPONSABLE] }
  },
  { 
    path: 'statistiques', 
    component: PlaceholderComponent, 
    canActivate: [RoleGuard],
    data: { roles: [UserRole.RESPONSABLE] }
  },
  { 
    path: 'parametres', 
    component: PlaceholderComponent, 
    canActivate: [RoleGuard],
    data: { roles: [UserRole.RESPONSABLE] }
  },

  // Route pour le back-office (accessible par tout le personnel)
  { 
    path: 'back-office', 
    component: PlaceholderComponent, 
    canActivate: [RoleGuard],
    data: { roles: [UserRole.RESPONSABLE, UserRole.COACH, UserRole.AGENT] }
  },

  // Route par défaut (page non trouvée)
  { path: '**', redirectTo: '/accueil' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  declarations: [PlaceholderComponent]
})
export class AppRoutingModule { }
