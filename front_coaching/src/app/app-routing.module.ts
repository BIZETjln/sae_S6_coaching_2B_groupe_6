import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from './guards/role.guard';
import { UserRole } from './services/auth.service';
import { Component } from '@angular/core';
import { HomeComponent } from './home/home.component';
import { InscriptionComponent } from './inscription/inscription.component';
import { ConnexionComponent } from './connexion/connexion.component';
import { CoachsComponent } from './coachs/coachs.component';
import { SeancesComponent } from './seances/seances.component';
import { MesSceancesComponent } from './mes-sceances/mes-sceances.component';
import { MonSuiviComponent } from './mon-suivi/mon-suivi.component';
import { AProposComponent } from './a-propos/a-propos.component';
import { ConfidentialiteComponent } from './confidentialite/confidentialite.component';
import { ConditionsComponent } from './conditions/conditions.component';
// Composant temporaire pour les routes non encore implémentées
@Component({
  template: `<div class="container mt-5">
    <h2>Page en construction</h2>
    <p>Cette fonctionnalité sera bientôt disponible.</p>
  </div>`,
  standalone: false,
})
export class PlaceholderComponent {}

const routes: Routes = [
  // Routes publiques
  { path: '', redirectTo: '/accueil', pathMatch: 'full' },
  { path: 'accueil', component: HomeComponent },
  { path: 'coachs', component: CoachsComponent },
  { path: 'seances', component: SeancesComponent },
  { path: 'connexion', component: ConnexionComponent },
  { path: 'inscription', component: InscriptionComponent },
  { path: 'a-propos', component: AProposComponent },
  { path: 'confidentialite', component: ConfidentialiteComponent },
  { path: 'conditions', component: ConditionsComponent },
  { path: 'acces-refuse', component: PlaceholderComponent },

  // Routes pour les clients
  {
    path: 'mes-seances',
    component: MesSceancesComponent,
    canActivate: [RoleGuard],
    data: { roles: [UserRole.CLIENT] },
  },
  {
    path: 'mon-suivi',
    component: MonSuiviComponent,
    canActivate: [RoleGuard],
    data: { roles: [UserRole.CLIENT] },
  },
  {
    path: 'profil',
    component: PlaceholderComponent,
    canActivate: [RoleGuard],
    data: {
      roles: [
        UserRole.CLIENT,
        UserRole.COACH,
        UserRole.AGENT,
        UserRole.RESPONSABLE,
      ],
    },
  },

  // Route pour le back-office (accessible par tout le personnel)
  {
    path: 'back-office',
    component: PlaceholderComponent,
    canActivate: [RoleGuard],
    data: { roles: [UserRole.RESPONSABLE, UserRole.COACH, UserRole.AGENT] },
  },

  // Route par défaut (page non trouvée)
  { path: '**', redirectTo: '/accueil' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
      scrollOffset: [0, 0],
    }),
  ],
  exports: [RouterModule],
  declarations: [PlaceholderComponent],
})
export class AppRoutingModule {}
