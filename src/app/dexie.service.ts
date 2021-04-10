import {
  Injectable
} from '@angular/core';
import Dexie, {Table} from 'dexie';

export interface Config{
  id?:number;
  round:number;
  ticket:number;
}
export interface Round{
  id?:number;
  winner:number;
  date:Date;
}
export interface Bet{
  pick:number;
  stake:number;
}
export interface Ticket{
  id?:number;
  bets:Bet[];
  claimed:boolean;
  roundid:number;
  ticketid:number;
  date:Date;
}
@Injectable({
  providedIn: 'root'
})
export class DexieService {
  private static orderdb: Dexie=null;
  private static VERSION_1_O = 1;
  public static config:Config ={
    id:1,
    round:1,
    ticket:1,
  };
  constructor() {
    if(DexieService.orderdb === null) this.init();
  }
  init():void {
    DexieService.orderdb = new Dexie('orderdb', {
      autoOpen: true
    });
    DexieService.orderdb.version(DexieService.VERSION_1_O).stores({
      round: '++id, winner, date',
      ticket: '++id,ticketid ,roundid, bets, claimed, date',
    });
    this.initConfig().then();
  }
  async initConfig():Promise<Config>{
    const round:Table<Round,number> =this.getTable('round');
    return round.toCollection().last().then(r=>{
      if(r!==undefined) {
        DexieService.config.round=r.id+1;
        this.getTicketByRound(r.id).then(ts=>{
          if(ts.length>0) DexieService.config.ticket = ts.reverse()[0].ticketid+1;
        });
      }
      return DexieService.config;
    }
    );
  }
  async createRound(round:Round):Promise<number>{
    const table:Table<Round,number> =this.getTable('round');
    return table.add(round).then(id=>{
      DexieService.config.round=id+1;
      DexieService.config.ticket = 1;
      return id;
    }).catch(err=>{
      console.log(`err while creating round: ${err}`);
      throw new Error("failed to create the round");
    });
  }
  async createTicket(ticket:Ticket):Promise<number>{
    const table:Table<Ticket,number> =this.getTable('ticket');
    return table.add(ticket).then(id=>{
      DexieService.config.ticket++;
      return id;
    }).catch(err=>{
      console.log(`err while creating ticket: ${err}`);
      throw new Error("failed to create the ticket");
    });
  }
  async getTicket(id:number):Promise<Ticket>{
    const table:Table<Ticket,number> = this.getTable("ticket");
    return table.where({id:id}).toArray().then((ts:Ticket[])=>{
      if(ts.length>0) return ts[0];
      else null;
    }).catch(err => {
      console.log(`error while fetching ticket by id ${err} for ${id}`);
      throw new Error("Failed to get the Ticket ");
    });
  }
  async getRound(id:number):Promise<Round>{
    const table:Table<Round,number> = this.getTable("round");
    return table.where({id:id}).toArray().then((ts:Round[])=>{
      if(ts.length>0) return ts[0];
      else null;
    }).catch(err => {
      console.log(`error while fetching round by id ${err} for ${id}`);
      throw new Error("Failed to get the Round ");
    });
  }
  async getTickets():Promise<Ticket[]>{
    const table:Table<Ticket,number> = this.getTable("ticket");
    return table.toArray().then((ts:Ticket[])=>{
      return ts;
    }).catch(err => {
      console.log(`error while fetching tickets${err}`);
      throw new Error("Failed to get the Tickets ");
    });
  }
  async getRounds():Promise<Round[]>{
    const table:Table<Round,number> = this.getTable("round");
    return table.toArray().then((ts:Round[])=>{
      return ts.reverse();
    }).catch(err => {
      console.log(`error while fetching tickets${err}`);
      throw new Error("Failed to get the Tickets ");
    });
  }
  async getTicketByRound(roundid:number):Promise<Ticket[]>{
    const table:Table<Ticket,number> = this.getTable("ticket");
    return table.where({roundid:roundid}).toArray().then((ts:Ticket[])=>{
      return ts;
    }).catch(err => {
      console.log(`error while fetching ticket by roundid ${err} for ${roundid}`);
      throw new Error("Failed to get the Ticket by round ");
    });
  }
  async getOpenTicket():Promise<Ticket[]>{
    return this.getTicketByRound(DexieService.config.round);
  }
  getTable < T, IndexableType > (schema: string): Table < T, IndexableType > {
    return DexieService.orderdb.table(schema);
  }
  close():void{
    DexieService.orderdb.close();
  }
}
