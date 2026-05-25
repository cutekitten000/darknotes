import { Component, output, ChangeDetectionStrategy } from '@angular/core';
import { LucideFolder } from '@lucide/angular';

@Component({
  selector: 'app-empty-folder-state',
  standalone: true,
  imports: [LucideFolder],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-folder-state.component.html',
})
export class EmptyFolderStateComponent {
  readonly createFolder = output<void>();

  onCreate(): void {
    this.createFolder.emit();
  }
}
