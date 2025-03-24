import { Injectable, signal } from '@angular/core';
import { Epi, GenerateRandomEpi } from '../model/epi';
import { EpiDataSource } from './dataSource';
import { MatTableDataSource } from '@angular/material/table';

@Injectable({
  providedIn: 'root'
})
export class DataModelService {

  private epis : Epi[] = [];

  public epiSource = new MatTableDataSource(this.epis);

  constructor() {
    for(let i= 0 ; i < 15; i++) {
      this.epis.push(GenerateRandomEpi());
    }
   }

   public addEpi(){
    this.epis.unshift(GenerateRandomEpi());
    this.epiSource.data = this.epis;
   }

}
