import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faKey, faUser } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loggedIn=false;
  email = "";
  password = "";
  fauser = faUser;
  fakey=faKey;
  errorMessage = ''; // validation error handle
  session = "";
  error: { name: string, message: string } = { name: '', message: '' }; // for firbase error handle
  constructor(private authservice:AuthService,private router:Router) { }

  ngOnInit(): void {

  }
  clearErrorMessage():void {
    this.errorMessage = '';
    this.error = { name: '', message: '' };
  }
  login():void{
    this.clearErrorMessage();
    if (this.validateForm(this.email, this.password)) {
      this.authservice.loginWithEmail(this.email, this.password)
        .then(() => {
          localStorage.setItem("username",this.email);
          this.router.navigateByUrl('/home');
        }).catch(_error => {
          this.error = _error;
        });
    }
  }
  validateForm(email:string, password:string):boolean {
    if (email.length === 0) {
      this.errorMessage = "ce champ est obligatoire";
      return false;
    }
    if (password.length === 0) {
      this.errorMessage = "mot de passe est obligatoire";
      return false;
    }
    if (password.length < 6) {
      this.errorMessage = "mot de passe ou moins 6 caractere";
      return false;
    }
    this.errorMessage = '';
    return true;
  }


}
