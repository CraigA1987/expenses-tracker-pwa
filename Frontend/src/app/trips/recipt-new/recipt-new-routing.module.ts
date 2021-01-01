import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReciptNewPage } from './recipt-new.page';

const routes: Routes = [
  {
    path: '',
    component: ReciptNewPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReciptNewPageRoutingModule {}
