import { MatDialogRef } from '@angular/material';
import { Component, AfterViewInit } from '@angular/core';
import {w2uiHelperService} from '../services/w2uiHelper.service';

@Component({
    selector: 'equipment-history',
    template: `
        <div md-dialog-content style="width: 600px; padding: 0 5px;">
            <div layout="column" class="widget-grid panel-nobox">
                <nav class="navbar navbar-toggleable-md navbar-inverse bg-primary">
                    <span style="white-space: nowrap;">Equipment History List</span>
                    <div class="container"></div>
                    <span style="white-space: nowrap;">Rows: {{itemsGridData.length}}</span>
                </nav>
                <div id="ehlgrid01" style="height: 400px"></div>
            </div>
        </div>
        <div md-dialog-actions class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="dialogRef.close('')">Cancel</button>
            <button type="button" class="btn btn-primary" type="submit" (click)="onYes()">Select</button>
        </div>
    `,
})
export class EquipmentHistoryList implements AfterViewInit{
    itemsGrid: any;
    itemsGridData = [];

    constructor(public dialogRef: MatDialogRef<EquipmentHistoryList>, private w2uiH: w2uiHelperService) {}

    ngAfterViewInit() {
        this.initGrids();
        $(document).ready(() => {
            this.w2uiH.gridInit(this.itemsGrid); // Set Default Values & Prepare
            this.w2uiH.gridLoad(this.itemsGrid, this.itemsGridData);
        });
    }

    onYes() {
        let row = this.w2uiH.getGridSelectecRow(this.itemsGrid);
        this.dialogRef.close(row);
    }

    initGrids() {
        // w2ui
        this.itemsGrid = {
            name: 'ehlgrid01',
            columns: [
                {field: "cfpctype", caption: "Type", size: 100},
                {field: "fbrand", caption: "Brand", size: 250},
                {field: "fmodel", caption: "Model", size: 250}
            ]
        };
    }
}
