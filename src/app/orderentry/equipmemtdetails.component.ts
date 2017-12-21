import { MatDialogRef } from '@angular/material';
import { Component} from '@angular/core';

@Component({
    selector: 'equip-details',
    template: `
        <div md-dialog-content style="width: 800px; padding: 0 5px;">
            <div class="widget-grid panel-nobox">
                <nav class="navbar navbar-toggleable-md navbar-inverse bg-primary">
                    <span class="text-nowrap">Equipment Properties</span>
                </nav>
                <form>
                    <div fxLayout="row" class="rmargin">
                        <div class="form-group" fxFlex="flex">
                            <label for="eqdbrand">Brand</label>
                            <input type="text" auto-complete list-formatter="fid" display-property-name="fid" select-value-of="fid" class="form-control" id="eqdbrand" [source]="pcnames" [(ngModel)]="sodetails.fbrand" [ngModelOptions]="{standalone: true}" required>
                        </div>
                        <div class="form-group lmargin" fxFlex="flex">
                            <label for="eqdfmodel">Model</label>
                            <input type="text" pcdrUpperCase class="form-control" id="eqdfmodel" placeholder="" [(ngModel)]="sodetails.fmodel" [ngModelOptions]="{standalone: true}" required>
                        </div>
                    </div>
                    <div fxLayout="row" class="rmargin">
                        <div class="form-group" fxFlex="flex">
                            <label for="eqdType">Type</label>
                            <select id="eqdType" [(ngModel)]="sodetails.fpctype" [ngModelOptions]="{standalone: true}" class="form-control" required>
                                <option *ngFor="let opt of pctypes" [value]="opt.fid">
                                    {{opt.fdescription}}
                                </option>
                            </select>
                        </div>
                        <div class="form-group lmargin" fxFlex="flex">
                            <label for="eqdpassword">Password</label>
                            <input type="text" class="form-control" id="eqdpassword" placeholder="" [(ngModel)]="sodetails.fpassword" [ngModelOptions]="{standalone: true}">
                        </div>
                    </div>
                    <div fxLayout="row" class="rmargin">
                        <div class="form-group" fxFlex="flex">
                            <label for="eqdfproblem">Visible Issues</label>
                            <input type="text" class="form-control" id="eqdfproblem" placeholder="" [(ngModel)]="sodetails.fproblem" [ngModelOptions]="{standalone: true}">
                        </div>
                    </div>
                    <div fxLayout="row" class="rmargin">
                        <div class="form-group" fxFlex="flex">
                            <label for="eqdfnote">Internal Notes</label>
                            <input type="text" class="form-control" id="eqdfnote" placeholder="" [(ngModel)]="sodetails.fnote" [ngModelOptions]="{standalone: true}">
                        </div>
                    </div>
                    <div style="height: 40px;">
                        <md-checkbox [(ngModel)]="sodetails.fnocharger" [ngModelOptions]="{standalone: true}" class="text-nowrap" Xstyle="margin-top: 10px">NO CHARGER</md-checkbox>
                    </div>
                    <div fxLayout="row" class="rmargin">
                        <div class="form-group" fxFlex="flex">
                            <label for="eqdfnote">Completed</label>
                            <input type='date' [ngModel]="sodetails.ffinishdate | date:'yyyy-MM-dd'" [ngModelOptions]="{standalone: true}" (ngModelChange)="sodetails.ffinishdate = $event" class="form-control"/>
                        </div>
                        <div class="form-group lmargin" fxFlex="flex">
                            <label for="eqdfpickdate">Picked</label>
                            <input type='date' [ngModel]="sodetails.fpickdate | date:'yyyy-MM-dd'" [ngModelOptions]="{standalone: true}" (ngModelChange)="sodetails.fpickdate = $event" class="form-control"/>
                        </div>
                        <div class="form-group lmargin" fxFlex="flex">
                            <label for="eqdfbackup">Backup</label>
                            <input type="text" class="form-control" id="eqdfbackup" value="{{sodetails.fbackup}}" readonly>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <div md-dialog-actions class="modal-footer">
            <!--<button type="button" class="btn btn-secondary" (click)="dialogRef.close('')">Cancel</button>-->
            <button type="button" class="btn btn-primary" type="submit" (click)="onYes()">Continue</button>
        </div>
    `,
})

export class EquipDetails {
    pcnames: any[];
    pctypes: any[];
    sodetails = {};

    constructor(public dialogRef: MatDialogRef<EquipDetails>) {}

    onYes() {
        this.dialogRef.close();
    }
}
