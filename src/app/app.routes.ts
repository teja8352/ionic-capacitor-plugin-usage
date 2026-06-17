import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'mitek',
    pathMatch: 'full',
  },
  {
    path: 'mitek',
    loadComponent: () => import('./mitek/mitek.page').then((m) => m.MitekPage),
  },
  {
    path: 'folder/:id',
    loadComponent: () =>
      import('./folder/folder.page').then((m) => m.FolderPage),
  },
];
