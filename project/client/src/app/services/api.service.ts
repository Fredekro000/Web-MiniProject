import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private backendUrl = 'http://localhost:5000'; // Express backend

  constructor(private http: HttpClient) {}

  getHello(): Observable<any> {
    return this.http.get(`${this.backendUrl}/`);
  }
}
