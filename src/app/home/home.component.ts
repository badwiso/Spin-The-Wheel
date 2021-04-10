import { Component, HostListener, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ElectronService } from '../core/services';
import { Bet, DexieService, Round, Ticket } from '../dexie.service';
import {AngularFirestore} from '@angular/fire/firestore';

import { faArrowLeft, faBan, faBarcode, faCheck, faPlus, faPrint, faSyncAlt, faTimes } from "@fortawesome/free-solid-svg-icons";
import { AuthService } from '../auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SVG } from '@svgdotjs/svg.js';
import * as es6printJS from "print-js";
import * as moment from 'moment';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  // Timer
  steps=0; // time in seconds
  timer;     // set interval var
  // Overlay control
  show=true;
  // Ticket
  ticket:Ticket={
    id:0,
    ticketid:0,
    roundid:0,
    bets:[],
    date:new Date(),
    claimed:false,
  };
  tickets:Ticket[] = [];
  // User Data
  userData = {
    username:'',
    solde:0,
    email:''
  };
  // Icons
  faban=faBan;
  facheck = faCheck;
  faremove = faTimes;
  fabarcode = faBarcode;
  faprint = faPrint;
  faadd = faPlus;
  faretour = faArrowLeft;
  fareload = faSyncAlt;
  // bet selection
  numbers = Array(67).fill(0);
  numberPicker =[26,3,35,12,28,7,29,18,22,9,31,14,20,1,33,16,24,5,10,23,8,30,11,36,13,27,6,34,17,25,2,21,4,19,15,32,0];
  paytable = this.numbers.slice().fill(36,0,37).fill(2,37,39).fill(3,39,42).fill(2,42,46).fill(6,46,52).fill(9,52,59).fill(18,59,62).fill(12,62,63).fill(4,63);
  selection = [];
  stake=1;
  // Pick
  pick:number;
  // Var Affichage
  tab=0;
  active = 'top';
  halted=true;
  validated=false;
  blocked=false; //
  results:Round[]=[]; // fetching played games
  winningts:Ticket[]=[];  // fetching winning bets per round
  printable:Ticket={
    id:0,
    bets:[],
    claimed:false,
    date:new Date(),
    roundid:0,
    ticketid:0
  };
  //
  closeResult = '';
  ticketNumber:string;
  isQuick=true;
  //
  constructor(private zone:NgZone, private router: Router,private fire:AngularFirestore, private modalService: NgbModal,private electronService:ElectronService, private authService:AuthService, private dexie:DexieService) { }

  ngOnInit(): void {
    this.electronService.ipcRenderer.on('child',(_,msg)=>{
      this.zone.run(()=>{
        switch (msg) {
          case "alive":
            break;
          case "dead":{
            this.halted=true;
            this.blocked = false;
            clearInterval(this.timer);
            this.steps = 0;
            break;
          }
          case "done":
          {this.dexie.createRound({date:new Date(),winner:this.pick}).then((id)=>this.zone.run(()=>{
            this.totalwin(id).then(tot=>{
              if(tot>0){
                const v = this.fire.collection<any>('permission',r=>r.where('email','==',this.userData.email)).get();
                v.subscribe(data => {
                  data.forEach(e => {
                    const client={
                      name:e.data()['name'],
                      last_name:e.data()['last_name'],
                      email:e.data()['email'],
                      argent:e.data()['argent'],
                      date_creation:e.data()['date_creation'],
                      permission:false,
                    };
                    client.argent+=tot;
                    this.fire.collection('permission').doc(e.id).update(client).then(()=>{
                      this.userData.solde=client.argent;
                    });
                  });});
              }
              this.timing();
            });
          }));
          break;}
          case "ready":{
            this.halted = false;
            this.timing();
            break;}
          default:
            break;
        }
      });
    });
    const svg = SVG("#picker");
    this.userData.email = localStorage.getItem('username');
    const v = this.fire.collection<any>('permission',r=>r.where('email','==',this.userData.email)).get();
    v.subscribe(data => {
      data.forEach(e => {
        this.userData.username=e.data()['name'];
        this.userData.solde=e.data()['argent'];
      });
    });
    for (let i = 1; i < 37; i++) {
      const bt = SVG(svg.findOne('#button'+i.toString()));
      bt.click(()=>{
        this.toggleBet(i);
      });
    }
  }
  // data formatting
  time():string{ // time formating in mm:ss
    const sc = this.steps%60;
    const mn = (this.steps - sc)/60;
    return `0${mn}:${sc < 10 ? '0' : ''}${sc}`;
  }
  leadingZero(n:number):string{
    if(n<10) return `00${n}`;
    else if(n<100) return `0${n}`;
    else return `${n}`;
  }
  ticketId(tk:Ticket):string{
    return `#${moment(tk.date).dayOfYear()+100}${this.leadingZero(tk.roundid)}${this.leadingZero(tk.ticketid)}`;
  }
  total(t:Ticket):number{
    return t.bets.reduce((p:number,c:Bet)=>{
      return p+Number.parseFloat(`${c.stake}`);
    },0);
  }
  color(r:Round):string{
    if(r.winner===0) return 'green';
    if(this.numberPicker.indexOf(r.winner)%2===0) return 'black';
    else return 'red';
  }
  letter(r:number):string{
    if([32,15,19,4,21,2].includes(r)) return 'A';
    if([25,17,34,6,27,13].includes(r)) return 'B';
    if([36,11,30,8,23,10].includes(r)) return 'C';
    if([5,24,16,33,1,20].includes(r)) return 'D';
    if([14,31,9,22,18,29].includes(r)) return 'E';
    if([7,28,12,35,3,26].includes(r)) return 'F';
    else return '';
  }
  pipe(n:number):string{ // get bet type
    if(n>0 && n<37) return "Number-" + n.toString();
    if (n===0) return "Colours-GREEN";
    if (n === 37) return "Colours-RED";
    if (n=== 38) return "Colours-BLACK";
    if (n>=39 &&  n<=41) return "Dozens-"+['25~36','13~24','1~12'][41-n];
    if (n===42) return "EVEN";
    if (n===43) return "ODD";
    if (n===44) return "LOW";
    if (n===45) return "HIGH";
    if (n>=46 && n<=51) return "Secteur-" +['A','B','C','D','E','F'][n-46];
    if (n>=52 && n<=58) return "Finals-" +(n-52).toString();
    if (n>=59 && n<=61) return "Mirroir-" +['12 - 21','13 - 31', '23 - 32'][n-59];
    if (n===62) return "TWINS 11-12-13";
    else return ['LOW & RED','LOW & BLACK','HIGH & RED', 'HIGH & BLACK'][n-63];
  }
  // testing
  canPrint():boolean{
    return this.ticket.bets.length>0;
  }
  canBet():boolean{
    return !this.validated && !this.halted;
  }
  isWinner(n:number,winner:number):boolean{
    if(n>=0 && n<37) return n===winner;
    if (n === 37) return this.numberPicker.indexOf(winner)%2===1;
    if (n=== 38) return this.numberPicker.indexOf(winner)%2===0;
    if (n=== 39) return winner>0 && winner<13;
    if (n=== 40) return winner>12 && winner<25;
    if (n=== 41) return winner>25 && winner<37;
    if (n===42) return winner%2===0;
    if (n===43) return winner%2===1;
    if (n=== 44) return winner<19;
    if (n=== 45) return winner>18;
    if (n>=46 && n<=51) return ['A','B','C','D','E','F'][n-46]===this.letter(winner);
    if (n>=52 && n<=58) return (n-52)===winner%10;
    if (n===59) return winner===12 || winner===21;
    if (n===60) return winner===13 || winner===31;
    if (n===61) return winner===23 || winner===32;
    if (n===62) return winner===11 || winner===22 || winner===33;
    if (n===63) return winner<19 && this.numberPicker.indexOf(winner)%2===0;
    if (n===64) return winner<19 && this.numberPicker.indexOf(winner)%2===1;
    if (n===65) return winner>18 && this.numberPicker.indexOf(winner)%2===0;
    if (n===66) return winner>18 && this.numberPicker.indexOf(winner)%2===1;
  }
  // fetching
  refresh():void{
    this.dexie.getOpenTicket().then(t=>this.tickets=t);
  }
  refreshResult():void{
    this.dexie.getRounds().then(t=>this.results=t);
  }
  winning(id:number):void{
    this.dexie.getRound(id).then(rnd=>{
      return this.dexie.getTicketByRound(id).then(r=>{
        this.winningts = r.filter((t)=>{
          return t.bets.some(b=>{
            return this.isWinner(b.pick,rnd.winner);
          });
        });
      });
    });
  }
  // navigation
  go2Game():void{
    // open game
    // if game already opened focus it
    this.electronService.ipcRenderer.send('new');
  }
  logout():void{
    this.authService.singout();
    this.electronService.ipcRenderer.send('kill','');
    this.router.navigateByUrl("/login");
  }
  openwinningts(content:any,id:number):void{
    this.winning(id);
    this.modalService.open(content);
  }
  open(content):void{
    this.modalService.open(content);
  }
  @HostListener('window:unload')
  private onUnload(): void {
    this.dexie.close();
  }
  // interaction logic
  totalwin(id):Promise<number>{
    return this.dexie.getRound(id).then(rnd=>{
      return this.dexie.getTicketByRound(id).then(r=>{
        return r.map((t)=>{
          return t.bets.map(b=>{
            if( this.isWinner(b.pick,rnd.winner))
              return b.stake*this.paytable[b.pick];
            else return 0;
          }).reduce((t,c)=>t+c,0);
        }).reduce((t,c)=>t+c,0);
      });
    });
  }
  randomSelect(s:number):void{
    if(this.canBet()){
      this.selection = this.selection.filter(n=>n>36 ||n===0);
      this.numbers.fill(0,0,37);
      let sl;
      for(let i=0;i<s;i++){
        do{
          sl = Math.ceil(Math.random()*36);
        }while(this.selection.indexOf(sl)!==-1);
        this.selection.push(sl);
        this.numbers[sl] = 1;
      }
    }else{
      alert(this.halted?"Start the game":"Create new ticket!");
    }
  }
  validate():void{
    if(this.validated===false && this.ticket.bets.length>0){
      this.selection = [];
      this.numbers.fill(0);
      if(this.ticket.bets.length>0) {
        const v = this.fire.collection<any>('permission',r=>r.where('email','==',this.userData.email)).get();
        v.subscribe(data => {
          data.forEach(e => {
            const client={
              name:e.data()['name'],
              last_name:e.data()['last_name'],
              email:e.data()['email'],
              argent:e.data()['argent'],
              date_creation:e.data()['date_creation'],
              permission:false,
            };
            if(client.argent>this.total(this.ticket)){
              client.argent-=this.total(this.ticket);
              this.fire.collection('permission').doc(e.id).update(client).then(()=>{
                this.userData.solde=client.argent;
              });
            }
            else { alert("insufficient balance");}
          });});
        this.dexie.createTicket(this.ticket).then(()=>{
          this.validated=true;
        });
      }
    }
  }
  ajouter():void{
    if(this.validated===true) this.createTicket();
    else{
      this.ticket.bets.push(...this.selection.map(b=>{
        const tp = {pick:b,stake:this.stake};
        if(!this.ticket.bets.some((el)=>el.pick===b))
          return tp;
        else alert(this.pipe(b)+" already exists");
      }).filter(el=>el!==undefined));
      this.selection = [];
      this.numbers.fill(0);
    }
  }
  cancel():void{
    if(this.ticket.bets.length>0){
      this.createTicket();
    }
    this.ticket.bets= [];
    this.selection = [];
    this.numbers.fill(0);
    this.validated = false;
  }
  toggleBet(n:number):void{
    if(this.canBet()){
      this.numbers[n]=1-this.numbers[n];
      const sl = this.selection.indexOf(n);
      if(sl>=0) this.selection = this.selection.filter((x)=>x!==n);
      else this.selection.push(n);
    }
  }
  print(tk:Ticket,t:boolean):void{
    this.printable = tk;
    setTimeout(() => {
      if(this.canPrint() || t) es6printJS({printable:"printable", type:"html",style: ' #printable { visibility: visible!important;max-width: 400px;font-size: 8px; } table, th, td {width:100%;border: 1px solid black;border-collapse: collapse;}'});
    }, 400);
  }
  onchange(e):void{
    this.stake = Math.abs(e.target.value);
    this.stake = this.stake>=0.5?this.stake:0.5;
    e.target.value = this.stake;
    console.log(this.stake);
  }
  // timer
  timing():void{
    this.steps = 180;
    this.blocked = false;
    this.createTicket();
    this.pick = this.randomDeg();
    const m = JSON.stringify({pick:this.pick,steps:this.steps});
    this.electronService.ipcRenderer.send('child',m);
    this.timer = setInterval(()=>{
      if(this.steps<=10) this.blocked = true;
      if(this.steps>0){
        this.steps -=1;
      }else{
        this.steps = 0;
        clearInterval(this.timer);
      }
    },1000);
  }
  //-------------------------
  createTicket():void{
    this.ticket = {
      ticketid:DexieService.config.ticket,
      roundid:DexieService.config.round,
      bets:[],
      date:new Date(),
      claimed:false,
    };
  }
  randomDeg():number{
    return this.numberPicker[Math.floor(Math.random()*37)];
  }
  //-------------------------------

}
