import { Routes } from "@angular/router";
import { PageEpiComponent } from "./pages/page-epi/page-epi.component";
import { PageLevageComponent } from "./pages/page-levage/page-levage.component";
import { PageContractuelComponent } from "./pages/page-contractuel/page-contractuel.component";

export const routes: Routes = [
    { path: 'page-epi', component: PageEpiComponent },
    { path: 'page-levage', component: PageLevageComponent },
    { path: 'page-contractuel', component: PageContractuelComponent },
    { path: '', redirectTo: 'page-epi', pathMatch: 'full' },
    
    { path: '**', component: PageEpiComponent },

];
