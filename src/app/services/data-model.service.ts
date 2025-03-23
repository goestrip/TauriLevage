import { Injectable, signal } from '@angular/core';
import { Epi } from '../model/epi';
import { EpiDataSource } from './dataSource';

@Injectable({
  providedIn: 'root'
})
export class DataModelService {

  private epis : Epi[] = [];

  public epiSource = new EpiDataSource(this.epis);

  constructor() {
    for(let i= 0 ; i < 5; i++) {
      this.epis.push(new Epi());
    }
   }

   public addEpi(){
    this.epis.push(new Epi());
    this.epiSource.setData(this.epis);
   }

}
