import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { InscriptionComponent } from './inscription/inscription.component';
import { ConnexionComponent } from './connexion/connexion.component';
import { CoachsComponent } from './coachs/coachs.component';
import { SeancesComponent } from './seances/seances.component';
import { MesSceancesComponent } from './mes-sceances/mes-sceances.component';
import { jwtInterceptor } from './interceptors/jwt.interceptor';
import { MonSuiviComponent } from './mon-suivi/mon-suivi.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    InscriptionComponent,
    ConnexionComponent,
    CoachsComponent,
    SeancesComponent,
    MesSceancesComponent,
    MonSuiviComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    // Nous n'avons pas besoin d'importer NgChartsModule ici car Chart.js est utilisé directement dans le composant
  ],
  providers: [provideHttpClient(withInterceptors([jwtInterceptor]))],
  bootstrap: [AppComponent],
})
export class AppModule {}
