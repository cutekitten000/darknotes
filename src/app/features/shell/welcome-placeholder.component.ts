import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-welcome-placeholder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './welcome-placeholder.component.html',
})
export class WelcomePlaceholderComponent {}
