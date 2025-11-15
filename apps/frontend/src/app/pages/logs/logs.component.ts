/* eslint-disable @angular-eslint/prefer-inject */
import { Component, OnInit } from '@angular/core';
import { LogsService } from '../../services/logs.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logs',
  imports: [CommonModule],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css']
})
export class LogsComponent implements OnInit {
  logs: any[] = [];
  loading = false;

  constructor(private logsService: LogsService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs() {
    this.loading = true;
    this.logsService.getLogs().subscribe({
      next: (res: any) => { this.logs = res || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
