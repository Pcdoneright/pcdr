import { MatDialogRef } from '@angular/material';
import { Component } from '@angular/core';

@Component({
    selector: 'confirm-dialog',
    template: `
        <h1 md-dialog-title style="min-width: 250px">{{ title }}</h1>
        <div md-dialog-content>{{ message }}</div>
        <div md-dialog-actions class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="dialogRef.close(false)">{{ no }}</button>
            <button type="button" class="btn btn-primary" (click)="dialogRef.close(true)">{{ yes }}</button>
        </div>
    `,
    // <button md-button (click)="dialogRef.close('Option 1')">Option 1</button>
    // <button md-button (click)="dialogRef.close('Option 2')">Option 2</button>
})
export class ConfirmDialog {
    public title: string;
    public message: string;
    public yes: string;
    public no: string;

    constructor(public dialogRef: MatDialogRef<ConfirmDialog>) {}
}