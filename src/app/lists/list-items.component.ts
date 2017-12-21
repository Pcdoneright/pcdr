import { MatDialogRef } from '@angular/material';
import { Component, AfterViewInit } from '@angular/core';
import {w2uiHelperService} from '../services/w2uiHelper.service';
import { CompanyService } from '../services/company.service';
import { DataService } from '../services/data.service';

@Component({
    selector: 'list-items',
    template: `
        <div md-dialog-content style="width: 800px; padding: 0 5px;">
            <div layout="column" class="widget-grid panel-nobox">
                <nav class="navbar navbar-toggleable-md navbar-inverse bg-primary">
                    <span style="white-space: nowrap;">Item List</span>
                    <div class="container"></div>
                    <span style="white-space: nowrap;">Rows: {{itemsGridRows}}</span>
                </nav>
                <div id="litemsgrid01" style="height: 400px"></div>
            </div>
        </div>
        <div md-dialog-actions class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="dialogRef.close('')">Cancel</button>
            <button type="button" class="btn btn-primary" type="submit" (click)="onYes()">Select</button>
        </div>
    `
})
export class ListItems implements AfterViewInit{
    itemsGrid: any;
    itemsGridRows = 0;

    constructor(public dialogRef: MatDialogRef<ListItems>, private w2uiH: w2uiHelperService, private DataSvc: DataService, private CompanySvc: CompanyService) {}

    ngAfterViewInit() {
        this.initGrids();
        $(document).ready(() => {
            this.w2uiH.gridInit(this.itemsGrid); // Set Default Values & Prepare
            this.DataSvc.serverDataGet('api/ItemMaint/GetList').subscribe((dataResponse) => {
                this.itemsGridRows = dataResponse.length;
                this.w2uiH.gridLoad(this.itemsGrid, dataResponse);
            });
        });
    }

    onYes() {
        let row = this.w2uiH.getGridSelectecRow(this.itemsGrid);
        this.dialogRef.close(row);
    }

    initGrids() {
        // w2ui
        this.itemsGrid = {
            name: 'litemsgrid01',
            columns: [
                {field: "fitemid", caption: "Item", size: 120},
                {field: "fdescription", caption: "Description", size: 300},
                {field: "finternal", caption: "Internal", size: 300},
                {field: "fprice", caption: "Price", size: 90, render: (record) => {
                    return this.CompanySvc.currencyRenderer({value: record.fprice});
                }},
                {field: "cfcategory", caption: "Category", size: 120}
            ]
        };
    }
}
