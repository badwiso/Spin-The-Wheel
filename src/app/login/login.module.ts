import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginRoutingModule } from './login-routing.module';

import { LoginComponent } from './login.component';
import { SharedModule } from '../shared/shared.module';


import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModalModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [LoginComponent],
  imports: [CommonModule, SharedModule, LoginRoutingModule,FontAwesomeModule,NgbModalModule,NgbNavModule]
})
export class LoginModule {}
