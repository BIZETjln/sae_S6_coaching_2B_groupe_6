import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { provideHttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomeComponent } from './home/home.component';
import { ConnexionComponent } from './connexion/connexion.component';
import { InscriptionComponent } from './inscription/inscription.component';
import { CoachsComponent } from './coachs/coachs.component';
import { SeancesComponent } from './seances/seances.component';
import { MesSceancesComponent } from './mes-sceances/mes-sceances.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ConnexionComponent,
    InscriptionComponent,
    CoachsComponent,
    SeancesComponent,
    MesSceancesComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule],
  providers: [provideHttpClient()],
  bootstrap: [AppComponent],
})
export class AppModule {}
