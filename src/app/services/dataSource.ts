import { DataSource } from "@angular/cdk/table";
import { ReplaySubject, Observable } from "rxjs";
import { Epi } from "../model/epi";

export class EpiDataSource extends DataSource<Epi> {
    private _dataStream = new ReplaySubject<Epi[]>();
  
    constructor(initialData: Epi[]) {
      super();
      this.setData(initialData);
    }
  
    connect(): Observable<Epi[]> {
      return this._dataStream;
    }
  
    disconnect() {}
  
    setData(data: Epi[]) {
      this._dataStream.next(data);
    }
  }