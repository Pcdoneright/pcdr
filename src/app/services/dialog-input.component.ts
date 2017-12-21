import { MatDialogRef } from '@angular/material';
import { Component } from '@angular/core';

@Component({
    selector: 'input-dialog',
    template: `
        <h1 md-dialog-title style="min-width: 350px">{{ title }}</h1>
        <div md-dialog-content>
            <div class="form-group">
            <label for="usr">{{ message }}:</label>
            <input type="text" class="form-control" [(ngModel)]="textValue">
            </div>
        </div>
        <div md-dialog-actions class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="dialogRef.close('')">{{ no }}</button>
            <button type="button" class="btn btn-primary" type="submit" (click)="onYes()">{{ yes }}</button>
        </div>
    `,
})
export class InputDialog {
    public title: string;
    public message: string;
    public yes: string;
    public no: string;
    textValue: string;

    constructor(public dialogRef: MatDialogRef<InputDialog>) {}

    onYes() {
        // Return only with proper value
        if (this.textValue) {
            this.dialogRef.close(this.textValue);
        }
    }
}