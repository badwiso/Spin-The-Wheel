import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ElectronService } from './core/services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(private electronService:ElectronService,private router:Router,private zone:NgZone) {
  }
  ngOnInit():void{
    this.electronService.ipcRenderer.once('identity',(_,id)=>{
      if(id==='child')  this.navigate2('/detail');//if child process redirect to detail
      else this.navigate2('/login');               // else redirect to home
    });
    this.electronService.ipcRenderer.send('identity');
  }
  navigate2(route:string):void{
    this.zone.run(()=>this.router.navigateByUrl(route));
  }
}
