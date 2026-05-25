import {
  Component,
  input,
  output,
  signal,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  afterNextRender,
} from '@angular/core';

export interface ContextMenuItem {
  id: string;
  label: string;
  action: () => void;
  danger?: boolean;
}

@Component({
  selector: 'app-context-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isVisible()) {
      
      <div
        class="fixed inset-0 z-50"
        (click)="dismiss()"
        (contextmenu)="$event.preventDefault(); dismiss()"
      ></div>

      
      <div
        #menuEl
        class="fixed z-50 min-w-[160px] bg-surface-2 border border-border rounded-[4px] py-1 shadow-xl"
        [style.left.px]="adjustedX()"
        [style.top.px]="adjustedY()"
        (click)="$event.stopPropagation()"
      >
        @for (item of items(); track item.id) {
          <button
            (click)="execute(item)"
            class="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors first:rounded-t-[4px] last:rounded-b-[4px]"
            [class.text-destructive]="item.danger"
            [class.hover:bg-surface-hover]="!item.danger"
            [class.hover:bg-destructive-bg]="item.danger"
            [class.text-text]="!item.danger"
          >
            {{ item.label }}
          </button>
        }
      </div>
    }
  `,
})
export class ContextMenuComponent {
  @ViewChild('menuEl') menuEl!: ElementRef<HTMLElement>;

  readonly items = input<ContextMenuItem[]>([]);
  readonly isVisible = signal(false);
  readonly x = signal(0);
  readonly y = signal(0);
  readonly adjustedX = signal(0);
  readonly adjustedY = signal(0);

  readonly closed = output<void>();

  open(clientX: number, clientY: number): void {
    this.x.set(clientX);
    this.y.set(clientY);
    this.adjustedX.set(clientX);
    this.adjustedY.set(clientY);
    this.isVisible.set(true);

    afterNextRender(() => {
      this.adjustPosition();
    });
  }

  private adjustPosition(): void {
    const el = this.menuEl?.nativeElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = this.x();
    let top = this.y();

    if (left + rect.width > vw - 8) {
      left = vw - rect.width - 8;
    }
    if (top + rect.height > vh - 8) {
      top = vh - rect.height - 8;
    }

    this.adjustedX.set(left);
    this.adjustedY.set(top);
  }

  dismiss(): void {
    this.isVisible.set(false);
    this.closed.emit();
  }

  execute(item: ContextMenuItem): void {
    item.action();
    this.dismiss();
  }
}
