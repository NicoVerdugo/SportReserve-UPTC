import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { Header } from '../../shared/components/header/header';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, Sidebar, Header],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout implements OnInit, OnDestroy {
  private breakpointObserver = inject(BreakpointObserver);
  private bpSub!: Subscription;

  sidebarOpen = signal(true);

  ngOnInit(): void {
    this.bpSub = this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe(result => {
        this.sidebarOpen.set(!result.matches);
      });
  }

  ngOnDestroy(): void {
    this.bpSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }
}
