import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiService } from './services/api.service';
import { CommonModule } from '@angular/common'; // needed to use *ngIf and interpolation

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'client';
  backendMessage = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getHello().subscribe({
      next: (res: any) => {
        this.backendMessage = res;
        console.log('Backend says:', res);
      },
      error: (err) => {
        console.error('Error contacting backend:', err);
      }
    });
  }
}
