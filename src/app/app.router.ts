import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { MainMenuComponent } from './mainmenu/mainmenu.component';
import { LoginComponent } from './company/login/login.component';

export const router: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'mainmenu', component: MainMenuComponent }
    // { path: '**', redirectTo: 'login'}
];

export const routes: ModuleWithProviders = RouterModule.forRoot(router);


