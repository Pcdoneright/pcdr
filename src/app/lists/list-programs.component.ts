import { MatDialogRef } from '@angular/material';
import { Component, AfterViewInit } from '@angular/core';
import {w2uiHelperService} from '../services/w2uiHelper.service';

@Component({
    selector: 'list-programs',
    template: `
        <!--<h1 md-dialog-title style="min-width: 350px">Program List</h1>-->
        <div md-dialog-content style="width: 450px; padding: 0 5px;">
            <div layout="column" class="widget-grid panel-nobox">
                <nav class="navbar navbar-toggleable-md navbar-inverse bg-primary">
                    <span style="white-space: nowrap;">Program List</span>
                    <div class="container"></div>
                    <span style="white-space: nowrap;">Rows: {{programsGridData.length}}</span>
                </nav>
                <div id="lprogrid01" style="height: 300px"></div>
            </div>
        </div>
        <div md-dialog-actions class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="dialogRef.close('')">Cancel</button>
            <button type="button" class="btn btn-primary" type="submit" (click)="onYes()">Select</button>
        </div>
    `,
})
export class ListPrograms implements AfterViewInit{
    programsGrid: any;
    programsGridData = [];

    constructor(public dialogRef: MatDialogRef<ListPrograms>, private w2uiH: w2uiHelperService) {}

    ngAfterViewInit() {
        this.initGrids();
        $(document).ready(() => {
            this.w2uiH.gridInit(this.programsGrid); // Set Default Values & Prepare
            this.w2uiH.gridLoad(this.programsGrid, this.programsGridData);
        });
    }

    onYes() {
        let row = this.w2uiH.getGridSelectecRow(this.programsGrid);
        this.dialogRef.close(row);
    }

    initGrids() {
        // w2ui
        this.programsGrid = {
            name: 'lprogrid01',
            columns: [
                {field: "fname", caption: "Program", size: 300}
            ]
        };
    }
}
