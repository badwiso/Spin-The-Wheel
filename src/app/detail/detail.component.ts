import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, NgZone, OnInit } from '@angular/core';
import { ElectronService } from '../core/services';
import * as moment from 'moment';
import { DexieService } from '../dexie.service';
@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  animations: [
    trigger('rotatedState', [
      state('default', style({ transform: 'rotate(-94deg)'  ,'transform-origin':'center'})),
      state('rotated', style({ transform: 'rotate({{deg}}deg)' ,'transform-origin':'center'}),{params:{deg:0}}),
      state('intermid', style({ transform:'rotate({{deg}}deg)','transform-origin':'center'}),{params:{deg:0}}),
      transition('default => rotated', animate('15s cubic-bezier(.29,.63,0,1)')),
      transition('rotated => intermid', animate('0ms')),
      transition('intermid => rotated', animate('15s cubic-bezier(.29,.63,0,1)')),
    ])]
})
export class DetailComponent implements OnInit {
  config = {
    value:'default',
    params:{
      deg:0,
    }
  };
  ibraSlow = false;
  ibraSlower = false;
  ibra=false;
  steps=0;
  winColor="rgb(9, 168, 26)";
  winner:any = '';
  timer = null;
  latest=[];
  numbers =[26,3,35,12,28,7,29,18,22,9,31,14,20,1,33,16,24,5,10,23,8,30,11,36,13,27,6,34,17,25,2,21,4,19,15,32,0];
  pick = 32;
  constructor(private electron:ElectronService,private zone:NgZone,private dexie:DexieService)  {
  }
  color(n:number):string{
    if(n===0) return 'rgb(9, 168, 26)';
    if(this.numbers.indexOf(n)%2===0) return 'black';
    else return 'rgb(232, 22, 24)';
  }
  time():string{
    const sc = this.steps%60;
    const mn = (this.steps - sc)/60;
    return `0${mn}:${sc < 10 ? '0' : ''}${sc}`;
  }
  onAnimationEventDone(event):void{
    const v = this.config.params.deg%360;
    if(event.fromState!=='void'){
      if(event.totalTime===0){
        this.winner = this.pick;
        this.electron.ipcRenderer.send('parent','done');
      }
      this.winColor = this.color(this.pick);
      this.config = {
        value:'intermid',
        params:{
          deg:v
        }
      };
    }
  }
  leadingZero(n:number):string{
    if(n<10) return `00${n}`;
    else if(n<100) return `0${n}`;
    else return `${n}`;
  }
  title(r){
    return `${moment(r.date).dayOfYear()+100}${this.leadingZero(r.id)}`;
  }
  start():void{
    this.winner = '';
    this.ibra = true;
    setTimeout(()=>{
      this.ibra = false;
      this.ibraSlow = true;
      setTimeout(()=>{
        this.ibraSlow = false;
        this.ibraSlower = true;
        setTimeout(()=>{
          this.ibraSlower = false;
        },2000);
      },5000);
    },7000);
    this.config = {
      value:'rotated',
      params:{
        deg:Math.floor((this.numbers.indexOf(this.pick)+1)*360/37)+3600-94,
      }
    };
  }
  timing():void{
    this.dexie.getRounds().then(t=>this.zone.run(()=>{this.latest=t.slice(0,10);}));
    this.timer = setInterval(()=>{
      if(this.steps>0){
        this.steps -=1;
      }else{
        clearInterval(this.timer);
        this.steps = 0;
        this.start();
      }
    },1000);
  }
  ngOnInit(): void {
    this.dexie.getRounds().then(t=>this.zone.run(()=>{this.latest=t.reverse().slice(0,10);}));
    document.getElementsByTagName("body")[0].classList.add("overflow-hidden");
    setTimeout(()=>{
      this.electron.ipcRenderer.send("parent","ready");
    },2000);
    this.electron.ipcRenderer.on("parent",(_,msg)=>this.zone.run(()=>{
      const m = JSON.parse(msg);
      this.steps = m.steps;
      this.pick = m.pick;
      this.timing();
    }));
  }
}
