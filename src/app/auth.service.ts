import { Injectable } from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  authState: any = null;
  private loggedIn = new BehaviorSubject<boolean>(false);
  constructor(private afu: AngularFireAuth, private router: Router) {
    this.afu.authState.subscribe((auth =>{
      this.authState = auth;

    }));
  }
  get isLoggedIn() :any{
    return this.loggedIn.asObservable(); // {2}
  }

  // all firebase getdata functions

  get isUserAnonymousLoggedIn(): boolean {
    return (this.authState !== null) ? this.authState.isAnonymous : false;
  }

  get currentUserId(): string {
    return (this.authState !== null) ? this.authState.uid : '';
  }

  get currentUserName(): string {
    return this.authState['email'];
  }

  get currentUser(): any {
    return (this.authState !== null) ? this.authState : null;
  }

  get isUserEmailLoggedIn(): boolean {
    if ((this.authState !== null) && (!this.isUserAnonymousLoggedIn)) {
      return true;
    } else {
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async registerWithEmail(email: string, password: string) {
  //console.log(this.afu)

    const userCredential = await this.afu.createUserWithEmailAndPassword(email, password);
    this.authState = userCredential;
    this.loggedIn.next(true);
    return this.authState;
  }


  loginWithEmail(email: string, password: string):any
  {

    return this.afu.signInWithEmailAndPassword(email, password)
      .then((user) => {

        this.authState = user;
        this.loggedIn.next(true);
      })
      .catch(error => {
        console.log(error);
        throw error;
      });
  }

  singout(): void
  {
    this.afu.signOut();
    this.loggedIn.next(false);
    this.authState=null;
    this.router.navigate(['/login']);
  }
}
