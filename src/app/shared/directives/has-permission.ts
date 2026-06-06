import { Directive, TemplateRef, ViewContainerRef, input, inject, effect } from '@angular/core';
import { AuthService } from '../../core/services/auth';
import { UserRole } from '../../core/models/user.model';

@Directive({ selector: '[appHasPermission]', standalone: true })
export class HasPermission {
  private templateRef = inject(TemplateRef);
  private vcr = inject(ViewContainerRef);
  private authService = inject(AuthService);

  appHasPermission = input<UserRole | UserRole[]>('USER');

  constructor() {
    effect(() => {
      const required = this.appHasPermission();
      const userRole = this.authService.currentUser()?.role;
      const roles = Array.isArray(required) ? required : [required];

      this.vcr.clear();
      if (userRole && roles.includes(userRole)) {
        this.vcr.createEmbeddedView(this.templateRef);
      }
    });
  }
}
