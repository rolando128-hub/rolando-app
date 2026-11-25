
import { Component, ChangeDetectorRef } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonList,
  IonLabel,
  IonReorder,
  IonReorderGroup
} from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Preferences } from '@capacitor/preferences';
import { Alert } from '../services/alert';
import { addIcons } from 'ionicons';
import {
  addOutline,
  createOutline,
  trashOutline,
  checkmarkOutline,
  closeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonList,
    IonLabel,
    IonReorder,
    IonReorderGroup,
    FormsModule
  ],
})
export class HomePage {

  public task: string = '';

  public tasks: string[] = [
    'Comprar Leche',
    'Dormir',
    'Descansar',
    'Estudiar',
    'Ver la Novela'
  ];

  public editingIndex: number = -1;
  public editingTask: string = '';

  constructor(
    private alertService: Alert,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      addOutline,
      createOutline,
      trashOutline,
      checkmarkOutline,
      closeOutline
    });
  }

  async ngOnInit() {
    await this.loadTasks();
    this.cdr.detectChanges();
  }

  async addTask() {
    const nuevaTarea = this.task.trim();

    if (nuevaTarea === '') {
      return;
    }

    if (this.ifExistTask(nuevaTarea)) {
      this.alertService.alertMessage(
        'Aviso',
        'Esta tarea ya existe.',
        'Aceptar'
      );
      return;
    }

    this.tasks = [...this.tasks, nuevaTarea];
    this.task = '';

    this.cdr.detectChanges();

    await this.saveTasks();
  }

  private ifExistTask(task: string): boolean {
    return this.tasks.some(
      tarea => tarea.toLowerCase() === task.toLowerCase()
    );
  }

  editTask(index: number): void {
    this.editingIndex = index;
    this.editingTask = this.tasks[index];
  }

  async saveTask(index: number) {
    const tareaEditada = this.editingTask.trim();

    if (tareaEditada === '') {
      return;
    }

    const existe = this.tasks.some(
      (tarea, i) =>
        i !== index &&
        tarea.toLowerCase() === tareaEditada.toLowerCase()
    );

    if (existe) {
      this.alertService.alertMessage(
        'Aviso',
        'Esta tarea ya existe.',
        'Aceptar'
      );
      return;
    }

    this.tasks[index] = tareaEditada;
    this.tasks = [...this.tasks];

    await this.saveTasks();

    this.cancelEdit();
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    this.editingIndex = -1;
    this.editingTask = '';
  }

  async deleteTask(index: number) {
    this.tasks.splice(index, 1);
    this.tasks = [...this.tasks];

    if (this.editingIndex === index) {
      this.cancelEdit();
    } else if (this.editingIndex > index) {
      this.editingIndex--;
    }

    this.cdr.detectChanges();

    await this.saveTasks();
  }

  async reordenarTareas(event: CustomEvent) {
    const movimiento = event.detail as {
      from: number;
      to: number;
      complete: (lista?: string[]) => string[] | void;
    };

    const tareasReordenadas = movimiento.complete([...this.tasks]);

    if (Array.isArray(tareasReordenadas)) {
      this.tasks = tareasReordenadas;
    } else {
      const tareasActualizadas = [...this.tasks];
      const [tareaMovida] = tareasActualizadas.splice(movimiento.from, 1);

      tareasActualizadas.splice(movimiento.to, 0, tareaMovida);

      this.tasks = tareasActualizadas;
    }

    await this.saveTasks();
    this.cdr.detectChanges();
  }

  async saveTasks() {
    await Preferences.set({
      key: 'mis_tareas',
      value: JSON.stringify(this.tasks)
    });
  }

  async loadTasks() {
    const guardado = await Preferences.get({
      key: 'mis_tareas'
    });

    if (guardado.value !== null) {
      try {
        const tareas = JSON.parse(guardado.value);

        if (Array.isArray(tareas)) {
          this.tasks = tareas
            .map((tarea: unknown) => {
              if (typeof tarea === 'string') {
                return tarea;
              }

              if (
                typeof tarea === 'object' &&
                tarea !== null &&
                'nombre' in tarea &&
                typeof tarea.nombre === 'string'
              ) {
                return tarea.nombre;
              }

              return null;
            })
            .filter(
              (tarea): tarea is string => tarea !== null
            );

          return;
        }
      } catch {
      }
    }

    const anterior = localStorage.getItem('mis_tareas');

    if (anterior !== null) {
      try {
        const tareas = JSON.parse(anterior);

        if (Array.isArray(tareas)) {
          this.tasks = tareas
            .map((tarea: unknown) => {
              if (typeof tarea === 'string') {
                return tarea;
              }

              if (
                typeof tarea === 'object' &&
                tarea !== null &&
                'nombre' in tarea &&
                typeof tarea.nombre === 'string'
              ) {
                return tarea.nombre;
              }

              return null;
            })
            .filter(
              (tarea): tarea is string => tarea !== null
            );

          await this.saveTasks();
          return;
        }
      } catch {
      }
    }

    this.tasks = [
      'Comprar Leche',
      'Dormir',
      'Descansar',
      'Estudiar',
      'Ver la Novela'
    ];

    await this.saveTasks();
  }
}
